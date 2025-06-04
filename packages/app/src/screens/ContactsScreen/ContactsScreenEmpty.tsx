import { FormattedMessage } from 'react-intl';
import { Image, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import SafeAreaView from '#ui/SafeAreaView';
import Text from '#ui/Text';

type ContactsScreenEmptyProps = {
  openNewContactMenu: () => void;
  onBack: () => void;
};

const ContactsScreenEmpty = ({
  openNewContactMenu,
  onBack,
}: ContactsScreenEmptyProps) => {
  const styles = useStyleSheet(styleSheet);

  return (
    <SafeAreaView style={styles.container}>
      <Container style={styles.container}>
        <Header
          leftElement={
            <IconButton
              icon="close"
              onPress={onBack}
              variant="icon"
              hitSlop={40}
            />
          }
        />
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Image
              source={require('./assets/emptyBackground.png')}
              style={styles.iconBackground}
            />
            <Icon icon="contact" size={60} style={styles.icon} />
          </View>
          <Text variant="xlarge" style={styles.title}>
            <FormattedMessage
              defaultMessage="No contacts yet"
              description="Empty contact list message title"
            />
          </Text>
          <Text variant="medium" style={styles.description}>
            <FormattedMessage
              defaultMessage="Share your card, scan a paper one, or add contacts manually—your network grows either way."
              description="Empty contact list message description"
            />
          </Text>
          <Text variant="medium" style={styles.azzappAiDescription}>
            <FormattedMessage
              defaultMessage="Use {azzappAI} to enrich contact information and generate profile"
              description="Empty contact list message description"
              values={{
                azzappAI: (
                  <Text variant="medium" style={styles.azzappAI}>
                    <FormattedMessage
                      defaultMessage="azzapp AI"
                      description="azzapp AI"
                    />
                  </Text>
                ),
              }}
            />
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            label={
              <FormattedMessage
                description="Empty ContactsScreen - Create contact button"
                defaultMessage="Add a new Contact"
              />
            }
            onPress={openNewContactMenu}
            style={styles.createContactButton}
          />
        </View>
      </Container>
    </SafeAreaView>
  );
};

export default ContactsScreenEmpty;

const styleSheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    padding: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 324,
    height: 324,
  },
  icon: {
    tintColor: appearance === 'dark' ? colors.white : colors.black,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  title: {
    textAlign: 'center',
    marginTop: 20,
  },
  description: {
    textAlign: 'center',
  },
  azzappAiDescription: {
    textAlign: 'center',
  },
  azzappAI: {
    color: colors.brightblue200,
  },
  buttonContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: '100%',
    bottom: 80,
    left: 0,
  },
  createContactButton: {
    width: 224,
  },
}));
