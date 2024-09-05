import { FormattedMessage } from 'react-intl';
import { useColorScheme } from 'react-native';
import ShareCommand from 'react-native-share';
import { graphql, useFragment } from 'react-relay';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ContactCardExportVcf_card$key } from '#relayArtifacts/ContactCardExportVcf_card.graphql';

export type ContactCardExportVcfProps = {
  profile: ContactCardExportVcf_card$key;
};

const ContactCardExportVcf = ({
  profile: profileKey,
}: {
  profile: ContactCardExportVcf_card$key;
}) => {
  const profile = useFragment(
    graphql`
      fragment ContactCardExportVcf_card on Profile {
        contactCardUrl
        contactCard {
          firstName
          lastName
        }
      }
    `,
    profileKey,
  );

  const styles = useStyleSheet(styleSheet);
  const colorScheme = useColorScheme();

  return (
    <PressableNative
      ripple={{
        foreground: true,
        color: colorScheme === 'dark' ? colors.grey100 : colors.grey900,
      }}
      accessibilityRole="button"
      style={styles.button}
      onPress={async () => {
        const title =
          formatDisplayName(
            profile.contactCard?.firstName,
            profile.contactCard?.lastName,
          ) ?? '';
        try {
          await ShareCommand.open({
            title,
            subject: title,
            message: profile.contactCardUrl,
            failOnCancel: false,
          });
        } catch (e) {
          console.error(e);
        }
      }}
    >
      <Icon
        icon="share"
        style={styles.sharedIcon}
        size={24}
        tintColor={colorScheme === 'dark' ? colors.black : colors.white}
      />
      <Text variant="button" style={styles.text}>
        <FormattedMessage
          defaultMessage="Share"
          description="Share button label"
        />
      </Text>
    </PressableNative>
  );
};

export default ContactCardExportVcf;

const styleSheet = createStyleSheet(appearance => ({
  sharedIcon: {
    position: 'absolute',
    left: 10,
    marginVertical: 'auto',
  },
  button: {
    width: '100%',
    height: 47,
    borderRadius: 12,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: appearance === 'light' ? colors.white : colors.black,
  },
}));
