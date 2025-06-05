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
    private static final byte INS_GET_DATA = (byte) 0x88;

    public static boolean isSelectCommand(byte[] commandApdu) {
        return commandApdu != null && 
               commandApdu.length >= 5 && 
               commandApdu[0] == CLA && 
               commandApdu[1] == INS_SELECT;
    }

    public static boolean isGetDataCommand(byte[] commandApdu) {
        return commandApdu != null && 
               commandApdu.length >= 5 && 
               commandApdu[0] == CLA && 
               commandApdu[1] == INS_GET_DATA;
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
} 