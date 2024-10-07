import { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import SafeAreaView from '#ui/SafeAreaView';
import Text from '#ui/Text';

const ContactsScreen = () => {
  const router = useRouter();
  const onClose = useCallback(() => {
    router.back();
  }, [router]);

  const styles = useStyleSheet(stylesheet);

  return (
    <Container style={[styles.container]}>
      <SafeAreaView
        style={styles.container}
        edges={{ bottom: 'off', top: 'additive' }}
      >
        <Header
          middleElement={
            <Text variant="large">
              <FormattedMessage
                description="ContactsScreen - Title"
                defaultMessage="{contacts} Contacts"
                values={{ contacts: 0 }}
              />
            </Text>
          }
          leftElement={
            <PressableNative onPress={onClose}>
              <Icon icon="close" />
            </PressableNative>
          }
        />
      </SafeAreaView>
    </Container>
  );
};

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
  },
  menu: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  search: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  section: {
    margin: 20,
  },
  contact: {
    marginVertical: 20,
    flexDirection: 'row',
  },
  date: {
    color: colors.grey400,
    marginTop: 5,
  },
  company: {
    marginTop: 5,
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: theme === 'light' ? colors.grey50 : colors.grey900,
  },
  initial: {
    marginVertical: 20,
  },
  webcard: {
    marginRight: 15,
  },
  infos: {
    justifyContent: 'center',
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 15,
  },
}));

export default ContactsScreen;
