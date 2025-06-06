package community.revteltech.nfc;

import android.util.Log;

public class ApduUtil {
    private static final String TAG = "ApduUtil";

    // APDU status words
    public static final byte[] A_OK = {(byte) 0x90, (byte) 0x00};
    public static final byte[] A_ERROR = {(byte) 0x6F, (byte) 0x00};

    // APDU command bytes
    private static final byte CLA = (byte) 0x00;
    private static final byte INS_SELECT = (byte) 0xA4;
    private static final byte INS_READ_BINARY = (byte) 0xB0;
    private static final byte INS_READ_RECORD = (byte) 0xB2;

    public static boolean isSelectCommand(byte[] commandApdu) {
        return commandApdu != null && 
               commandApdu.length >= 5 && 
               commandApdu[0] == CLA && 
               commandApdu[1] == INS_SELECT;
    }

    public static boolean isReadCommand(byte[] commandApdu) {
        return commandApdu != null && 
               commandApdu.length >= 5 && 
               commandApdu[0] == CLA && 
               (commandApdu[1] == INS_READ_BINARY || commandApdu[1] == INS_READ_RECORD);
    }

    public static byte[] createResponse(String data) {
        try {
            byte[] dataBytes = data.getBytes();
            byte[] response = new byte[dataBytes.length + 2];
            System.arraycopy(dataBytes, 0, response, 0, dataBytes.length);
            response[dataBytes.length] = A_OK[0];
            response[dataBytes.length + 1] = A_OK[1];
            return response;
        } catch (Exception e) {
            Log.e(TAG, "Error creating response: " + e.getMessage());
            return A_ERROR;
        }
    }

    public static byte[] createNdefResponse(byte[] ndefData) {
        try {
            if (ndefData == null || ndefData.length == 0) {
                return A_ERROR;
            }

            // Create response with NDEF data + status word
            byte[] response = new byte[ndefData.length + 2];
            System.arraycopy(ndefData, 0, response, 0, ndefData.length);
            response[ndefData.length] = A_OK[0];
            response[ndefData.length + 1] = A_OK[1];
            
            Log.d(TAG, "Created NDEF response: " + response.length + " bytes");
            return response;
        } catch (Exception e) {
            Log.e(TAG, "Error creating NDEF response: " + e.getMessage());
            return A_ERROR;
        }
    }

    public static String bytesToHex(byte[] bytes) {
        if (bytes == null) return "null";
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString().trim();
    }
} 