package community.revteltech.nfc;

import android.content.Intent;
import android.nfc.cardemulation.HostApduService;
import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.os.Bundle;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import android.util.Log;
import android.content.ComponentName;
import android.nfc.cardemulation.CardEmulation;
import java.nio.charset.StandardCharsets;

public class HceService extends HostApduService {
    private static final String TAG = "HceService";
    public static final String ACTION_APDU_RECEIVED = "community.revteltech.nfc.ACTION_APDU_RECEIVED";
    public static final String EXTRA_SIMPLE_URL = "simple_url";
    public static final String EXTRA_RICH_DATA = "rich_data";

    private String simpleUrl;
    private String richData;
    private LocalBroadcastManager broadcastManager;

    @Override
    public void onCreate() {
        super.onCreate();
        broadcastManager = LocalBroadcastManager.getInstance(this);
        Log.d(TAG, "HceService created");
    }

    @Override
    public byte[] processCommandApdu(byte[] commandApdu, Bundle extras) {
        if (commandApdu == null) {
            return ApduUtil.A_ERROR;
        }

        Log.d(TAG, "Received APDU: " + ApduUtil.bytesToHex(commandApdu));

        // Handle SELECT command
        if (ApduUtil.isSelectCommand(commandApdu)) {
            Log.d(TAG, "SELECT command received");
            return ApduUtil.A_OK;
        }

        // Handle READ command for NDEF data
        if (ApduUtil.isReadCommand(commandApdu)) {
            Log.d(TAG, "READ command received");
            
            try {
                byte[] ndefData = null;
                
                if (simpleUrl != null) {
                    // Create NDEF record for URL
                    NdefRecord urlRecord = NdefRecord.createUri(simpleUrl);
                    NdefMessage ndefMessage = new NdefMessage(urlRecord);
                    ndefData = ndefMessage.toByteArray();
                } else if (richData != null) {
                    // Create NDEF record for rich content (as text for now)
                    NdefRecord textRecord = NdefRecord.createTextRecord("en", richData);
                    NdefMessage ndefMessage = new NdefMessage(textRecord);
                    ndefData = ndefMessage.toByteArray();
                }
                
                if (ndefData != null) {
                    Log.d(TAG, "Returning NDEF data: " + ndefData.length + " bytes");
                    return ApduUtil.createNdefResponse(ndefData);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error creating NDEF response: " + e.getMessage());
            }
            
            return ApduUtil.A_ERROR;
        }

        Log.d(TAG, "Unknown command");
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