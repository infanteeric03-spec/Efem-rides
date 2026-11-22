package io.github.infanteeric03.rutaconhistoria;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSArray;
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

    /** Lista de emisoras de radio que se ofrece en la pantalla del coche. */
    @PluginMethod
    public void setStations(PluginCall call) {
        java.util.List<String> names = new java.util.ArrayList<>();
        JSArray arr = call.getArray("names");
        if (arr != null) {
            for (int i = 0; i < arr.length(); i++) {
                try { names.add(arr.getString(i)); } catch (Exception e) { /* se ignora */ }
            }
        }
        RutaAutoService.stations = names;
        new Handler(Looper.getMainLooper()).post(() -> {
            RutaAutoService s = RutaAutoService.instance;
            if (s != null) s.notifyChildrenChanged("ruta_root");
        });
        call.resolve();
    }

    /** Imagen de fondo (PNG en base64) para la pantalla del coche; vacía quita el fondo. */
    @PluginMethod
    public void setBackground(PluginCall call) {
        String data = call.getString("image", "");
        Bitmap bmp = null;
        if (data != null && !data.isEmpty()) {
            try {
                byte[] raw = android.util.Base64.decode(data, android.util.Base64.DEFAULT);
                bmp = BitmapFactory.decodeByteArray(raw, 0, raw.length);
            } catch (Exception e) { bmp = null; }
        }
        RutaAutoService.background = bmp;
        new Handler(Looper.getMainLooper()).post(() -> {
            RutaAutoService s = RutaAutoService.instance;
            if (s != null) s.apply();
        });
        call.resolve();
    }
}
