import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { colors } from '#theme';
import Button from '#ui/Button';
import Text from '#ui/Text';

type WebCardScreenEditModeFooter = {
  setLoadTemplate: (value: boolean) => void;
};

const WebCardScreenEditModeFooter = ({
  setLoadTemplate,
}: WebCardScreenEditModeFooter) => {
  const onPress = useCallback(() => {
    setLoadTemplate(true);
  }, [setLoadTemplate]);
  const intl = useIntl();
  return (
    <View style={styles.root}>
      <Text variant="small" style={styles.loadDescription}>
        {intl.formatMessage(
          {
            defaultMessage:
              'You can completely change your WebCard{azzappAp} by loading a new template',
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

export const WEBCARD_SCREEN_EDIT_MODE_FOOTER_HEIGHT = 110;

const styles = StyleSheet.create({
  root: {
    paddingTop: 30,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: WEBCARD_SCREEN_EDIT_MODE_FOOTER_HEIGHT,
  },
  loadDescription: {
    textAlign: 'center',
    color: colors.grey700,
    marginHorizontal: 40,
  },
});

export default WebCardScreenEditModeFooter;
