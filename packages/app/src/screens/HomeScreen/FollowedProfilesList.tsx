import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Platform, Image, StyleSheet } from 'react-native';
import { graphql, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
} from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import CoverList from '#components/CoverList';
import QRCodeModal from '#components/CoverRenderer/QRCodeModal';
import Link from '#components/Link';
import PressableNative from '#ui/PressableNative';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import type { CoverList_users$key } from '@azzapp/relay/artifacts/CoverList_users.graphql';
import type { FollowedProfilesList_viewer$key } from '@azzapp/relay/artifacts/FollowedProfilesList_viewer.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type FollowedProfilesListProps = {
  viewer: FollowedProfilesList_viewer$key;
  style?: StyleProp<ViewStyle>;
};

const FollowedProfilesList = ({ viewer, style }: FollowedProfilesListProps) => {
  const intl = useIntl();
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(
    graphql`
      fragment FollowedProfilesList_viewer on Viewer
      @refetchable(queryName: "FollowedProfilesListQuery")
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
      }
    `,
    viewer,
  );

  const users: CoverList_users$key = useMemo(() => {
    const recommendedUrsers = data.followedProfiles.edges
      ?.map(edge => edge?.node)
      .filter(item => !!item);
    return convertToNonNullArray(
      data.profile?.card?.id
        ? [data.profile, ...(recommendedUrsers ?? [])]
        : recommendedUrsers ?? [],
    );
  }, [data.followedProfiles.edges, data.profile]);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  const [qrCodeVisible, setQRCodeVisible] = useState(false);
  const toggleQrcCode = () => {
    setQRCodeVisible(prev => !prev);
  };

  const ListHeaderComponent = useMemo(() => {
    if (data.profile && !data.profile.card?.id) {
      return (
        <Link
          route="CARD_MODULE_EDITION"
          params={{
            module: 'template-selector',
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
                source={require('../../components/CoverRenderer/assets/qr-code.png')}
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

  return (
    <CoverList
      users={users}
      onEndReached={onEndReached}
      style={style}
      ListHeaderComponent={ListHeaderComponent}
    />
  );
};
const BORDER_RADIUS = Platform.select({
  web: '12.8%' as any,
  default: COVER_CARD_RADIUS * COVER_BASE_WIDTH,
});
export default FollowedProfilesList;

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
