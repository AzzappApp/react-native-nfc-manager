package community.revteltech.nfc;

import android.content.Intent;
import android.nfc.cardemulation.HostApduService;
import android.os.Bundle;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import android.util.Log;
import android.content.ComponentName;
import android.nfc.cardemulation.CardEmulation;

public class HceService extends HostApduService {
    private static final String TAG = "HceService";
    public static final String ACTION_APDU_RECEIVED = "community.revteltech.nfc.ACTION_APDU_RECEIVED";
    public static final String EXTRA_SIMPLE_URL = "simple_url";
    public static final String EXTRA_RICH_DATA = "rich_data";

    private String simpleUrl;
    private String richData;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "HceService created");
    }

    @Override
    public byte[] processCommandApdu(byte[] commandApdu, Bundle extras) {
        if (commandApdu == null) {
            return ApduUtil.A_ERROR;
        }

        // Handle SELECT command
        if (ApduUtil.isSelectCommand(commandApdu)) {
            return ApduUtil.A_OK;
        }

        // Handle GET DATA command
        if (ApduUtil.isGetDataCommand(commandApdu)) {
            if (richData != null) {
                return ApduUtil.createResponse(richData);
            } else if (simpleUrl != null) {
                return ApduUtil.createResponse(simpleUrl);
            }
            return ApduUtil.A_ERROR;
        }

        return ApduUtil.A_ERROR;
    }

    @Override
    public void onDeactivated(int reason) {
        Log.d(TAG, "Deactivated: " + reason);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_APDU_RECEIVED.equals(intent.getAction())) {
            simpleUrl = intent.getStringExtra(EXTRA_SIMPLE_URL);
            richData = intent.getStringExtra(EXTRA_RICH_DATA);
            Log.d(TAG, "Content updated - Simple URL: " + simpleUrl + ", Rich Data: " + richData);
        }
        return START_STICKY;
    }
} 