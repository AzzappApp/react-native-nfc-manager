package community.revteltech.nfc;

import android.content.ComponentName;
import android.content.Intent;
import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.cardemulation.CardEmulation;
import android.nfc.cardemulation.HostApduService;
import android.os.Bundle;
import android.util.Log;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import android.nfc.NfcAdapter;
import java.util.List;
import java.util.ArrayList;
import org.json.JSONObject;
import org.json.JSONException;
import org.json.JSONArray;
import java.nio.charset.StandardCharsets;
import android.content.Context;

public class HceService extends HostApduService {
    private static final String TAG = "HceService";
    public static final String ACTION_APDU_RECEIVED = "community.revteltech.nfc.ACTION_APDU_RECEIVED";
    public static final String ACTION_HCE_STARTED = "community.revteltech.nfc.ACTION_HCE_STARTED";
    public static final String ACTION_HCE_STOPPED = "community.revteltech.nfc.ACTION_HCE_STOPPED";
    public static final String EXTRA_SIMPLE_URL = "simple_url";
    public static final String EXTRA_CONTACT_VCF = "contact_vcf";

        // Static variables to maintain state across service lifecycle
    private static List<String> staticSimpleUrls = new ArrayList<>();
    private static boolean isServiceActive = false;
    private static String staticContactVcf = null;

    private String contactVcf;
    private LocalBroadcastManager broadcastManager;

    // NDEF state
    private boolean ndefAppSelected = false;
    private boolean capabilityContainerSelected = false;
    private boolean ndefFileSelected = false;
    private byte[] currentNdefData = null;

    @Override
    public void onCreate() {
        super.onCreate();
        broadcastManager = LocalBroadcastManager.getInstance(this);
        
        // Restore static state
        contactVcf = staticContactVcf;
        
        // Service is active if there's any content
        isServiceActive = (!staticSimpleUrls.isEmpty() || staticContactVcf != null);
        
        Log.d(TAG, "Service created - isActive: " + isServiceActive + ", hasUrls: " + staticSimpleUrls.size() + ", hasVcf: " + (staticContactVcf != null));
        
        // Broadcast service started
        broadcastManager.sendBroadcast(new Intent(ACTION_HCE_STARTED));
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isServiceActive = false;
        
        // Broadcast service stopped
        if (broadcastManager != null) {
            broadcastManager.sendBroadcast(new Intent(ACTION_HCE_STOPPED));
        }
    }

    private void prepareNdefData() {
        try {
            if (contactVcf != null && !contactVcf.isEmpty()) {
                NdefRecord vcfRecord = NdefRecord.createMime(
                    "text/x-vcard",
                    contactVcf.getBytes(StandardCharsets.UTF_8)
                );
                NdefMessage ndefMessage = new NdefMessage(new NdefRecord[]{vcfRecord});
                currentNdefData = createNdefFile(ndefMessage);
                return;
            }
            
            if (staticSimpleUrls.isEmpty()) {
                currentNdefData = null;
                return;
            }

            List<NdefRecord> allRecords = new ArrayList<>();
            
            for (String url : staticSimpleUrls) {
                if (url != null && !url.isEmpty()) {
                    List<NdefRecord> records = createUriRecords(url);
                    allRecords.addAll(records);
                }
            }
            
            if (allRecords.isEmpty()) {
                currentNdefData = null;
                return;
            }
            
            // iOS prefers shorter messages, so warn if we have many records
            if (allRecords.size() > 1) {
                Log.w(TAG, "Multiple URL records created (" + allRecords.size() + "). iOS typically processes only the first record.");
            }
            
            NdefMessage ndefMessage = new NdefMessage(allRecords.toArray(new NdefRecord[0]));
            currentNdefData = createNdefFile(ndefMessage);

        } catch (Exception e) {
            Log.e(TAG, "Error preparing NDEF data: " + e.getMessage(), e);
            currentNdefData = null;
        }
    }
    
    /**
     * Create NDEF URI records based on the input URL
     * Uses manual NDEF construction for better iOS compatibility
     */
    private List<NdefRecord> createUriRecords(String url) {
        List<NdefRecord> records = new ArrayList<>();
        
        if (url == null || url.isEmpty()) {
            return records;
        }

        // Create URI record with explicit type and payload
        byte[] uriBytes = url.getBytes(StandardCharsets.UTF_8);
        byte[] payload;
        
        if (url.startsWith("https://")) {
            payload = new byte[uriBytes.length - 8 + 1];
            payload[0] = 0x04; // https:// prefix code
            System.arraycopy(uriBytes, 8, payload, 1, uriBytes.length - 8);
        } else if (url.startsWith("http://")) {
            payload = new byte[uriBytes.length - 7 + 1];
            payload[0] = 0x03; // http:// prefix code
            System.arraycopy(uriBytes, 7, payload, 1, uriBytes.length - 7);
        } else {
            // Fallback to full URL without prefix code
            payload = new byte[uriBytes.length + 1];
            payload[0] = 0x00; // No prefix code
            System.arraycopy(uriBytes, 0, payload, 1, uriBytes.length);
        }
        
        NdefRecord uriRecord = new NdefRecord(
            NdefRecord.TNF_WELL_KNOWN,
            NdefRecord.RTD_URI,
            new byte[0], // No ID
            payload
        );
        
        records.add(uriRecord);
        
        return records;
    }
    
    private byte[] createNdefFile(NdefMessage ndefMessage) {
        try {
            byte[] ndefBytes = ndefMessage.toByteArray();
            
            // iOS has stricter limits than Android
            if (ndefBytes.length > 2048) {
                Log.w(TAG, "NDEF message too large for iOS compatibility: " + ndefBytes.length + " bytes");
            }
            
            // Create proper NDEF file structure with length prefix
            byte[] ndefFile = new byte[2 + ndefBytes.length];
            
            // Write length as big-endian 16-bit value (iOS is strict about byte order)
            int length = ndefBytes.length;
            ndefFile[0] = (byte) ((length >> 8) & 0xFF);
            ndefFile[1] = (byte) (length & 0xFF);
            
            // Copy NDEF message data
            System.arraycopy(ndefBytes, 0, ndefFile, 2, ndefBytes.length);
            
            return ndefFile;
        } catch (Exception e) {
            Log.e(TAG, "Error creating NDEF file: " + e.getMessage(), e);
            return new byte[]{0x00, 0x00}; 
        }
    }

    // Helper method to convert bytes to hex string for debugging
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            boolean hasUrlExtra = intent.hasExtra(EXTRA_SIMPLE_URL);
            boolean hasVcfExtra = intent.hasExtra(EXTRA_CONTACT_VCF);
            String url = intent.getStringExtra(EXTRA_SIMPLE_URL);
            String vcf = intent.getStringExtra(EXTRA_CONTACT_VCF);

            if (hasVcfExtra) {
                if (vcf != null && !vcf.isEmpty()) {
                    contactVcf = vcf;
                    staticContactVcf = vcf;
                    staticSimpleUrls.clear();
                    isServiceActive = true;
                    prepareNdefData();
                } else {
                    contactVcf = null;
                    staticContactVcf = null;
                    currentNdefData = null;
                    if (staticSimpleUrls.isEmpty()) {
                        isServiceActive = false;
                    }
                }
            } else if (hasUrlExtra) {
                if (url != null && !url.isEmpty()) {
                    if (!staticSimpleUrls.contains(url)) {
                        staticSimpleUrls.add(url);
                    }
                    contactVcf = null;
                    staticContactVcf = null;
                    isServiceActive = true;
                    prepareNdefData();
                } else {
                    staticSimpleUrls.clear();
                    currentNdefData = null;
                    if (staticContactVcf == null) {
                        isServiceActive = false;
                    }
                }
            } else if (hasUrlExtra && hasVcfExtra && url == null && vcf == null) {
                contactVcf = null;
                staticContactVcf = null;
                staticSimpleUrls.clear();
                currentNdefData = null;
                isServiceActive = false;
            }
        }
        return super.onStartCommand(intent, flags, startId);
    }

    @Override
    public byte[] processCommandApdu(byte[] commandApdu, Bundle extras) {
        if (commandApdu == null || commandApdu.length < 4) {
            return ApduUtil.A_ERROR;
        }

        // Check if HCE is actually active and has content
        if (!isServiceActive || (staticSimpleUrls.isEmpty() && staticContactVcf == null)) {
            return ApduUtil.A_FILE_NOT_FOUND;
        }

        // Handle SELECT NDEF application
        if (ApduUtil.isSelectNdefApp(commandApdu)) {
            ndefAppSelected = true;
            capabilityContainerSelected = false;
            ndefFileSelected = false;
            prepareNdefData();
            return ApduUtil.A_OK;
        }

        // Only process further commands if NDEF app is selected
        if (!ndefAppSelected) {
            return ApduUtil.A_FILE_NOT_FOUND;
        }

        // Handle SELECT Capability Container
        if (ApduUtil.isSelectCapabilityContainer(commandApdu)) {
            capabilityContainerSelected = true;
            ndefFileSelected = false;
            return ApduUtil.A_OK;
        }

        // Handle SELECT NDEF file
        if (ApduUtil.isSelectNdefFile(commandApdu)) {
            capabilityContainerSelected = false;
            ndefFileSelected = true;
            return ApduUtil.A_OK;
        }

        // Handle READ BINARY commands
        if (ApduUtil.isReadCommand(commandApdu)) {
            if (capabilityContainerSelected) {
                byte[] ccData = ApduUtil.getCapabilityContainer();
                byte[] ccDataOnly = new byte[ccData.length - 2];
                System.arraycopy(ccData, 0, ccDataOnly, 0, ccDataOnly.length);
                return ApduUtil.handleReadBinary(commandApdu, ccDataOnly);
            }
            
            if (ndefFileSelected) {
                if (currentNdefData != null) {
                    return ApduUtil.handleReadBinary(commandApdu, currentNdefData);
                } else {
                    byte[] emptyNdef = {0x00, 0x00};
                    return ApduUtil.handleReadBinary(commandApdu, emptyNdef);
                }
            }
            
            return ApduUtil.A_FILE_NOT_FOUND;
        }

        return ApduUtil.A_ERROR;
    }

    @Override
    public void onDeactivated(int reason) {
        String reasonStr = (reason == DEACTIVATION_LINK_LOSS) ? "LINK_LOSS" : 
                          (reason == DEACTIVATION_DESELECTED) ? "DESELECTED" : "UNKNOWN";
    }

    // Service state methods
    public boolean isActive() {
        return isServiceActive;
    }

    public static boolean isRunning() {
        return isServiceActive && (!staticSimpleUrls.isEmpty() || staticContactVcf != null);
    }

    // Static method to clear all data and deactivate service
    public static void clearAllData() {
        staticSimpleUrls.clear();
        staticContactVcf = null;
        isServiceActive = false;
    }

    // Static method to force clear current NDEF data
    public static void forceClearNdefData() {
        staticSimpleUrls.clear();
        staticContactVcf = null;
    }
} 