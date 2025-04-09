import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { graphql, useMutation, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type {
  CookieSettingsScreenMutation,
  SaveCookiePreferencesInput,
} from '#relayArtifacts/CookieSettingsScreenMutation.graphql';
import type { CookieSettingsScreenQuery } from '#relayArtifacts/CookieSettingsScreenQuery.graphql';
import type { CookieSettingsRoute } from '#routes';

const query = graphql`
  query CookieSettingsScreenQuery {
    currentUser {
      cookiePreferences {
        analytics
        functional
        marketing
      }
    }
  }
`;

const CookieSettingsScreen = ({
  route: { params },
  preloadedQuery,
}: RelayScreenProps<CookieSettingsRoute, CookieSettingsScreenQuery>) => {
  const { currentUser } = usePreloadedQuery(query, preloadedQuery);
  const [consents, setConsents] = useState(
    currentUser?.cookiePreferences ?? {
      analytics: true,
      marketing: true,
      functional: true,
    },
  );
  const router = useRouter();
  const intl = useIntl();

  const cookieDescriptions = useMemo(
    () => ({
      necessary: {
        title: intl.formatMessage({
          defaultMessage: 'Strictly Necessary Cookies',
          description: 'Cookie settings screen necessary cookies title',
        }),
        text: intl.formatMessage({
          defaultMessage:
            'These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms. You can set your browser to block or alert you about these cookies, but some parts of the site will not then work. These cookies do not store any personally identifiable information.',
          description: 'Cookie settings screen necessary cookies information',
        }),
      },
      analytics: {
        title: intl.formatMessage({
          defaultMessage: 'Performance Cookies',
          description: 'Cookie settings screen performance cookies title',
        }),
        text: intl.formatMessage({
          defaultMessage:
            'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous. If you do not allow these cookies we will not know when you have visited our site, and will not be able to monitor its performance.',
          description: 'Cookie settings screen performance cookies information',
        }),
      },
      marketing: {
        title: intl.formatMessage({
          defaultMessage: 'Marketing Cookies',
          description: 'Cookie settings screen marketing cookies title',
        }),
        text: intl.formatMessage({
          defaultMessage:
            'These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites. They do not store directly personal information, but are based on uniquely identifying your browser and internet device. If you do not allow these cookies, you will experience less targeted advertising.',
          description: 'Cookie settings screen marketing cookies information',
        }),
      },
      functional: {
        title: intl.formatMessage({
          defaultMessage: 'Functional Cookies',
          description: 'Cookie settings screen functional cookies title',
        }),
        text: intl.formatMessage({
          defaultMessage:
            'These cookies enable the website to provide enhanced functionality and personalisation. They may be set by us or by third party providers whose services we have added to our pages. If you do not allow these cookies then some or all of these services may not function properly.',
          description: 'Cookie settings screen functional cookies information',
        }),
      },
    }),
    [intl],
  );

  const [displayedInformation, setDisplayedInformation] = useState<
    'analytics' | 'functional' | 'marketing' | 'necessary' | null
  >(null);
  const [showModal, setShowModal] = useState(false);

  const onInformationPress = useCallback(
    (type: typeof displayedInformation) => {
      setDisplayedInformation(type);
      setShowModal(true);
    },
    [],
  );

  const onInformationClose = useCallback(() => {
    setShowModal(false);
  }, []);

  const onCookieSettingChange = useCallback(
    (property: keyof SaveCookiePreferencesInput, value: boolean) => {
      setConsents(prev => ({ ...prev, [property]: value }));
    },
    [],
  );

  const fromConsent = params?.fromConsent ?? false;
  const onBack = useCallback(() => {
    if (fromConsent) {
      router.replace({ route: 'COOKIE_CONSENT' });
    } else {
      router.back();
    }
  }, [fromConsent, router]);

  const [commit, inFlight] = useMutation<CookieSettingsScreenMutation>(graphql`
    mutation CookieSettingsScreenMutation($input: SaveCookiePreferencesInput!) {
      saveCookiePreferences(input: $input) {
        user {
          id
          cookiePreferences {
            analytics
            functional
            marketing
          }
        }
      }
    }
  `);

  const onSave = useCallback(
    (consents: SaveCookiePreferencesInput) => {
      commit({
        variables: {
          input: consents,
        },
        onError: () => {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'An error occurred while saving your preferences',
              description:
                'Error toast message when saving cookie preferences fails in cookie preferences screen screen',
            }),
          });
        },
        onCompleted: () => {
          if (!fromConsent) {
            router.back();
          }
        },
      });
    },
    [commit, fromConsent, intl, router],
  );

  const onAccept = useCallback(() => {
    onSave({
      analytics: true,
      marketing: true,
      functional: true,
    });
  }, [onSave]);

  const onConfirm = useCallback(() => {
    onSave(consents);
  }, [consents, onSave]);

  const insets = useScreenInsets();

  return (
    <Container style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        leftElement={
          <IconButton icon="close" variant="icon" onPress={onBack} />
        }
        middleElement={
          <Text variant="large" style={styles.title}>
            <FormattedMessage
              defaultMessage="Privacy Preference Center"
              description="Cookie settings screen title"
            />
          </Text>
        }
        style={styles.header}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 30 },
        ]}
      >
        <Text variant="medium">
          <FormattedMessage
            description="Cookie settings screen description"
            defaultMessage="When you visit any website, it may store or retrieve information on your browser, mostly in the form of cookies. This information might be about you, your preferences or your device and is mostly used to make the site work as you expect it to. The information does not usually directly identify you, but it can give you a more personalized web experience.{br}{br}Because we respect your right to privacy, you can choose not to allow some types of cookies. Click on the different category headings to find out more and change our default settings. However, blocking some types of cookies may impact your experience of the site and the services we are able to offer.{br}{br}Please note that the duration of your consent is 13 months."
            values={{ br: '\n' }}
          />
        </Text>
        <Text variant="xlarge">
          <FormattedMessage
            defaultMessage="Manage Consent Preferences"
            description="Cookie settings screen manage preferences title"
          />
        </Text>
        <View style={styles.controlsContainer}>
          <View style={styles.cookieRow}>
            <View style={styles.cookieRowControl}>
              <Text variant="large">{cookieDescriptions.necessary.title}</Text>
              <IconButton
                icon="information"
                variant="icon"
                onPress={() => onInformationPress('necessary')}
              />
            </View>
            <Text variant="smallbold" style={styles.alwaysActive}>
              <FormattedMessage
                defaultMessage="Always active"
                description="Cookie settings screen necessary cookies status"
              />
            </Text>
          </View>
          <View style={styles.cookieRow}>
            <View style={styles.cookieRowControl}>
              <Text variant="large">{cookieDescriptions.analytics.title}</Text>
              <IconButton
                icon="information"
                variant="icon"
                onPress={() => onInformationPress('analytics')}
              />
            </View>
            <Switch
              variant="large"
              value={consents.analytics}
              onValueChange={value => onCookieSettingChange('analytics', value)}
            />
          </View>
        </View>
        <View style={styles.cookieRow}>
          <View style={styles.cookieRowControl}>
            <Text variant="large">{cookieDescriptions.marketing.title}</Text>
            <IconButton
              icon="information"
              variant="icon"
              onPress={() => onInformationPress('marketing')}
            />
          </View>
          <Switch
            variant="large"
            value={consents.marketing}
            onValueChange={value => onCookieSettingChange('marketing', value)}
          />
        </View>
        <View style={styles.cookieRow}>
          <View style={styles.cookieRowControl}>
            <Text variant="large">{cookieDescriptions.functional.title}</Text>
            <IconButton
              icon="information"
              variant="icon"
              onPress={() => onInformationPress('functional')}
            />
          </View>
          <Switch
            variant="large"
            value={consents.functional}
            onValueChange={value => onCookieSettingChange('functional', value)}
          />
        </View>
        <Button
          label={
            <FormattedMessage
              defaultMessage="Allow All"
              description="Cookie content screen accept all button"
            />
          }
          onPress={onAccept}
          loading={inFlight}
        />
        <Button
          variant="secondary"
          label={
            <FormattedMessage
              defaultMessage="Confirm my choices"
              description="Cookie settings screen confirm button"
            />
          }
          onPress={onConfirm}
          loading={inFlight}
        />
      </ScrollView>
      <BottomSheetModal
        visible={showModal}
        onDismiss={onInformationClose}
        variant="modal"
      >
        <View style={styles.modalContent}>
          <Header
            leftElement={
              <IconButton
                icon="close"
                variant="icon"
                onPress={onInformationClose}
              />
            }
            middleElement={
              <Text variant="large">
                {displayedInformation &&
                  cookieDescriptions[displayedInformation].title}
              </Text>
            }
          />
          <Text variant="medium">
            {displayedInformation &&
              cookieDescriptions[displayedInformation].text}
          </Text>
        </View>
      </BottomSheetModal>
    </Container>
  );
};

export default relayScreen(CookieSettingsScreen, {
  query,
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 10 },
  title: { textAlign: 'center' },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
    gap: 20,
  },
  controlsContainer: {
    paddingTop: 10,
    gap: 20,
  },
  cookieRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cookieRowControl: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  alwaysActive: {
    color: colors.grey300,
    textAlign: 'right',
  },
  modalContent: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
  },
});
