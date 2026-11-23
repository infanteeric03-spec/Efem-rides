package io.github.infanteeric03.rutaconhistoria;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import androidx.core.content.ContextCompat;
import android.os.Bundle;
import android.support.v4.media.MediaBrowserCompat;
import android.support.v4.media.MediaDescriptionCompat;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.media.MediaBrowserServiceCompat;

import java.util.ArrayList;
import java.util.List;

/**
 * Presencia de la app en Android Auto como app de medios: muestra el lugar y el dato actual
 * y ofrece los botones "Otro dato", "Repetir" y "Silencio". La voz sigue saliendo de la app.
 */
public class RutaAutoService extends MediaBrowserServiceCompat {

    public interface ActionListener { void onAction(String name); }

    static RutaAutoService instance;
    static ActionListener listener;
    static String title = "Ruta con Historia";
    static String text = "Empieza el viaje en el móvil";
    static boolean active = false;
    static boolean tripOn = false;
    static boolean muted = false;
    static boolean radioOn = false;
    static Bitmap background = null;
    static List<String> stations = new ArrayList<>();

    private MediaSessionCompat session;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        session = new MediaSessionCompat(this, "RutaConHistoria");
        session.setCallback(new MediaSessionCompat.Callback() {
            @Override public void onCustomAction(String action, Bundle extras) { fire(action); }
            @Override public void onSkipToNext() { fire("next"); }
            @Override public void onSkipToPrevious() { fire("prev"); }
            @Override public void onPlayFromMediaId(String mediaId, Bundle extras) {
                if ("force:yes".equals(mediaId)) forceLaunch();
                else if ("force:no".equals(mediaId)) forceNo();
                else fire(mediaId);
            }
            @Override public void onPlay() { fire("play"); }
            @Override public void onPause() { fire("pause"); }
        });
        setSessionToken(session.getSessionToken());
        apply();
    }

    @Override
    public void onDestroy() {
        instance = null;
        if (session != null) { session.setActive(false); session.release(); }
        super.onDestroy();
    }

    /* Órdenes del coche que llegan con la app cerrada (la pantalla web no existe aún): se guardan y se ejecutan al abrir la app. */
    private static final List<String> pendingNames = new ArrayList<>();
    private static final List<Long> pendingTimes = new ArrayList<>();
    private static final long PENDING_MAX_MS = 10 * 60 * 1000L;

    private static synchronized void queueAction(String name) {
        if (!(name.equals("trip") || name.equals("play") || name.startsWith("radio:"))) return;   // solo las que tienen sentido más tarde
        int i = pendingNames.indexOf(name);
        if (i >= 0) { pendingNames.remove(i); pendingTimes.remove(i); if (name.equals("trip")) return; }   // dos pulsaciones de «viaje» se anulan
        pendingNames.add(name); pendingTimes.add(System.currentTimeMillis());
        while (pendingNames.size() > 3) { pendingNames.remove(0); pendingTimes.remove(0); }
        askForce = true;
        title = "La app está cerrada";
        text = "¿Forzar el inicio? Elígelo en la lista";
        refreshAll();
        RutaAutoService s = instance;
        if (s != null) new android.os.Handler(android.os.Looper.getMainLooper()).post(s::startCountdown);
    }

    /* Cuenta atrás de 10 s: si nadie contesta se asume «Sí» y se intenta abrir la app. «No» o abrir la app a mano la cancelan. */
    private final android.os.Handler cdH = new android.os.Handler(android.os.Looper.getMainLooper());
    private boolean cdActive = false;
    private int cdLeft = 0;
    private final Runnable cdTick = new Runnable() {
        @Override public void run() {
            if (!askForce) { cdActive = false; return; }
            if (cdLeft <= 0) { cdActive = false; forceLaunch(); return; }
            StringBuilder bar = new StringBuilder();
            for (int i = 0; i < 10; i++) bar.append(i < cdLeft ? "█" : "░");
            title = "La app está cerrada · empezando en " + cdLeft + " s";
            text = bar + "  Toca «No» para cancelar";
            apply();
            cdLeft--;
            cdH.postDelayed(this, 1000);
        }
    };
    void startCountdown() {
        if (cdActive || !askForce) return;
        cdActive = true; cdLeft = 10;
        cdH.post(cdTick);
    }

    /** true mientras el coche ofrece «Sí / No» para abrir la app cerrada. */
    static boolean askForce = false;

    private static void refreshAll() {
        final RutaAutoService s = instance;
        if (s == null) return;
        new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> { s.apply(); s.notifyChildrenChanged("ruta_root"); });
    }

    /** Entrega las órdenes guardadas (las caducadas se descartan). */
    static synchronized void flushPending(ActionListener l) {
        long now = System.currentTimeMillis();
        for (int i = 0; i < pendingNames.size(); i++) if (now - pendingTimes.get(i) <= PENDING_MAX_MS) l.onAction(pendingNames.get(i));
        pendingNames.clear(); pendingTimes.clear();
        if (askForce) { askForce = false; refreshAll(); }
    }

    /** «Sí»: intenta abrir la app (con el móvil bloqueado se muestra sobre la pantalla de bloqueo). */
    private void forceLaunch() {
        title = "Abriendo la app…"; text = "Un momento"; askForce = false; refreshAll();
        try {
            android.content.Intent i = new android.content.Intent(this, MainActivity.class);
            i.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK | android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP);
            i.putExtra("fromAuto", true);
            startActivity(i);
        } catch (Exception e) { /* se avisa más abajo si no llega a abrirse */ }
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            if (listener == null) {
                title = "No he podido abrir la app"; text = "Ábrela en el móvil y la orden se hará sola"; refreshAll();
            }
        }, 8000);
    }

    /** «No»: se descarta la orden guardada. */
    private void forceNo() {
        synchronized (RutaAutoService.class) { pendingNames.clear(); pendingTimes.clear(); }
        askForce = false; title = "Ruta con Historia"; text = "Empieza el viaje en el móvil"; refreshAll();
    }

    private static void fire(String name) {
        ActionListener l = listener;
        if (l != null) l.onAction(name); else queueAction(name);
    }

    /** Dibuja una silueta (vector) como imagen para la lista. */
    private Bitmap icon(int res) {
        Drawable d = ContextCompat.getDrawable(this, res);
        Bitmap b = Bitmap.createBitmap(96, 96, Bitmap.Config.ARGB_8888);
        if (d != null) { Canvas c = new Canvas(b); d.setBounds(0, 0, 96, 96); d.draw(c); }
        return b;
    }

    /** Refleja el estado actual en la sesión de medios. */
    void apply() {
        if (session == null) return;
        MediaMetadataCompat.Builder mb = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, text)
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "Ruta con Historia")
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, -1);
        if (background != null) {
            mb.putBitmap(MediaMetadataCompat.METADATA_KEY_ART, background);
            mb.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, background);
        }
        MediaMetadataCompat meta = mb.build();
        session.setMetadata(meta);
        long actions = PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE
                | PlaybackStateCompat.ACTION_PLAY_PAUSE | PlaybackStateCompat.ACTION_SKIP_TO_NEXT
                | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS;
        PlaybackStateCompat state = new PlaybackStateCompat.Builder()
                .setActions(actions)
                .setState(active ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED, 0, 1f)
                .addCustomAction(new PlaybackStateCompat.CustomAction.Builder("radio", radioOn ? "Apagar radio" : "Radio", R.drawable.ic_aa_radio).build())
                .addCustomAction(new PlaybackStateCompat.CustomAction.Builder("trip", tripOn ? "Parar ruta" : "Iniciar ruta", tripOn ? R.drawable.ic_aa_parar : R.drawable.ic_aa_iniciar).build())
                .addCustomAction(new PlaybackStateCompat.CustomAction.Builder("more", "Otro dato", R.drawable.ic_aa_dato).build())
                .addCustomAction(new PlaybackStateCompat.CustomAction.Builder("repeat", "Repetir", R.drawable.ic_aa_repetir).build())
                .addCustomAction(new PlaybackStateCompat.CustomAction.Builder("mute", muted ? "Activar voz" : "Silencio", muted ? R.drawable.ic_aa_voz : R.drawable.ic_aa_silencio).build())
                .build();
        session.setPlaybackState(state);
        session.setActive(active);
    }

    @Nullable
    @Override
    public BrowserRoot onGetRoot(@NonNull String clientPackageName, int clientUid, @Nullable Bundle rootHints) {
        return new BrowserRoot("ruta_root", null);
    }

    @Override
    public void onLoadChildren(@NonNull String parentId, @NonNull Result<List<MediaBrowserCompat.MediaItem>> result) {
        List<MediaBrowserCompat.MediaItem> items = new ArrayList<>();
        if ("ruta_root".equals(parentId) && askForce) {
            MediaDescriptionCompat y = new MediaDescriptionCompat.Builder().setMediaId("force:yes")
                    .setTitle("Sí, abrir la app y empezar").setSubtitle("Opción por defecto")
                    .setIconBitmap(icon(R.drawable.ic_aa_iniciar)).build();
            MediaDescriptionCompat n = new MediaDescriptionCompat.Builder().setMediaId("force:no")
                    .setTitle("No, esperar a abrirla yo").setSubtitle("Se descarta la orden")
                    .setIconBitmap(icon(R.drawable.ic_aa_parar)).build();
            items.add(new MediaBrowserCompat.MediaItem(y, MediaBrowserCompat.MediaItem.FLAG_PLAYABLE));
            items.add(new MediaBrowserCompat.MediaItem(n, MediaBrowserCompat.MediaItem.FLAG_PLAYABLE));
        } else if ("ruta_root".equals(parentId)) {
            MediaDescriptionCompat t = new MediaDescriptionCompat.Builder()
                    .setMediaId("trip")
                    .setTitle(tripOn ? "Parar ruta" : "Iniciar ruta")
                    .setSubtitle("Viaje")
                    .setIconBitmap(icon(tripOn ? R.drawable.ic_aa_parar : R.drawable.ic_aa_iniciar))
                    .build();
            items.add(new MediaBrowserCompat.MediaItem(t, MediaBrowserCompat.MediaItem.FLAG_PLAYABLE));
            for (int i = 0; i < stations.size(); i++) {
                MediaDescriptionCompat d = new MediaDescriptionCompat.Builder()
                        .setMediaId("radio:" + i)
                        .setTitle(stations.get(i))
                        .setSubtitle("Radio")
                        .setIconBitmap(icon(R.drawable.ic_aa_radio))
                        .build();
                items.add(new MediaBrowserCompat.MediaItem(d, MediaBrowserCompat.MediaItem.FLAG_PLAYABLE));
            }
        }
        result.sendResult(items);
    }
}
