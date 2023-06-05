import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Platform, Image, StyleSheet } from 'react-native';
import { graphql, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import CoverList from '#components/CoverList';
import QRCodeModal from '#components/CoverRenderer/QRCodeModal';
import Link from '#components/Link';
import PressableNative from '#ui/PressableNative';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import SuggestedProfilesList from './SuggestedProfilesList';
import type { CoverList_users$key } from '@azzapp/relay/artifacts/CoverList_users.graphql';
import type { HomeProfilesList_viewer$key } from '@azzapp/relay/artifacts/HomeProfilesList_viewer.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type HomeProfilesListProps = {
  viewer: HomeProfilesList_viewer$key;
  onReady?: () => void;
  style?: StyleProp<ViewStyle>;
};

const HomeProfilesList = ({
  viewer,
  onReady,
  style,
}: HomeProfilesListProps) => {
  const intl = useIntl();
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(
    graphql`
      fragment HomeProfilesList_viewer on Viewer
      @refetchable(queryName: "HomeProfilesListQuery")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 10 }
      ) {
        followedProfiles(after: $after, first: $first)
          @connection(key: "Viewer_followedProfiles") {
          edges {
            node {
              ...CoverList_users
            }
          }
        }
        profile {
          id
          userName
          card {
            id
          }
          ...CoverList_users
        }
        ...SuggestedProfilesList_viewer
      }
    `,
    viewer,
  );

  const recommendedUsers = data.followedProfiles.edges
    ?.map(edge => edge?.node)
    .filter(item => !!item);

  const users: CoverList_users$key = useMemo(() => {
    return convertToNonNullArray(
      data.profile?.card?.id
        ? [data.profile, ...(recommendedUsers ?? [])]
        : recommendedUsers ?? [],
    );
  }, [recommendedUsers, data.profile]);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  const [qrCodeVisible, setQRCodeVisible] = useState(false);
  const toggleQrcCode = () => {
    setQRCodeVisible(prev => !prev);
  };

  // even if TemplateSelectorScreen, keeping it waiting this Nico/Robin design on the empty cover
  const ListHeaderComponent = useMemo(() => {
    if (data.profile && !data.profile.card?.id) {
      return (
        <Link
          route="CARD_MODULE_EDITION"
          params={{
            module: 'cover',
            isNew: true,
          }}
        >
          <PressableScaleHighlight style={styles.listHeaderPressable}>
            <PressableNative
              onPress={toggleQrcCode}
              accessibilityRole="button"
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Tap me to show the QR Code fullscreen',
                description: 'CoverRenderer - Accessibility Qr code button',
              })}
              style={styles.qrCode}
            >
              <Image
                accessibilityRole="image"
                source={require('#assets/qrcode.png')}
                style={styles.layer}
              />
            </PressableNative>
            {qrCodeVisible && (
              <QRCodeModal
                onRequestClose={toggleQrcCode}
                userName={data.profile?.userName}
              />
            )}
          </PressableScaleHighlight>
        </Link>
      );
    } else {
      return null;
    }
  }, [data.profile, intl, qrCodeVisible]);

  return recommendedUsers?.length ? (
    <CoverList
      users={users}
      onEndReached={onEndReached}
      style={style}
      ListHeaderComponent={ListHeaderComponent}
      onReady={onReady}
    />
  ) : (
    <SuggestedProfilesList
      style={style}
      viewer={data}
      profile={data.profile}
      ListHeaderComponent={ListHeaderComponent}
      onReady={onReady}
    />
  );
};
const BORDER_RADIUS = Platform.select({
  web: '12.8%' as any,
  default: COVER_CARD_RADIUS * COVER_BASE_WIDTH,
});
export default HomeProfilesList;

const styles = StyleSheet.create({
  listHeaderPressable: {
    marginRight: 10,
    width: COVER_BASE_WIDTH,
    aspectRatio: COVER_RATIO,
    backgroundColor: colors.grey100,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  qrCode: {
    position: 'absolute',
    top: '10%',
    left: '45%',
    width: '10%',
    aspectRatio: 1,
  },
});
