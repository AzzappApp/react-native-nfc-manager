import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { colors } from '#theme';
import Button from '#ui/Button';
import Text from '#ui/Text';
import { useProfileEditScale } from './profileScreenHelpers';

type ProfileScreenEditModeFooter = {
  setLoadTemplate: (value: boolean) => void;
};

const ProfileScreenEditModeFooter = ({
  setLoadTemplate,
}: ProfileScreenEditModeFooter) => {
  const onPress = useCallback(() => {
    setLoadTemplate(true);
  }, [setLoadTemplate]);
  const editScale = useProfileEditScale();
  const intl = useIntl();
  return (
    <View
      style={[styles.loadTemplate, { transform: [{ scale: 1 / editScale }] }]}
    >
      <Text variant="small" style={styles.loadDescription}>
        {intl.formatMessage(
          {
            defaultMessage:
              'You can completly change your WebCard{azzappAp} by loading a new template',
            description: 'ProfileScreenBody description to load a new template',
          },
          {
            azzappAp: <Text variant="azzapp">a</Text>,
          },
        )}
      </Text>
      <Button
        variant="little_round"
        label={
          intl.formatMessage(
            {
              defaultMessage: 'Load a new WebCard{azzappAp} template',
              description: 'ProfileScreenBody button to load a new template',
            },
            {
              azzappAp: <Text variant="azzapp">a</Text>,
            },
          ) as string
        }
        onPress={onPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadTemplate: {
    marginTop: 30,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    alignItems: 'center',
  },
  loadDescription: {
    textAlign: 'center',
    color: colors.grey700,
    marginHorizontal: 20,
  },
});

export default ProfileScreenEditModeFooter;
