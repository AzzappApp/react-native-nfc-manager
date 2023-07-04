import {
  getContactByIdAsync,
  updateContactAsync,
  presentFormAsync,
  addContactAsync,
  requestPermissionsAsync,
} from 'expo-contacts';
import { fromGlobalId } from 'graphql-relay';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Dimensions, Platform, View } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { graphql, usePreloadedQuery } from 'react-relay';
import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import { parseContactCard } from '@azzapp/shared/contactCardHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import {
  useNativeNavigationEvent,
  useRouter,
  useScreenOptionsUpdater,
} from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import useToggle from '#hooks/useToggle';
import useToggleFollow from '#hooks/useToggleFollow';
import CardFlipSwitch from './CardFlipSwitch';
import ProfilePostsList from './ProfilePostsList';
import ProfileScreenButtonBar from './ProfileScreenButtonBar';
import ProfileScreenContent from './ProfileScreenContent';
import { ProfileScreenTransitionsProvider } from './ProfileScreenTransitions';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ProfileRoute } from '#routes';
import type { ProfileScreenByIdQuery } from '@azzapp/relay/artifacts/ProfileScreenByIdQuery.graphql';
import type { ProfileScreenByUserNameQuery } from '@azzapp/relay/artifacts/ProfileScreenByUserNameQuery.graphql';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { Contact } from 'expo-contacts';

export const storage = new MMKV({
  id: 'contacts',
});

/**
 * Display a profile Web card.
 */
const ProfileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<
  ProfileRoute,
  ProfileScreenByIdQuery | ProfileScreenByUserNameQuery
>) => {
  const data = usePreloadedQuery(getQuery(params), preloadedQuery);
  const [ready, setReady] = useState(false);
  useNativeNavigationEvent('appear', () => {
    setReady(true);
  });

  const router = useRouter();
  const onHome = () => {
    router.backToTop();
  };

  const prefetchRoute = usePrefetchRoute();
  useEffect(() => {
    const { viewer, profile } = data;
    if (
      viewer?.profile?.id &&
      profile?.id &&
      viewer.profile.id === profile.id
    ) {
      const modules: Array<ModuleKind | 'cover'> = ['cover', ...MODULE_KINDS];
      modules.forEach(module => {
        prefetchRoute({
          route: 'CARD_MODULE_EDITION',
          params: { module },
        });
      });
    }
  }, [data, prefetchRoute]);

  const [showPost, toggleFlip] = useToggle(params.showPosts ?? false);
  const [editing, toggleEditing] = useToggle(false);
  const [selectionMode, toggleSelectionMode] = useToggle(false);

  const [isAtTop, setIsAtTop] = useState(true);
  const onContentPositionChange = useCallback((atTop: boolean) => {
    setIsAtTop(atTop);
  }, []);

  const setOptions = useScreenOptionsUpdater();
  useEffect(() => {
    const animation: ScreenOptions =
      showPost || !isAtTop
        ? { stackAnimation: 'slide_from_bottom' }
        : animatedTransitionFactory(params);
    setOptions({
      gestureEnabled: !editing && !showPost,
      ...animation,
    });
  }, [setOptions, showPost, editing, params, isAtTop]);

  const onToggleFollow = useToggleFollow(data.viewer?.profile?.id);

  const intl = useIntl();

  useEffect(() => {
    if (params.contactData && data.profile) {
      if (params.contactData.startsWith(fromGlobalId(data.profile.id).id)) {
        const contact = buildContact(params.contactData);
        Alert.alert(
          intl.formatMessage(
            {
              defaultMessage: 'Add {name} to contacts?',
              description: 'Alert title when adding a profile to contacts',
            },
            {
              name: `${data.profile.userName}`,
            },
          ),
          intl.formatMessage(
            {
              defaultMessage: 'Add {name} to the contacts list of your phone',
              description: 'Alert message when adding a profile to contacts',
            },
            {
              name: `${contact.firstName} ${contact.lastName}`,
            },
          ),
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'OK',
              onPress: async () => {
                try {
                  const { status } = await requestPermissionsAsync();
                  if (status === 'granted') {
                    let foundContact: Contact | undefined = undefined;
                    if (contact.id && storage.contains(contact.id)) {
                      const internalId = storage.getString(contact.id);
                      if (internalId) {
                        foundContact = await getContactByIdAsync(internalId);
                      }
                    }

                    if (foundContact) {
                      if (Platform.OS === 'ios') {
                        await updateContactAsync({
                          ...contact,
                          id: foundContact.id,
                        });
                      } else {
                        await presentFormAsync(foundContact.id, contact);
                      }
                    } else {
                      const resultId = await addContactAsync(contact);
                      if (contact.id) {
                        storage.set(contact.id, resultId);
                      }
                    }
                  }
                } catch (e) {
                  console.error(e);
                }
              },
            },
          ],
        );
      }
    }
  }, [data.profile, intl, params.contactData]);

  if (!data.profile) {
    return null;
  }
  const isViewer = data.profile.id === data.viewer.profile?.id;

  return (
    <ProfileScreenTransitionsProvider
      editing={editing}
      selectionMode={selectionMode}
    >
      <View style={{ flex: 1 }}>
        <CardFlipSwitch
          style={{ flex: 1 }}
          flipped={showPost}
          disabled={editing}
          onFlip={toggleFlip}
          front={
            <ProfileScreenContent
              ready={ready}
              profile={data.profile}
              editing={editing}
              selectionMode={selectionMode}
              onToggleEditing={toggleEditing}
              onToggleSelectionMode={toggleSelectionMode}
              onContentPositionChange={onContentPositionChange}
            />
          }
          back={
            <Suspense>
              <ProfilePostsList
                isViewer={data.profile.id === data.viewer.profile?.id}
                profile={data.profile}
                hasFocus={showPost && ready}
                userName={data.profile.userName!}
              />
            </Suspense>
          }
        />
        <ProfileScreenButtonBar
          profile={data.profile}
          isViewer={isViewer}
          editing={editing}
          onHome={onHome}
          isWebCardDisplayed={!showPost}
          onEdit={toggleEditing}
          onToggleFollow={follow => onToggleFollow(data.profile!.id, follow)}
          onFlip={toggleFlip}
        />
      </View>
    </ProfileScreenTransitionsProvider>
  );
};

const buildContact = (contactCardData: string) => {
  const {
    profileId,
    firstName,
    lastName,
    company,
    title,
    phones,
    emails,
    urls,
  } = parseContactCard(contactCardData);

  const contact: Contact = {
    id: profileId,
    contactType: 'person',
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    name: `${firstName ?? ''} ${lastName ?? ''}`,
    company: company ?? '',
    jobTitle: title ?? '',
    phoneNumbers: phones.map(phone => ({
      label: phone.label,
      number: phone.number,
      isPrimary: phone.label === 'Main',
      id: `${profileId}-${phone.number}`,
    })),
    emails: emails.map(email => ({
      label: email.label,
      email: email.email,
      isPrimary: email.label === 'Main',
      id: `${profileId}-${email.email}`,
    })),
    urlAddresses: urls.map(url => ({
      label: url.label,
      url: url.url,
      id: `${profileId}-${url.url}`,
    })),
  };

  return contact;
};

const getQuery = (params: ProfileRoute['params']) =>
  params.profileID ? profileScreenByIdQuery : profileScreenByNameQuery;

const profileScreenByIdQuery = graphql`
  query ProfileScreenByIdQuery($profileID: ID!) {
    profile: node(id: $profileID) {
      id
      ... on Profile {
        userName
      }
      ...ProfileScreenContent_profile
      ...ProfilePostsList_profile
      ...PostRendererFragment_author
      ...ProfileScreenButtonBar_profile
    }
    viewer {
      profile {
        id
      }
    }
  }
`;

const profileScreenByNameQuery = graphql`
  query ProfileScreenByUserNameQuery($userName: String!) {
    profile(userName: $userName) {
      id
      userName
      ...ProfileScreenContent_profile
      ...ProfilePostsList_profile
      ...PostRendererFragment_author
      ...ProfileScreenButtonBar_profile
    }
    viewer {
      profile {
        id
      }
    }
  }
`;

const animatedTransitionFactory = ({
  fromRectangle,
  showPosts,
}: ProfileRoute['params']): ScreenOptions => {
  if (Platform.OS !== 'ios' || !fromRectangle || showPosts) {
    return { stackAnimation: 'slide_from_bottom' };
  }
  const windowWidth = Dimensions.get('window').width;
  return {
    stackAnimation: 'custom',
    stackAnimationOptions: {
      animator: 'reveal',
      fromRectangle,
      toRectangle: {
        x: 0,
        y: 0,
        width: windowWidth,
        height: windowWidth / COVER_RATIO,
      },
      fromRadius: COVER_CARD_RADIUS * windowWidth,
      toRadius: 0,
    },
    transitionDuration: 220,
    customAnimationOnSwipe: true,
    gestureEnabled: true,
  };
};

ProfileScreen.getScreenOptions = animatedTransitionFactory;

export default relayScreen(ProfileScreen, {
  query: getQuery,
  getVariables: ({ userName, profileID }) =>
    profileID ? { profileID } : { userName },
});
