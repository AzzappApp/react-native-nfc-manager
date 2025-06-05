import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { profileInfoHasAdminRight } from '#helpers/profileRoleHelper';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import type { HomeBottomPanelMessage_user$data } from '#relayArtifacts/HomeBottomPanelMessage_user.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';

const HomeBottomPanelNewCover = ({
  profile,
}: {
  profile: ArrayItemType<HomeBottomPanelMessage_user$data['profiles']>;
}) => {
  const intl = useIntl();
  const router = useRouter();

  return (
    <>
      <View style={styles.viewContainer}>
        <Icon icon="warning" style={styles.warningIcon} />
        <Text variant="large" style={styles.title}>
          <FormattedMessage
            defaultMessage="This WebCard{azzappA} needs a cover"
            description="Home Screen - Missing cover title"
            values={{
              azzappA: (
                <Text style={styles.icon} variant="azzapp">
                  a
                </Text>
              ),
            }}
          />
        </Text>
        <Text variant="medium" style={styles.text}>
          <FormattedMessage
            defaultMessage="This WebCard{azzappA} has no cover and can’t be published."
            description="Home Screen - Missing cover text"
            values={{
              azzappA: (
                <Text style={styles.icon} variant="azzapp">
                  a
                </Text>
              ),
            }}
          />
        </Text>
      </View>
      <Button
        variant="secondary"
        appearance="dark"
        onPress={() => {
          if (profileInfoHasAdminRight(profile)) {
            router.push({
              route: 'COVER_TEMPLATE_SELECTION',
              params: { fromHome: true },
            });
          } else {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage: 'Your role does not permit this action',
                description:
                  'Error message when trying to create a cover without the right permissions',
              }),
            });
          }
        }}
        label={
          <FormattedMessage
            defaultMessage="Create your WebCard{azzappA} cover{azzappA}"
            description="Home Screen - Missing cover button"
            values={{
              azzappA: (
                <Text style={styles.icon} variant="azzapp">
                  a
                </Text>
              ),
            }}
          />
        }
        style={styles.button}
      />
    </>
  );
};

export default HomeBottomPanelNewCover;

const styles = StyleSheet.create({
  viewContainer: { justifyContent: 'flex-start', alignItems: 'center' },
  text: {
    textAlign: 'center',
    color: colors.white,
    marginHorizontal: 50,
    marginTop: 10,
  },
  title: {
    color: colors.white,
  },
  warningIcon: {
    tintColor: colors.white,
    marginBottom: 20,
    width: 20,
    height: 20,
  },
  icon: {
    color: colors.white,
  },
  button: {
    minWidth: 250,
  },
});
