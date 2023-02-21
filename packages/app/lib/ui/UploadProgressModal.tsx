import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';
import ProgressBar from './ProgressBar';
import type { Subscription, Observable } from 'relay-runtime';

type UploadProgressModalProps = {
  visible: boolean;
  progressIndicator?: Observable<number> | null;
};

const UploadProgressModal = ({
  visible,
  progressIndicator,
}: UploadProgressModalProps) => {
  const [progess, setProgress] = useState(0);
  const visibleRef = useRef(visible);
  if (!visible && visibleRef.current) {
    setProgress(0);
  }
  visibleRef.current = visible;

  useEffect(() => {
    let subscribtion: Subscription;
    if (progressIndicator) {
      setProgress(0);
      subscribtion = progressIndicator.subscribe({
        next(value) {
          setProgress(value);
        },
      });
    }
    return () => subscribtion?.unsubscribe();
  }, [progressIndicator]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={() => void 0}
      transparent
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Uploading...</Text>
          <ProgressBar style={styles.progressBar} progress={progess} />
          <Text style={styles.title}>{Math.round(progess * 100)}%</Text>
        </View>
      </View>
    </Modal>
  );
};

export default UploadProgressModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  modal: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    shadowColor: colors.dark,
    shadowOpacity: 0.21,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: 200,
    marginBottom: 10,
  },
});
