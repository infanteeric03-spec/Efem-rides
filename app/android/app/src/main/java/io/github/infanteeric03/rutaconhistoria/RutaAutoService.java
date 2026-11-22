package io.github.infanteeric03.rutaconhistoria;

import android.graphics.Bitmap;
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
            @Override public void onSkipToNext() { fire("more"); }
            @Override public void onPlayFromMediaId(String mediaId, Bundle extras) { fire(mediaId); }
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

    private static void fire(String name) {
        ActionListener l = listener;
        if (l != null) l.onAction(name);
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
                | PlaybackStateCompat.ACTION_PLAY_PAUSE | PlaybackStateCompat.ACTION_SKIP_TO_NEXT;
        PlaybackStateCompat state = new PlaybackStateCompat.Builder()
                .setActions(actions)
                .setState(active ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED, 0, 1f)
                .addCustomAction(new PlaybackStateCompat.CustomAction.Builder("trip", tripOn ? "Parar ruta" : "Iniciar ruta", tripOn ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play).build())
                .addCustomAction(new PlaybackStateCompat.CustomAction.Builder("repeat", "Repetir", android.R.drawable.ic_menu_rotate).build())
                .addCustomAction(new PlaybackStateCompat.CustomAction.Builder("mute", muted ? "Activar voz" : "Silencio", muted ? android.R.drawable.ic_lock_silent_mode_off : android.R.drawable.ic_lock_silent_mode).build())
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
        if ("ruta_root".equals(parentId)) {
            MediaDescriptionCompat t = new MediaDescriptionCompat.Builder()
                    .setMediaId("trip")
                    .setTitle(tripOn ? "Parar ruta" : "Iniciar ruta")
                    .setSubtitle("Viaje")
                    .build();
            items.add(new MediaBrowserCompat.MediaItem(t, MediaBrowserCompat.MediaItem.FLAG_PLAYABLE));
            for (int i = 0; i < stations.size(); i++) {
                MediaDescriptionCompat d = new MediaDescriptionCompat.Builder()
                        .setMediaId("radio:" + i)
                        .setTitle(stations.get(i))
                        .setSubtitle("Radio")
                        .build();
                items.add(new MediaBrowserCompat.MediaItem(d, MediaBrowserCompat.MediaItem.FLAG_PLAYABLE));
            }
        }
        result.sendResult(items);
    }
}
