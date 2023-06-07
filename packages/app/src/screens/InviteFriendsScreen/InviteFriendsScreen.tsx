import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Linking, Platform, StyleSheet, View, Share } from 'react-native';
import { openComposer } from 'react-native-email-link';
import { graphql, useFragment } from 'react-relay';
import AccountHeader from '#components/AccountHeader';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { InviteFriendsScreen_viewer$key } from '@azzapp/relay/artifacts/InviteFriendsScreen_viewer.graphql';

type InviteFriendsScreenProps = {
  viewer: InviteFriendsScreen_viewer$key;
};

const InviteFriendsScreen = ({ viewer }: InviteFriendsScreenProps) => {
  const { profile } = useFragment(
    graphql`
      fragment InviteFriendsScreen_viewer on Viewer {
        profile {
          userName
          ...AccountHeader_profile
        }
      }
    `,
    viewer,
  );

  const intl = useIntl();

  const message = intl.formatMessage(
    {
      defaultMessage:
        'Hey, I’m using Azzapp as {userName}. Install the app to subscribe to my photos and videos. {url}',
      description: 'Invite message to share with friends',
    },
    { userName: profile?.userName, url: 'https://azzapp.com' },
  );

  const subject = intl.formatMessage({
    defaultMessage: "I'm using Azzapp",
    description: 'Invite subject to share with friends',
  });

  const [hasWhatsapp, setHasWhatsapp] = useState(false);

  const whatsappMessage = buildWhatsAppLink(message);

  useEffect(() => {
    Linking.canOpenURL(whatsappMessage)
      .then(() => setHasWhatsapp(true))
      .catch(() => setHasWhatsapp(false));
  }, [whatsappMessage]);

  return (
    <View
      style={{
        flex: 1,
        rowGap: 15,
      }}
    >
      <AccountHeader
        userName={profile?.userName}
        profile={profile}
        title={intl.formatMessage({
          defaultMessage: 'Invite Friends',
          description:
            'Title of the screen where the user can invite friends to the app',
        })}
      />

      <Icon icon="invite" style={styles.inviteIcon} />
      <View style={{ rowGap: 20, paddingHorizontal: 10 }}>
        <Text variant="xsmall" style={styles.inviteMessage}>
          <FormattedMessage
            defaultMessage="Invite your friends to join Azzapp !"
            description="Invite friends to join the app subtitle"
          />
        </Text>

        {hasWhatsapp && (
          <PressableNative
            style={styles.inviteOption}
            onPress={() => {
              Linking.openURL(whatsappMessage).catch(err => {
                //TODO: handle error
                console.error('An error occurred', err);
              });
            }}
          >
            <Icon icon="whatsapp" />
            <Text variant="medium" style={{ flex: 1 }}>
              <FormattedMessage
                defaultMessage="Invite with Whatsapp"
                description="Invite with Whatsapp button"
              />
            </Text>
            <Icon icon="arrow_right" />
          </PressableNative>
        )}
        <PressableNative
          style={styles.inviteOption}
          onPress={() => {
            Linking.openURL(
              `sms:${Platform.OS === 'ios' ? '&' : '?'}body=${message}`,
            ).catch(err => {
              //TODO: handle error
              console.error('An error occurred', err);
            });
          }}
        >
          <Icon icon="sms" />
          <Text variant="medium" style={{ flex: 1 }}>
            <FormattedMessage
              defaultMessage="Invite with sms"
              description="Invite with a sms"
            />
          </Text>
          <Icon icon="arrow_right" />
        </PressableNative>
        <PressableNative
          style={styles.inviteOption}
          onPress={() => {
            openComposer({
              subject,
              body: message,
            }).catch(err => {
              //TODO: handle error
              console.error('An error occurred', err);
            });
          }}
        >
          <Icon icon="mail_line" />
          <Text variant="medium" style={{ flex: 1 }}>
            <FormattedMessage
              defaultMessage="Invite via email"
              description="Invite with an email"
            />
          </Text>
          <Icon icon="arrow_right" />
        </PressableNative>
        <PressableNative
          style={styles.inviteOption}
          onPress={() => {
            Share.share({
              message,
            }).catch(err => {
              console.error('An error occurred', err);
            });
          }}
        >
          <Icon icon="invite_via" />
          <Text variant="medium" style={{ flex: 1 }}>
            <FormattedMessage
              defaultMessage="Invite friends via ..."
              description="Invite friends through other apps"
            />
          </Text>
          <Icon icon="arrow_right" />
        </PressableNative>
      </View>
    </View>
  );
};

const buildWhatsAppLink = (text: string) => {
  const message = encodeURIComponent(text);
  return `whatsapp://send?text=${message}`;
};

const styles = StyleSheet.create({
  inviteIcon: { width: 50, height: 50, alignSelf: 'center' },
  inviteMessage: { width: 255, textAlign: 'center', alignSelf: 'center' },
  inviteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    height: 32,
  },
});

export default InviteFriendsScreen;
