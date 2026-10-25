package io.github.infanteeric03.rutaconhistoria;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

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
    private final List<PluginCall> waiting = new ArrayList<>();
    private final AudioManager.OnAudioFocusChangeListener focusListener = change -> { };

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
                @Override public void onDone(String id) { finished(); }
                @Override public void onError(String id) { finished(); }
                @Override public void onStop(String id, boolean interrupted) { finished(); }
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
        requestFocus();
        tts.setSpeechRate(rate);
        Bundle params = new Bundle();
        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume);
        if (flush) pending = 0;
        pending++;
        int r = tts.speak(text, flush ? TextToSpeech.QUEUE_FLUSH : TextToSpeech.QUEUE_ADD, params, UUID.randomUUID().toString());
        if (r != TextToSpeech.SUCCESS) { finished(); call.reject("No se pudo hablar"); return; }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (tts != null) tts.stop();
        synchronized (this) { pending = 0; }
        abandonFocus();
        notifyListeners("end", new JSObject());
        call.resolve();
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
