import { useIntl } from 'react-intl';
import { StyleSheet, Text } from 'react-native';
import { textStyles } from '../../../theme';
import Button from '../../ui/Button';

const PermissionScreen = ({
  title,
  content,
  onNext,
}: {
  title: string;
  content: string;
  onNext: () => void;
}) => {
  const intl = useIntl();
  return (
    <>
      <Text style={styles.permissionScreenTitle}>{title}</Text>
      <Text style={styles.permissionScreenContent}>{content}</Text>
      <Button
        label={intl.formatMessage({
          defaultMessage: 'Next',
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
  content: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  permissionScreenTitle: {
    ...textStyles.title,
    marginBottom: 20,
    padding: 10,
  },
  permissionScreenContent: {
    ...textStyles.normal,
    marginBottom: 30,
    padding: 10,
  },
});
