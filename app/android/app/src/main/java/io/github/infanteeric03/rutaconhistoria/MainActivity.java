package io.github.infanteeric03.rutaconhistoria;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        /* Abierta desde el coche con el móvil bloqueado: se muestra sobre la pantalla de bloqueo para poder empezar la ruta. */
        if (getIntent() != null && getIntent().getBooleanExtra("fromAuto", false)) {
            if (Build.VERSION.SDK_INT >= 27) { setShowWhenLocked(true); setTurnScreenOn(true); }
        }
        registerPlugin(SpeechDuckPlugin.class);
        registerPlugin(CarBluetoothPlugin.class);
        registerPlugin(CarAutoPlugin.class);
        super.onCreate(savedInstanceState);
        /* Android 13+: permiso para la notificación que mantiene el GPS con la pantalla apagada. */
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{ Manifest.permission.POST_NOTIFICATIONS }, 7001);
        }
    }
}
