import { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Modal, View, StyleSheet } from 'react-native';

import { colors } from '#theme';
import Text from '#ui/Text';
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
  const [progress, setProgress] = useState(0);
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

  const intl = useIntl();
  const messages = useMemo(() => {
    return [
      intl.formatMessage({
        defaultMessage:
          'Nothing better than a nice transition between the sections of your webcard',
        description: 'Progress loading modal message 1',
      }),
      intl.formatMessage({
        defaultMessage: 'Did you know that videos are now supported for covers',
        description: 'Progress loading modal message 2',
      }),
      intl.formatMessage({
        defaultMessage:
          'Did you know you can customize each section of your webcard? Make it a unique experience!',
        description: 'Progress loading modal message 3',
      }),
      intl.formatMessage({
        defaultMessage:
          "Your webcard, your style. Don't forget to explore all the customization options available.",
        description: 'Progress loading modal message 4',
      }),
      intl.formatMessage({
        defaultMessage:
          "Take a deep breath and envision your perfect webcard. It's coming soon!",
        description: 'Progress loading modal message 5',
      }),
      intl.formatMessage({
        defaultMessage:
          "A little secret: Bright colors and attractive fonts grab your visitors' attention. Give them a try!",
        description: 'Progress loading modal message 6',
      }),
      intl.formatMessage({
        defaultMessage:
          'As the pixels come together, think about using transition effects to add dynamism to your webcard',
        description: 'Progress loading modal message 7',
      }),
      intl.formatMessage({
        defaultMessage:
          'The most beautiful things take time to come to life. Your webcard is taking shape.',
        description: 'Progress loading modal message 8',
      }),
    ];
  }, [intl]);

  const text = useMemo(
    () => messages[Math.floor(Math.random() * messages.length)],
    [messages],
  );

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={() => void 0}>
      <View style={styles.container}>
        <Text variant="xlarge" style={styles.text}>
          {text}
        </Text>
        <ProgressBar progress={progress} style={styles.progressBarWidth} />
      </View>
    </Modal>
  );
};

export default UploadProgressModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarWidth: { width: '75°%' },
  text: {
    color: colors.white,
    width: '75%',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 36,
  },
});
