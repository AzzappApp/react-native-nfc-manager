import {
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { buildUserUrl } from '#helpers/urlHelpers';

type QRCodeModalProps = {
  onRequestClose(): void;
  userName: string;
};

const QRCodeModal = ({ onRequestClose, userName }: QRCodeModalProps) => (
  <Modal
    visible
    animationType="fade"
    transparent
    onRequestClose={onRequestClose}
    testID="qr-code-modal"
  >
    <TouchableWithoutFeedback onPress={onRequestClose}>
      <View style={styles.overlay}>
        <View style={styles.qrCodeContainer}>
          <QRCode
            value={buildUserUrl(userName)}
            logo={require('#assets/logo.png')}
            size={240}
            logoBackgroundColor="#FFF"
            logoMargin={10}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

export default QRCodeModal;

const styles = StyleSheet.create({
  overlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeContainer: {
    width: 266,
    height: 266,
    backgroundColor: '#FFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
