import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import Button from '#ui/Button';
import Text from '#ui/Text';
import type { ReactNode } from 'react';

const PermissionScreen = ({
  title,
  content,
  onNext,
}: {
  title: string;
  content: ReactNode;
  onNext: () => void;
}) => {
  const intl = useIntl();
  return (
    <>
      <Text variant="large" style={styles.permissionScreenTitle}>
        {title}
      </Text>
      <Text variant="medium" style={styles.permissionScreenContent}>
        {content}
      </Text>
      <Button
        label={intl.formatMessage({
          defaultMessage: 'Allow access',
          description:
            'Button label of screens asking for camera/micro permissions',
        })}
        onPress={onNext}
      />
    </>
  );
};

export default PermissionScreen;

const styles = StyleSheet.create({
  permissionScreenTitle: {
    marginBottom: 20,
    padding: 10,
  },
  permissionScreenContent: {
    marginBottom: 30,
    padding: 10,
  },
});
