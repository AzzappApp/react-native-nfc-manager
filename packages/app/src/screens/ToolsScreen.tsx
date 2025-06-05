import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { FormattedMessage, useIntl } from 'react-intl';
import { ScrollView, StyleSheet, View } from 'react-native';
import Share from 'react-native-share';
import { usePreloadedQuery } from 'react-relay';
import { graphql } from 'relay-runtime';
import env from '#env';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import useBoolean from '#hooks/useBoolean';
import { useGenerateEmailSignature } from '#hooks/useGenerateEmailSignature';
import { useGenerateLoadingPass } from '#hooks/useGenerateLoadingPass';
import useQRCodeKey from '#hooks/useQRCodeKey';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import IosAddLockScreenWidgetPopup from './ShakeAndShareScreen/IosAddLockScreenWidgetPopup';
import IosAddWidgetPopup from './ShakeAndShareScreen/IosAddWidgetPopup';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ToolsScreenQuery } from '#relayArtifacts/ToolsScreenQuery.graphql';
import type { ToolsRoute } from '#routes';

const ToolsScreen = ({
  preloadedQuery,
}: RelayScreenProps<ToolsRoute, ToolsScreenQuery>) => {
  const { node, currentUser } = usePreloadedQuery(toolsQuery, preloadedQuery);

  const qrCodeKey = useQRCodeKey();

  const [generateLoadingPass, loadingPass] = useGenerateLoadingPass(qrCodeKey);

  const [generateEmailSignature, isGeneratingEmail] = useGenerateEmailSignature(
    node?.profile?.id,
    qrCodeKey?.publicKey,
    currentUser?.email,
  );

  const intl = useIntl();
  const router = useRouter();
  const inset = useScreenInsets();

  const [
    popupIosLockScreenWidgetVisible,
    showIosLockScreenWidgetPopup,
    hideIosLockScreenWidgetPopup,
  ] = useBoolean(false);

  const [
    popupIosHomeScreenWidgetVisible,
    showIosHomeScreenWidgetPopup,
    hideIosHomeScreenWidgetPopup,
  ] = useBoolean(false);

  return (
    <Container style={{ flex: 1, paddingTop: inset.top }}>
      <Header
        leftElement={
          <IconButton
            icon="close"
            onPress={router.back}
            iconSize={28}
            variant="icon"
          />
        }
        middleElement={intl.formatMessage({
          defaultMessage: 'Tools',
          description: 'Title for the tools screen',
        })}
      />
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            {
              paddingBottom: inset.bottom,
            },
          ]}
        >
          <View style={styles.itemContainer}>
            <LinearGradient
              colors={['#614FE3', '#1C77C3', '#1C7EC4', '#23C5CB']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              locations={[0.0297, 0.3047, 0.5835, 0.8133]}
              style={styles.itemContent}
            >
              <View style={styles.itemContentContainer}>
                <View style={styles.itemLeftContainer}>
                  <View style={styles.titleWithDescription}>
                    <Text variant="large" appearance="dark">
                      <FormattedMessage
                        defaultMessage="AI Contact enrichment"
                        description="Tools screen - Title for the AI contact enrichment tool"
                      />
                    </Text>
                    <Text variant="small" appearance="dark">
                      <FormattedMessage
                        defaultMessage="Enrich your contacts and generate AI-powered profiles to get to know them better."
                        description="Tools screen - Description for the AI contact enrichment tool"
                      />
                    </Text>
                  </View>
                  <Button
                    style={styles.toolButton}
                    variant="primary"
                    onPress={() => {
                      router.push({ route: 'CONTACTS' });
                    }}
                    label={intl.formatMessage({
                      defaultMessage: 'Enrich',
                      description:
                        'Button label to enrich contacts in the tools screen',
                    })}
                  />
                </View>
              </View>
              <Image
                style={styles.illustration}
                contentFit="cover"
                source={require('#assets/tools/tools_01_ai.png')}
              />
            </LinearGradient>
          </View>
          <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <View style={styles.itemContentContainer}>
                <View style={styles.itemLeftContainer}>
                  <View style={styles.titleWithDescription}>
                    <Text variant="large" appearance="light">
                      <FormattedMessage
                        defaultMessage="Dynamic email signature"
                        description="Tools screen - Title for the dynamic email signature tool"
                      />
                    </Text>
                    <Text variant="small" appearance="light">
                      <FormattedMessage
                        defaultMessage="Generate your signature including avatar, logo, banner, 1 button to save your infos."
                        description="Tools screen - Description for the dynamic email signature tool"
                      />
                    </Text>
                  </View>
                  <Button
                    style={styles.toolButton}
                    variant="primary"
                    onPress={generateEmailSignature}
                    loading={isGeneratingEmail}
                    loadingStyle={styles.toolButtonLoading}
                    label={intl.formatMessage({
                      defaultMessage: 'Ask for it',
                      description:
                        'Button label to ask for a dynamic email signature in the tools screen',
                    })}
                  />
                </View>
              </View>
              <Image
                style={[styles.illustration, { width: '60%' }]}
                contentFit="cover"
                source={require('#assets/tools/tools_02_signature.png')}
              />
            </View>
          </View>

          <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <View style={styles.itemContentContainer}>
                <View style={styles.itemLeftContainer}>
                  <View style={styles.titleWithDescription}>
                    <Text variant="large" appearance="light">
                      <FormattedMessage
                        defaultMessage="AI Scanner for paper cards, badges..."
                        description="Tools screen - Title for the AI scanner tool"
                      />
                    </Text>
                    <Text variant="small" appearance="light">
                      <FormattedMessage
                        defaultMessage="Convert any paper card, email signature, event badge in to a contact."
                        description="Tools screen - Description for the AI scanner tool"
                      />
                    </Text>
                  </View>
                  <Button
                    style={styles.toolButton}
                    variant="primary"
                    onPress={() => {
                      router.push({
                        route: 'CONTACT_CREATE',
                        params: { showCardScanner: true },
                      });
                    }}
                    label={intl.formatMessage({
                      defaultMessage: 'Scan',
                      description:
                        'Button label to ask for scanning a card in the tools screen',
                    })}
                  />
                </View>
              </View>
              <Image
                style={[styles.illustration, { width: '60%' }]}
                contentFit="cover"
                source={require('#assets/tools/tools_03_scan.png')}
              />
            </View>
          </View>
          <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <View style={styles.itemContentContainer}>
                <View style={styles.itemLeftContainer}>
                  <View style={styles.titleWithDescription}>
                    <Text variant="large" appearance="light">
                      <FormattedMessage
                        defaultMessage="Offline QR-Code"
                        description="Tools screen - Title for the offline QR-Code tool"
                      />
                    </Text>
                    <Text variant="small" appearance="light">
                      <FormattedMessage
                        defaultMessage="Share your contact info without connection, you just won’t receive contact back."
                        description="Tools screen - Description for the offline QR-Code tool"
                      />
                    </Text>
                  </View>
                  <Button
                    style={styles.toolButton}
                    variant="primary"
                    onPress={() => {
                      router.push({
                        route: 'OFFLINE_VCARD',
                        params: { canGoBack: true },
                      });
                    }}
                    label={intl.formatMessage({
                      defaultMessage: 'Offline mode',
                      description:
                        'Button label to ask for offline QR-Code in the tools screen',
                    })}
                  />
                </View>
              </View>
              <Image
                style={[styles.illustration, { width: '63%' }]}
                contentFit="cover"
                source={require('#assets/tools/tools_04_offline.png')}
              />
            </View>
          </View>

          <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <View style={styles.itemContentContainer}>
                <View style={styles.itemLeftContainer}>
                  <View style={styles.titleWithDescription}>
                    <Text variant="large" appearance="light">
                      <FormattedMessage
                        defaultMessage="Multi-User"
                        description="Tools screen - Title for the multi-user tool"
                      />
                    </Text>
                    <Text variant="small" appearance="light">
                      <FormattedMessage
                        defaultMessage="Equip your entire team with digital business cards in minutes.
Only {price}/user/month."
                        description="Tools screen - Description for the multi-user tool"
                        values={{
                          price: (
                            <Text variant="small" style={styles.price}>
                              1€
                            </Text>
                          ),
                        }}
                      />
                    </Text>
                  </View>
                  <Button
                    style={styles.toolButton}
                    variant="primary"
                    onPress={() => {
                      router.push({
                        route: 'MULTI_USER',
                      });
                    }}
                    label={intl.formatMessage({
                      defaultMessage: 'Multi-User',
                      description:
                        'Button label to ask for multi-user in the tools screen',
                    })}
                  />
                </View>
              </View>
              <Image
                style={[styles.illustration, { width: '63%' }]}
                contentFit="cover"
                source={require('#assets/tools/tools_05_multi-user.png')}
              />
            </View>
          </View>

          <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <View style={styles.itemContentContainer}>
                <View style={styles.itemLeftContainer}>
                  <View style={styles.titleWithDescription}>
                    <Text variant="large" appearance="light">
                      <FormattedMessage
                        defaultMessage="Desktop platform"
                        description="Tools screen - Title for the desktop platform tool"
                      />
                    </Text>
                    <Text variant="small" appearance="light">
                      <FormattedMessage
                        defaultMessage="Manage your team from desktop, generate their email signature, and collect all contacts in one place."
                        description="Tools screen - Description for the desktop platform tool"
                      />
                    </Text>
                  </View>
                  <Button
                    style={styles.toolButton}
                    variant="primary"
                    onPress={() => {
                      Share.open({
                        title: intl.formatMessage({
                          defaultMessage: 'Share desktop link',
                          description:
                            'Title for the share dialog of the desktop platform link',
                        }),
                        message: intl.formatMessage({
                          defaultMessage:
                            'Manage your team from desktop, generate their email signature, and collect all contacts in one place.',
                          description:
                            'Description for the share dialog of the desktop platform link',
                        }),
                        url: env.NEXT_PUBLIC_USER_MGMT_URL,
                        failOnCancel: false,
                      });
                    }}
                    label={intl.formatMessage({
                      defaultMessage: 'Share desktop link',
                      description:
                        'Button label to ask for desktop platform in the tools screen',
                    })}
                  />
                </View>
              </View>
              <Image
                style={[styles.illustration, { width: '60%' }]}
                contentFit="cover"
                source={require('#assets/tools/tools_06_desktop.png')}
              />
            </View>
          </View>

          <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <View style={styles.itemContentContainer}>
                <View style={styles.itemLeftContainer}>
                  <View style={styles.titleWithDescription}>
                    <Text variant="large" appearance="light">
                      <FormattedMessage
                        defaultMessage="Lockscreen Widgets"
                        description="Tools screen - Title for the lockscreen widgets tool"
                      />
                    </Text>
                    <Text variant="small" appearance="light">
                      <FormattedMessage
                        defaultMessage="Access your QR-Code or open the scanner directly from your lock-screen."
                        description="Tools screen - Description for the lockscreen widgets tool"
                      />
                    </Text>
                  </View>
                  <Button
                    style={styles.toolButton}
                    variant="primary"
                    onPress={showIosLockScreenWidgetPopup}
                    label={intl.formatMessage({
                      defaultMessage: 'See how',
                      description:
                        'Button label to ask for lockscreen widgets in the tools screen',
                    })}
                  />
                </View>
              </View>
              <Image
                style={[styles.illustration, { width: '60%' }]}
                contentFit="cover"
                source={require('#assets/tools/tools_07_lockscreen_widgets.png')}
              />
            </View>
          </View>

          <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <View style={styles.itemContentContainer}>
                <View style={styles.itemLeftContainer}>
                  <View style={styles.titleWithDescription}>
                    <Text variant="large" appearance="light">
                      <FormattedMessage
                        defaultMessage="Homescreen Widgets"
                        description="Tools screen - Title for the homescreen widgets tool"
                      />
                    </Text>
                    <Text variant="small" appearance="light">
                      <FormattedMessage
                        defaultMessage="Access your QR-Code directly from your Home screen."
                        description="Tools screen - Description for the homescreen widgets tool"
                      />
                    </Text>
                  </View>
                  <Button
                    style={styles.toolButton}
                    variant="primary"
                    onPress={showIosHomeScreenWidgetPopup}
                    label={intl.formatMessage({
                      defaultMessage: 'See how',
                      description:
                        'Button label to ask for homescreen widgets in the tools screen',
                    })}
                  />
                </View>
              </View>
              <Image
                style={[styles.illustration, { width: '60%' }]}
                contentFit="cover"
                source={require('#assets/tools/tools_08_homescreen_widgets.png')}
              />
            </View>
          </View>

          <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <View style={styles.itemContentContainer}>
                <View style={styles.itemLeftContainer}>
                  <View style={styles.titleWithDescription}>
                    <Text variant="large" appearance="light">
                      <FormattedMessage
                        defaultMessage="Share your contact the way you want"
                        description="Tools screen - Title for the share contact tool"
                      />
                    </Text>
                    <Text variant="small" appearance="light">
                      <FormattedMessage
                        defaultMessage="Shake your phone to display your QR-Code, send it by message, dropbox, mail..."
                        description="Tools screen - Description for the share contact tool"
                      />
                    </Text>
                  </View>
                  <Button
                    style={styles.toolButton}
                    variant="primary"
                    onPress={() => {
                      router.push({
                        route: 'SHAKE_AND_SHARE',
                      });
                    }}
                    label={intl.formatMessage({
                      defaultMessage: 'Share now',
                      description:
                        'Button label to ask for sharing the contact in the tools screen',
                    })}
                  />
                </View>
              </View>
              <Image
                style={[styles.illustration, { width: '60%' }]}
                contentFit="cover"
                source={require('#assets/tools/tools_09_share.png')}
              />
            </View>
          </View>

          <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <View style={styles.itemContentContainer}>
                <View style={styles.itemLeftContainer}>
                  <View style={styles.titleWithDescription}>
                    <Text variant="large" appearance="light">
                      <FormattedMessage
                        defaultMessage="Add your card to your Wallet"
                        description="Tools screen - Title for the add to wallet tool"
                      />
                    </Text>
                    <Text variant="small" appearance="light">
                      <FormattedMessage
                        defaultMessage="Access your QR-Code and share your contact info via your Wallet."
                        description="Tools screen - Description for the add to wallet tool"
                      />
                    </Text>
                  </View>
                  <Button
                    loading={loadingPass}
                    loadingStyle={styles.toolButtonLoading}
                    style={styles.toolButton}
                    variant="primary"
                    onPress={generateLoadingPass}
                    label={intl.formatMessage({
                      defaultMessage: 'Add to Wallet',
                      description:
                        'Button label to ask for adding the card to the wallet in the tools screen',
                    })}
                  />
                </View>
              </View>
              <Image
                style={[styles.illustration, { width: '60%' }]}
                contentFit="cover"
                source={require('#assets/tools/tools_10_wallet.png')}
              />
            </View>
          </View>

          <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <View style={styles.itemContentContainer}>
                <View style={styles.itemLeftContainer}>
                  <View style={styles.titleWithDescription}>
                    <Text variant="large" appearance="light">
                      <FormattedMessage
                        defaultMessage="Build your Website"
                        description="Tools screen - Title for the build your website tool"
                      />
                    </Text>
                    <Text variant="small" appearance="light">
                      <FormattedMessage
                        defaultMessage="Build a fully responsive WebSite from your mobile, and present yourself or your company."
                        description="Tools screen - Description for the build your website tool"
                      />
                    </Text>
                  </View>
                  <Button
                    style={styles.toolButton}
                    variant="primary"
                    disabled={!node?.profile?.webCard?.id}
                    onPress={() => {
                      if (node?.profile?.webCard?.id) {
                        router.push({
                          route: 'WEBCARD',
                          params: {
                            webCardId: node.profile.webCard.id,
                            editing: true,
                          },
                        });
                      }
                    }}
                    label={intl.formatMessage({
                      defaultMessage: 'Build my WebCard',
                      description:
                        'Button label to ask for building a website in the tools screen',
                    })}
                  />
                </View>
              </View>
              <Image
                style={[styles.illustration, { width: '60%' }]}
                contentFit="cover"
                source={require('#assets/tools/tools_11_website.png')}
              />
            </View>
          </View>

          <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <View style={styles.itemContentContainer}>
                <View style={styles.itemLeftContainer}>
                  <View style={styles.titleWithDescription}>
                    <Text variant="large" appearance="light">
                      <FormattedMessage
                        defaultMessage="Track your Networking activity"
                        description="Tools screen - Title for the track networking activity tool"
                      />
                    </Text>
                    <Text variant="small" appearance="light">
                      <FormattedMessage
                        defaultMessage="Access to your activity screen and track your card performance."
                        description="Tools screen - Description for the track networking activity tool"
                      />
                    </Text>
                  </View>
                  <Button
                    style={styles.toolButton}
                    variant="primary"
                    onPress={() => {
                      router.push({
                        route: 'ANALYTICS',
                      });
                    }}
                    label={intl.formatMessage({
                      defaultMessage: 'See activity',
                      description:
                        'Button label to ask for tracking networking activity in the tools screen',
                    })}
                  />
                </View>
              </View>
              <Image
                style={[styles.illustration, { width: '60%' }]}
                contentFit="cover"
                source={require('#assets/tools/tools_12_track.png')}
              />
            </View>
          </View>

          <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <View style={styles.itemContentContainer}>
                <View style={styles.itemLeftContainer}>
                  <View style={styles.titleWithDescription}>
                    <Text variant="large" appearance="light">
                      <FormattedMessage
                        defaultMessage="Create covers for your profile"
                        description="Tools screen - Title for the create covers tool"
                      />
                    </Text>
                    <Text variant="small" appearance="light">
                      <FormattedMessage
                        defaultMessage="Select animated templates or start from scratch."
                        description="Tools screen - Description for the create covers tool"
                      />
                    </Text>
                  </View>
                  <Button
                    style={styles.toolButton}
                    variant="primary"
                    onPress={() => {
                      router.push({
                        route: 'COVER_EDITION',
                      });
                    }}
                    label={intl.formatMessage({
                      defaultMessage: 'Edit cover',
                      description:
                        'Button label to ask for creating covers in the tools screen',
                    })}
                  />
                </View>
              </View>
              <Image
                style={[styles.illustration, { width: '60%' }]}
                contentFit="cover"
                source={require('#assets/tools/tools_13_cover.png')}
              />
            </View>
          </View>
        </ScrollView>
        <IosAddLockScreenWidgetPopup
          visible={popupIosLockScreenWidgetVisible}
          onHide={hideIosLockScreenWidgetPopup}
        />
        <IosAddWidgetPopup
          visible={popupIosHomeScreenWidgetVisible}
          onHide={hideIosHomeScreenWidgetPopup}
        />
      </View>
    </Container>
  );
};

const toolsQuery = graphql`
  query ToolsScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        id
        invited
        webCard {
          id
        }
      }
    }
    currentUser {
      email
    }
  }
`;

export default relayScreen(ToolsScreen, {
  query: toolsQuery,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId,
  }),
});

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  itemContainer: {
    backgroundColor: '#F5F5F6',
    marginBottom: 30,
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 183,
  },
  itemContent: { flex: 1 },
  itemContentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 17,
    flexDirection: 'row',
  },
  itemLeftContainer: {
    justifyContent: 'space-between',
    flex: 1,
    height: '100%',
    maxWidth: '50%',
  },
  titleWithDescription: { gap: 8 },
  toolButton: {
    borderRadius: 27,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 15,
    height: 'auto',
  },
  toolButtonLoading: { height: 20, width: 20 },
  illustration: {
    width: '50%',
    height: '100%',
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  price: { color: 'red', fontWeight: 'bold' },
});
