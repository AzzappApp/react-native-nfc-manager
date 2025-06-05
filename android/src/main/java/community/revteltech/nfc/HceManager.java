package community.revteltech.nfc;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.nfc.NfcAdapter;
import android.nfc.cardemulation.CardEmulation;
import android.nfc.cardemulation.HostApduService;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.List;
import org.json.JSONObject;

public class HceManager extends ReactContextBaseJavaModule {
    private static final String TAG = "HceManager";
    private final ReactApplicationContext mReactContext;
    private NfcAdapter mNfcAdapter;

    public HceManager(ReactApplicationContext reactContext) {
        super(reactContext);
        mReactContext = reactContext;
        mNfcAdapter = NfcAdapter.getDefaultAdapter(reactContext);
    }

    @Override
    public String getName() {
        return "HceManager";
    }

    @ReactMethod
    public void isHceSupported(Promise promise) {
        try {
            boolean isSupported = mNfcAdapter != null && mNfcAdapter.isEnabled();
            promise.resolve(isSupported);
        } catch (Exception e) {
            promise.reject("ERR_HCE_SUPPORT", e.getMessage());
        }
    }

    @ReactMethod
    public void isHceEnabled(Promise promise) {
        try {
            CardEmulation cardEmulation = CardEmulation.getInstance(mNfcAdapter);
            ComponentName componentName = new ComponentName(mReactContext, HceService.class);
            boolean isEnabled = cardEmulation.isDefaultServiceForCategory(componentName, CardEmulation.CATEGORY_PAYMENT);
            promise.resolve(isEnabled);
        } catch (Exception e) {
            promise.reject("ERR_HCE_ENABLED", e.getMessage());
        }
    }

    @ReactMethod
    public void setSimpleUrl(String url, Promise promise) {
        try {
            Intent intent = new Intent(HceService.ACTION_APDU_RECEIVED);
            intent.putExtra(HceService.EXTRA_SIMPLE_URL, url);
            mReactContext.sendBroadcast(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERR_SET_SIMPLE_URL", e.getMessage());
        }
    }

    @ReactMethod
    public void setRichContent(String url, String title, String description, String imageUrl, Promise promise) {
        try {
            Intent intent = new Intent(HceService.ACTION_APDU_RECEIVED);
            intent.putExtra(HceService.EXTRA_RICH_DATA, String.format(
                "{\"url\":\"%s\",\"title\":\"%s\",\"description\":\"%s\",\"imageUrl\":\"%s\"}",
                url, title, description, imageUrl
            ));
            mReactContext.sendBroadcast(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERR_SET_RICH_CONTENT", e.getMessage());
        }
    }

    @ReactMethod
    public void clearContent(Promise promise) {
        try {
            Intent intent = new Intent(HceService.ACTION_APDU_RECEIVED);
            intent.putExtra(HceService.EXTRA_SIMPLE_URL, (String) null);
            intent.putExtra(HceService.EXTRA_RICH_DATA, (String) null);
            mReactContext.sendBroadcast(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERR_CLEAR_CONTENT", e.getMessage());
        }
    }

    @ReactMethod
    public void setDefaultService(Promise promise) {
        try {
            CardEmulation cardEmulation = CardEmulation.getInstance(mNfcAdapter);
            ComponentName componentName = new ComponentName(mReactContext, HceService.class);
            boolean success = cardEmulation.setDefaultServiceForCategory(componentName, CardEmulation.CATEGORY_PAYMENT);
            promise.resolve(success);
        } catch (Exception e) {
            promise.reject("ERR_SET_DEFAULT_SERVICE", e.getMessage());
        }
    }

    @ReactMethod
    public void setVCardData(String vcardData, Promise promise) {
        if (mNfcAdapter == null || !mNfcAdapter.isEnabled()) {
            promise.reject("NFC_NOT_ENABLED", "NFC is not enabled");
            return;
        }

        try {
            Intent intent = new Intent(HceService.ACTION_APDU_RECEIVED);
            intent.putExtra(HceService.EXTRA_VCARD_DATA, vcardData);
            mReactContext.sendBroadcast(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("VCARD_SET_FAILED", "Failed to set vCard data: " + e.getMessage());
        }
    }

    @ReactMethod
    public void clearVCardData(Promise promise) {
        if (mNfcAdapter == null || !mNfcAdapter.isEnabled()) {
            promise.reject("NFC_NOT_ENABLED", "NFC is not enabled");
            return;
        }

        try {
            Intent intent = new Intent(HceService.ACTION_APDU_RECEIVED);
            intent.putExtra(HceService.EXTRA_VCARD_DATA, (String) null);
            mReactContext.sendBroadcast(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("VCARD_CLEAR_FAILED", "Failed to clear vCard data: " + e.getMessage());
        }
    }

    private void sendEvent(String eventName, WritableMap params) {
        mReactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
} 