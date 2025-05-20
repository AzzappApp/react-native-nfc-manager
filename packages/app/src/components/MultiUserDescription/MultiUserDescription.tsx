import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Button from '#ui/Button';
import Text from '#ui/Text';
import type { PropsWithChildren } from 'react';

const Row = ({ children }: PropsWithChildren) => {
  return (
    <View style={styles.row}>
      <Image source={require('./assets/check.svg')} style={styles.check} />
      <Text variant="medium" appearance="light">
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
  const { width: screenWidth } = useScreenDimensions();

  return (
    <View style={styles.container}>
      <Video
        style={[styles.video, { width: width ?? screenWidth }]}
        isLooping
        isMuted
        shouldPlay
        resizeMode={ResizeMode.COVER}
        source={require('./assets/multi-user.mp4')}
      />
      <View style={styles.descriptionContainer}>
        <Text variant="large" style={styles.title} appearance="light">
          <FormattedMessage
            defaultMessage="Enjoy Multi-User on your Desktop"
            description="Multi-User screen : title to present user management desktop app"
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

const styles = StyleSheet.create({
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
});
