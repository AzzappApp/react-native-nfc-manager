import { NativeModules, Platform } from 'react-native';

const { NfcManager } = NativeModules;

class NfcManagerClass {
    isHceSupported = async () => {
        if (Platform.OS !== 'android') {
            return false;
        }
        return await NfcManager.isHceSupported();
    };

    isHceEnabled = async () => {
        if (Platform.OS !== 'android') {
            return false;
        }
        return await NfcManager.isHceEnabled();
    };

    setSimpleUrl = async (url) => {
        if (Platform.OS !== 'android') {
            throw new Error('HCE is only supported on Android');
        }
        return await NfcManager.setSimpleUrl(url);
    };

    setRichContent = async (url, title, description, imageUrl) => {
        if (Platform.OS !== 'android') {
            throw new Error('HCE is only supported on Android');
        }
        return await NfcManager.setRichContent(url, title, description, imageUrl);
    };

    clearContent = async () => {
        if (Platform.OS !== 'android') {
            throw new Error('HCE is only supported on Android');
        }
        return await NfcManager.clearContent();
    };
}

export default new NfcManagerClass(); 