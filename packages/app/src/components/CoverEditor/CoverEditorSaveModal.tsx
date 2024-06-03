import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '#theme';
import ProgressBar from '#ui/ProgressBar';
import Text from '#ui/Text';
import type { SavingStatus } from './useSaveCover';
import type { Subscription, Observable } from 'relay-runtime';

const CoverEditorSaveModal = ({
  status,
  progressIndicator,
}: {
  status: SavingStatus | null;
  progressIndicator: Observable<number> | null;
}) => {
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    let subscription: Subscription;
    if (progressIndicator) {
      setProgress(0);
      subscription = progressIndicator.subscribe({
        next(value) {
          setProgress(value);
        },
      });
    }
    return () => {
      subscription?.unsubscribe();
      setProgress(null);
    };
  }, [progressIndicator]);

  return (
    <View style={styles.container}>
      <Text variant="xlarge" style={styles.text}>
        {status}
      </Text>
      <ProgressBar
        progress={progress ?? 0}
        style={[styles.progressBarWidth, progress === null && { opacity: 0 }]}
      />
    </View>
  );
};

CoverEditorSaveModal.options = () => ({
  stackAnimation: 'fade',
  animationDuration: 500,
});

export default CoverEditorSaveModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarWidth: { width: '75%' },
  text: {
    color: colors.white,
    width: '75%',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 36,
  },
  icon: {
    color: colors.white,
  },
});
