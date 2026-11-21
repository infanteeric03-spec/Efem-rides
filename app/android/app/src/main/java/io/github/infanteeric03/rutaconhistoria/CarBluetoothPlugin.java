package io.github.infanteeric03.rutaconhistoria;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.List;

/**
 * Avisa a la web cuando un dispositivo Bluetooth (el coche) se conecta o se desconecta,
 * y permite elegir cuál es el coche entre los dispositivos emparejados.
 */
@CapacitorPlugin(
    name = "CarBluetooth",
    permissions = { @Permission(strings = { Manifest.permission.BLUETOOTH_CONNECT }, alias = "bt") }
)
public class CarBluetoothPlugin extends Plugin {

    private BroadcastReceiver receiver;

    private boolean needsPermission() {
        return Build.VERSION.SDK_INT >= 31 && getPermissionState("bt") != PermissionState.GRANTED;
    }

    @SuppressLint("MissingPermission")
    @Override
    public void load() {
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                BluetoothDevice d = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                if (action == null || d == null) return;
                JSObject o = new JSObject();
                o.put("address", d.getAddress());
                String name = "";
                try { name = d.getName(); } catch (SecurityException e) { /* sin permiso */ }
                o.put("name", name == null ? "" : name);
                if (BluetoothDevice.ACTION_ACL_CONNECTED.equals(action)) notifyListeners("connected", o);
                else if (BluetoothDevice.ACTION_ACL_DISCONNECTED.equals(action)) notifyListeners("disconnected", o);
            }
        };
        IntentFilter f = new IntentFilter();
        f.addAction(BluetoothDevice.ACTION_ACL_CONNECTED);
        f.addAction(BluetoothDevice.ACTION_ACL_DISCONNECTED);
        Context ctx = getContext();
        if (Build.VERSION.SDK_INT >= 33) ctx.registerReceiver(receiver, f, Context.RECEIVER_EXPORTED);
        else ctx.registerReceiver(receiver, f);
    }

    @Override
    protected void handleOnDestroy() {
        try { getContext().unregisterReceiver(receiver); } catch (Exception e) { /* ya quitado */ }
    }

    private BluetoothAdapter adapter() {
        BluetoothManager m = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        return m == null ? null : m.getAdapter();
    }

    /** Pide el permiso (Android 12 o superior) y devuelve si está concedido. */
    @PluginMethod
    public void ask(PluginCall call) {
        if (!needsPermission()) { JSObject o = new JSObject(); o.put("granted", true); call.resolve(o); return; }
        requestPermissionForAlias("bt", call, "askDone");
    }

    @PermissionCallback
    private void askDone(PluginCall call) {
        JSObject o = new JSObject();
        o.put("granted", !needsPermission());
        call.resolve(o);
    }

    /** Dispositivos Bluetooth ya emparejados con el móvil. */
    @SuppressLint("MissingPermission")
    @PluginMethod
    public void paired(PluginCall call) {
        if (needsPermission()) { call.reject("Falta el permiso de Bluetooth"); return; }
        BluetoothAdapter a = adapter();
        JSArray list = new JSArray();
        if (a != null) {
            try {
                for (BluetoothDevice d : a.getBondedDevices()) {
                    JSObject o = new JSObject();
                    o.put("address", d.getAddress());
                    o.put("name", d.getName() == null ? d.getAddress() : d.getName());
                    list.put(o);
                }
            } catch (SecurityException e) { call.reject("Falta el permiso de Bluetooth"); return; }
        }
        JSObject res = new JSObject();
        res.put("devices", list);
        call.resolve(res);
    }

    /** Dice si el dispositivo indicado está conectado ahora (por audio). */
    @SuppressLint("MissingPermission")
    @PluginMethod
    public void isConnected(PluginCall call) {
        final String address = call.getString("address", "");
        BluetoothAdapter a = adapter();
        if (a == null || needsPermission() || address == null || address.isEmpty()) {
            JSObject o = new JSObject(); o.put("connected", false); call.resolve(o); return;
        }
        try {
            boolean ok = a.getProfileProxy(getContext(), new BluetoothProfile.ServiceListener() {
                @Override
                public void onServiceConnected(int profile, BluetoothProfile proxy) {
                    boolean found = false;
                    try {
                        List<BluetoothDevice> l = proxy.getConnectedDevices();
                        for (BluetoothDevice d : l) if (address.equals(d.getAddress())) found = true;
                    } catch (SecurityException e) { /* sin permiso */ }
                    try { adapter().closeProfileProxy(profile, proxy); } catch (Exception e) { /* nada */ }
                    JSObject o = new JSObject(); o.put("connected", found); call.resolve(o);
                }
                @Override public void onServiceDisconnected(int profile) { }
            }, BluetoothProfile.A2DP);
            if (!ok) { JSObject o = new JSObject(); o.put("connected", false); call.resolve(o); }
        } catch (SecurityException e) {
            JSObject o = new JSObject(); o.put("connected", false); call.resolve(o);
        }
    }
}
