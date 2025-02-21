import * as Sentry from '@sentry/react-native';
import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import { FormattedMessage, useIntl } from 'react-intl';
import { Share, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import type { PropsWithChildren } from 'react';

const USER_MGMT_URL = process.env.NEXT_PUBLIC_USER_MGMT_URL;

const Row = ({ children }: PropsWithChildren) => {
  const styles = useStyleSheet(styleSheet);

  return (
    <View style={styles.row}>
      <Image source={require('./assets/check.svg')} style={styles.check} />
      <Text variant="medium" appearance="light" style={styles.rowText}>
        {children}
      </Text>
    </View>
  );
};

const MultiUserDescription = ({
  width,
  onClose,
}: {
  width?: number;
  onClose?: () => void;
}) => {
  const intl = useIntl();
  const { width: screenWitdh } = useScreenDimensions();
  const styles = useStyleSheet(styleSheet);

  const onShare = async () => {
    const title = intl.formatMessage({
      defaultMessage: 'Manage your team on your desktop',
      description: 'title in multi user description share',
    });

    try {
      await Share.share(
        {
          title,
          url: USER_MGMT_URL,
        },
        {
          dialogTitle: title,
          subject: intl.formatMessage({
            defaultMessage: 'Azzapp | user management platform',
            description: 'Email subject in multi user description share',
          }),
        },
      );
    } catch (error: any) {
      Sentry.captureException(error);
    }
  };

  return (
    <View style={styles.container}>
      <Video
        style={[styles.video, { width: width ?? screenWitdh }]}
        isLooping
        isMuted
        shouldPlay
        resizeMode={ResizeMode.COVER}
        source={require('./assets/multi-user.mp4')}
      />
      <View style={styles.descriptionContainer}>
        <Text variant="large" style={styles.title}>
          <FormattedMessage
            defaultMessage="Activate Multi-User on your Desktop"
            description="Activate Multi user description for MultiUser description"
          />
        </Text>
        <Row>
          <FormattedMessage
            defaultMessage="⁠Invite your team with just 1 click"
            description="⁠Invite your team with just 1 click for MultiUser description"
          />
        </Row>
        <Row>
          <FormattedMessage
            defaultMessage="Provide them with digital business cards"
            description="Provide them with digital business cards for MultiUser description"
          />
        </Row>
        <Row>
          <FormattedMessage
            defaultMessage="Access and manage all collected contacts"
            description="Access and manage all collected contacts for MultiUser description"
          />
        </Row>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          appearance="light"
          variant={onClose ? 'secondary' : 'primary'}
          label={USER_MGMT_URL.replace('http://', '').replace('https://', '')}
          leftElement={
            <Icon
              icon="share"
              style={{ tintColor: onClose ? colors.black : colors.white }}
            />
          }
          onPress={onShare}
        />
        {onClose && (
          <Button
            appearance="light"
            label={
              <FormattedMessage
                defaultMessage="Ok"
                description="ok button in MultiUserScreen description modal"
              />
            }
            onPress={onClose}
          />
        )}
      </View>
    </View>
  );
};

export default MultiUserDescription;

const styleSheet = createStyleSheet(appearance => ({
  container: {
    marginTop: 30,
    gap: 30,
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  check: {
    width: 18,
    height: 18,
  },
  title: {
    textAlign: 'center',
  },
  descriptionContainer: {
    gap: 15,
  },
  video: {
    height: 211,
  },
  buttonContainer: {
    gap: 10,
    minWidth: 311,
  },
  rowText: {
    color: appearance === 'dark' ? colors.white : colors.black,
  },
}));
