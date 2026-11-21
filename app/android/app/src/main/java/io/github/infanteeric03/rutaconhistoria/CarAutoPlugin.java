package io.github.infanteeric03.rutaconhistoria;

import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Puente entre la web y la pantalla de Android Auto (RutaAutoService). */
@CapacitorPlugin(name = "CarAuto")
public class CarAutoPlugin extends Plugin {

    @Override
    public void load() {
        RutaAutoService.listener = name -> {
            JSObject o = new JSObject();
            o.put("name", name);
            notifyListeners("action", o);
        };
    }

    @Override
    protected void handleOnDestroy() {
        RutaAutoService.listener = null;
    }

    /** Guarda el lugar y el dato actuales y si el viaje está en marcha. */
    @PluginMethod
    public void update(PluginCall call) {
        RutaAutoService.title = call.getString("title", "Ruta con Historia");
        RutaAutoService.text = call.getString("text", "");
        RutaAutoService.active = Boolean.TRUE.equals(call.getBoolean("active", false));
        new Handler(Looper.getMainLooper()).post(() -> {
            RutaAutoService s = RutaAutoService.instance;
            if (s != null) s.apply();
        });
        call.resolve();
    }
}
