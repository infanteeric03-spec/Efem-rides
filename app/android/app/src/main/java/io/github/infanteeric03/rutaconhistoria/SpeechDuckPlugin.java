package io.github.infanteeric03.rutaconhistoria;

import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;
import android.speech.tts.UtteranceProgressListener;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Voz nativa que pide al sistema un foco de audio temporal "con atenuación"
 * (el mismo que usa la navegación): Spotify y otras apps bajan su volumen
 * mientras se habla y lo recuperan al terminar.
 */
@CapacitorPlugin(name = "SpeechDuck")
public class SpeechDuckPlugin extends Plugin implements TextToSpeech.OnInitListener {

    private TextToSpeech tts;
    private boolean ready = false;
    private AudioManager audio;
    private AudioAttributes attrs;
    private AudioFocusRequest focusRequest;
    private boolean hasFocus = false;
    private int pending = 0;
    private String currentVoice = "";
    private final List<PluginCall> waiting = new ArrayList<>();
    /* Frases pendientes (la que suena y las siguientes), para poder repetirlas con otro volumen. */
    private static class Item { String id; String text; float base; int off = 0; }
    private final List<Item> queue = new ArrayList<>();
    private boolean duckedNow = false;
    private String navMode = "callar";   // qué hacer cuando habla el navegador: "callar" o "bajar"
    private float navPct = 0.6f;         // cuánto baja el volumen en modo "bajar" (0..1)

    /* Si otra app pide el foco para hablar (el aviso del navegador), el navegador manda:
       la voz se calla o baja el volumen, según el ajuste. */
    private final AudioManager.OnAudioFocusChangeListener focusListener = change -> {
        if (change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK && "bajar".equals(navMode)) {
            relaunch(1f - navPct);
            synchronized (this) { duckedNow = true; }
        } else if (change == AudioManager.AUDIOFOCUS_GAIN) {
            boolean was;
            synchronized (this) { was = duckedNow; duckedNow = false; }
            if (was) relaunch(1f);
        } else if (change == AudioManager.AUDIOFOCUS_LOSS
                || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT
                || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
            synchronized (this) { queue.clear(); pending = 0; duckedNow = false; }
            if (tts != null) tts.stop();
            hasFocus = false;
            notifyListeners("end", new JSObject());
        }
    };

    /** Vuelve a decir lo que queda por decir con otro volumen, sin repetir lo ya dicho. */
    private synchronized void relaunch(float factor) {
        if (tts == null || queue.isEmpty()) return;
        List<Item> rest = new ArrayList<>();
        boolean first = true;
        for (Item it : queue) {
            String t = it.text;
            if (first) { t = t.substring(Math.min(Math.max(it.off, 0), t.length())); first = false; }
            if (t.trim().isEmpty()) continue;
            Item n = new Item();
            n.id = UUID.randomUUID().toString(); n.text = t; n.base = it.base;
            rest.add(n);
        }
        queue.clear();
        queue.addAll(rest);
        pending = queue.size();
        tts.stop();
        boolean flush = true;
        for (Item n : queue) {
            Bundle params = new Bundle();
            params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, Math.max(0.02f, Math.min(1f, n.base * factor)));
            tts.speak(n.text, flush ? TextToSpeech.QUEUE_FLUSH : TextToSpeech.QUEUE_ADD, params, n.id);
            flush = false;
        }
        if (queue.isEmpty()) { abandonFocus(); notifyListeners("end", new JSObject()); }
    }

    private synchronized boolean take(String id) {
        for (int i = 0; i < queue.size(); i++) if (queue.get(i).id.equals(id)) { queue.remove(i); return true; }
        return false;
    }

    @Override
    public void load() {
        Context ctx = getContext();
        audio = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
        attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build();
        tts = new TextToSpeech(ctx, this);
    }

    @Override
    public void onInit(int status) {
        ready = status == TextToSpeech.SUCCESS;
        if (ready) {
            int r = tts.setLanguage(new Locale("es", "ES"));
            if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) tts.setLanguage(new Locale("es"));
            tts.setAudioAttributes(attrs);
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) { notifyListeners("start", new JSObject()); }
                @Override public void onRangeStart(String id, int start, int end, int frame) {
                    synchronized (SpeechDuckPlugin.this) { for (Item it : queue) if (it.id.equals(id)) { it.off = start; break; } }
                }
                @Override public void onDone(String id) { if (take(id)) finished(); }
                @Override public void onError(String id) { if (take(id)) finished(); }
                @Override public void onStop(String id, boolean interrupted) { if (take(id)) finished(); }
            });
        }
        List<PluginCall> calls = new ArrayList<>(waiting);
        waiting.clear();
        for (PluginCall c : calls) {
            if (ready) doSpeak(c); else c.reject("La voz del sistema no está disponible");
        }
    }

    private synchronized void finished() {
        pending = Math.max(0, pending - 1);
        if (pending == 0) {
            abandonFocus();
            notifyListeners("end", new JSObject());
        }
    }

    private void requestFocus() {
        if (hasFocus || audio == null) return;
        int res;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (focusRequest == null) {
                focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                        .setAudioAttributes(attrs)
                        .setOnAudioFocusChangeListener(focusListener)
                        .setWillPauseWhenDucked(true)   // sin esto Android baja el volumen solo y no avisa: la voz seguiría hablando
                        .build();
            }
            res = audio.requestAudioFocus(focusRequest);
        } else {
            res = audio.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
        }
        hasFocus = res == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    }

    private void abandonFocus() {
        if (!hasFocus || audio == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) audio.abandonAudioFocusRequest(focusRequest);
        else audio.abandonAudioFocus(focusListener);
        hasFocus = false;
    }

    @PluginMethod
    public void speak(PluginCall call) {
        if (!ready) { waiting.add(call); return; }
        doSpeak(call);
    }

    private synchronized void doSpeak(PluginCall call) {
        String text = call.getString("text", "");
        if (text == null || text.isEmpty()) { call.resolve(); return; }
        float rate = call.getFloat("rate", 1f);
        float volume = call.getFloat("volume", 1f);
        boolean flush = Boolean.TRUE.equals(call.getBoolean("flush", false));
        String voiceName = call.getString("voice", "");
        String nav = call.getString("nav", "callar");
        navMode = "bajar".equals(nav) ? "bajar" : "callar";
        navPct = Math.max(0.1f, Math.min(0.95f, call.getFloat("duckPct", 60f) / 100f));
        if (voiceName != null && !voiceName.equals(currentVoice)) {
            try {
                Voice chosen = null;
                if (!voiceName.isEmpty() && tts.getVoices() != null) {
                    for (Voice v : tts.getVoices()) if (voiceName.equals(v.getName())) { chosen = v; break; }
                }
                if (chosen != null) tts.setVoice(chosen);
                else {
                    int r0 = tts.setLanguage(new Locale("es", "ES"));
                    if (r0 == TextToSpeech.LANG_MISSING_DATA || r0 == TextToSpeech.LANG_NOT_SUPPORTED) tts.setLanguage(new Locale("es"));
                }
                currentVoice = voiceName;
            } catch (Exception e) { /* se mantiene la voz actual */ }
        }
        requestFocus();
        tts.setSpeechRate(rate);
        Item it = new Item();
        it.id = UUID.randomUUID().toString(); it.text = text; it.base = volume;
        Bundle params = new Bundle();
        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, Math.max(0.02f, Math.min(1f, volume * (duckedNow ? 1f - navPct : 1f))));
        synchronized (this) {
            if (flush) { queue.clear(); pending = 0; }
            queue.add(it);
            pending++;
        }
        int r = tts.speak(text, flush ? TextToSpeech.QUEUE_FLUSH : TextToSpeech.QUEUE_ADD, params, it.id);
        if (r != TextToSpeech.SUCCESS) { take(it.id); finished(); call.reject("No se pudo hablar"); return; }
        call.resolve();
    }

    /** Voces en español instaladas en el móvil. */
    @PluginMethod
    public void voices(PluginCall call) {
        JSArray list = new JSArray();
        if (ready && tts != null) {
            try {
                for (Voice v : tts.getVoices()) {
                    if (v.getLocale() == null || !"es".equalsIgnoreCase(v.getLocale().getLanguage())) continue;
                    JSObject o = new JSObject();
                    o.put("name", v.getName());
                    o.put("lang", v.getLocale().toLanguageTag());
                    o.put("local", !v.isNetworkConnectionRequired());
                    o.put("quality", v.getQuality());
                    list.put(o);
                }
            } catch (Exception e) { /* sin voces */ }
        }
        JSObject res = new JSObject();
        res.put("voices", list);
        res.put("ready", ready);
        call.resolve(res);
    }

    /** Abre los ajustes de texto a voz de Android, para instalar más voces. */
    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent i = new Intent("com.android.settings.TTS_SETTINGS");
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { getContext().startActivity(i); }
        catch (Exception e) {
            try {
                Intent j = new Intent(android.provider.Settings.ACTION_SETTINGS);
                j.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(j);
            } catch (Exception e2) { call.reject("No se pudieron abrir los ajustes"); return; }
        }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        synchronized (this) { queue.clear(); pending = 0; duckedNow = false; }
        if (tts != null) tts.stop();
        abandonFocus();
        notifyListeners("end", new JSObject());
        call.resolve();
    }

    /** Abre un enlace en el navegador del sistema (se usa para descargar la versión nueva). */
    @PluginMethod
    public void openUrl(PluginCall call) {
        String url = call.getString("url", "");
        if (url == null || !url.startsWith("https://")) { call.reject("Enlace no válido"); return; }
        try {
            android.content.Intent i = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
            i.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("No se pudo abrir el enlace");
        }
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject r = new JSObject();
        r.put("available", ready);
        call.resolve(r);
    }

    @Override
    protected void handleOnDestroy() {
        abandonFocus();
        if (tts != null) tts.shutdown();
    }
}
