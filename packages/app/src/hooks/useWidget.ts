import * as Sentry from '@sentry/react-native';
import isEqual from 'lodash/isEqual';
import { useCallback, useEffect, useState } from 'react';
import { NativeModules, Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { useFragment, graphql } from 'react-relay';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { isDefined } from '@azzapp/shared/isDefined';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { buildUserUrlWithKey } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import { addGlobalEventListener } from '#helpers/globalEvents';
import { useAppState } from './useAppState';
import {
  addOnPublicKeysChangeListener,
  getPublicKeyForProfileId,
} from './useQRCodeKey';
import type {
  useWidget_user$data,
  useWidget_user$key,
} from '#relayArtifacts/useWidget_user.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';

//TODO: android widget
//const SharedStorage = NativeModules.SharedStorage;

const group = process.env.WIDGET_APP_GROUP;

const { AZPWidgetKit } = NativeModules;

type WidgetData = {
  userName: string | null;
  url: string;
  color: string;
  textColor: string;
  displayName: string;
};

const useWidget = (profileKey: useWidget_user$key | null) => {
  const [widgetProfile, setWidgetProfile] = useState<WidgetData[]>([]);
  const data = useFragment(
    graphql`
      fragment useWidget_user on User
      @argumentDefinitions(
        deviceId: { type: "String!", provider: "qrCodeDeviceId.relayprovider" }
      ) {
        profiles {
          id
          webCard {
            isMultiUser
            userName
            cardIsPublished
            cardColors {
              primary
            }
            commonInformation {
              company
            }
          }
          contactCard {
            firstName
            lastName
            title
            company
          }
          contactCardAccessId(deviceId: $deviceId)
        }
      }
    `,
    profileKey,
  );

  const updateWidgetData = useCallback(
    async (profiles: WidgetProfile[]) => {
      try {
        const widgetData = profiles
          ?.map((profile: WidgetProfile) => {
            if (profile && profile.webCard?.cardIsPublished) {
              const { webCard, contactCard } = profile;
              const company = webCard.isMultiUser
                ? webCard.commonInformation?.company || contactCard?.company
                : contactCard?.company;

              const contactCardAccessId = profile.contactCardAccessId;

              const publicKey = getPublicKeyForProfileId(profile.id);
              if (
                contactCardAccessId &&
                publicKey &&
                profile.webCard.userName
              ) {
                return {
                  userName: profile.webCard.userName,
                  url: buildUserUrlWithKey({
                    userName: profile.webCard.userName,
                    key: publicKey,
                    contactCardAccessId,
                  }),
                  color: profile.webCard.cardColors?.primary ?? colors.white,
                  textColor: getTextColor(
                    profile.webCard.cardColors?.primary ?? colors.black,
                  ),
                  displayName: formatDisplayName(
                    contactCard?.firstName,
                    contactCard?.lastName,
                    company,
                  ),
                };
              } else {
                return null;
              }
            } else return null;
          })
          .filter(isDefined);
        //don't create too much noise, and avoid reload the widget is not required
        if (isEqual(widgetData, widgetProfile)) return;
        setWidgetProfile(widgetData);
        if (Platform.OS === 'ios') {
          await SharedGroupPreferences.setItem(
            'azzapp-qrcode-widget_v1',
            widgetData,
            group,
          );
          AZPWidgetKit.reloadAllTimelines();
        }
        //TODO: android widget
        // else {
        //   SharedStorage.set(JSON.stringify(widgetData));
        // }
      } catch (error) {
        Sentry.captureException(error);
        console.log({ error });
      }
    },
    [widgetProfile],
  );

  addGlobalEventListener('SIGN_OUT', async () => {
    //clean the widget data
    if (Platform.OS === 'ios') {
      await SharedGroupPreferences.setItem(
        'azzapp-qrcode-widget_v1',
        [],
        group,
      );
      AZPWidgetKit.reloadAllTimelines();
    }
    //TODO: android widget
    // else {
    //   SharedStorage.set(null);
    // }
  });

  const appState = useAppState();
  useEffect(() => {
    // call the update also on goign to background, the widget update only if there is change
    if ((appState === 'active' || appState === 'inactive') && data?.profiles) {
      updateWidgetData([...data.profiles]);
    }
  }, [data?.profiles, updateWidgetData, appState]);

  useEffect(() => {
    const listener = addOnPublicKeysChangeListener(() => {
      if (data?.profiles) {
        updateWidgetData([...data.profiles]);
      }
    });

    return () => {
      listener.remove();
    };
  }, [data?.profiles, updateWidgetData]);
};

type WidgetProfile = NonNullable<
  ArrayItemType<useWidget_user$data['profiles']>
>;
export default useWidget;

const formatDisplayName = (
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  companyName: string | null | undefined,
) => {
  let result = '';
  if (firstName) {
    result = `${firstName} `;
  }
  if (lastName) {
    result += `${lastName}`;
  }
  if (companyName) {
    if (isNotFalsyString(result)) {
      result += ' - ';
    }
    result += `${companyName}`;
  }
  return result;
};
