package com.azzapp;

import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class AZPJSIModulesInstaller extends ReactContextBaseJavaModule {

    private static final String NAME = "AZPJSIModulesInstaller";

    public static ReactApplicationContext reactApplicationContext;

    public AZPJSIModulesInstaller(ReactApplicationContext context) {
        super(context);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public boolean install() {
        AZPJSIModulesInstaller.reactApplicationContext = getReactApplicationContext();
        System.loadLibrary("azzapp-app");
        JavaScriptContextHolder jsContext = getReactApplicationContext().getJavaScriptContextHolder();
        if (jsContext == null) {
            Log.e(NAME, "Failed to install azzapp-app JSI Bindings!");
            return false;
        }
        nativeInstall(jsContext.get());
        return true;
    }

    private native void nativeInstall(long jsiPtr);
}
