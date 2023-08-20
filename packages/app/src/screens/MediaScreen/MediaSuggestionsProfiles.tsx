import { useMemo, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import {
  ConnectionHandler,
  commitLocalUpdate,
  graphql,
  usePaginationFragment,
  useRelayEnvironment,
} from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { colors, shadow } from '#theme';
import CoverLink from '#components/CoverLink';
import CoverList from '#components/CoverList';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useToggleFollow from '#hooks/useToggleFollow';
import Button from '#ui/Button';
import IconButton from '#ui/IconButton';
import type { CoverLinkProps } from '#components/CoverLink';
import type { CoverList_users$key } from '@azzapp/relay/artifacts/CoverList_users.graphql';
import type { MediaSuggestionsProfiles_viewer$key } from '@azzapp/relay/artifacts/MediaSuggestionsProfiles_viewer.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type MediaSuggestionsProfilesProps = {
  viewer: MediaSuggestionsProfiles_viewer$key;
  style?: StyleProp<ViewStyle>;
  header?: React.ReactNode;
};

const NB_PROFILES = 6;

const MediaSuggestionsProfiles = ({
  viewer,
  style,
  header,
}: MediaSuggestionsProfilesProps) => {
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(
    graphql`
      fragment MediaSuggestionsProfiles_viewer on Viewer
      @refetchable(queryName: "MediaSuggestionsProfilesListQuery")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 6 }
      ) {
        profile {
          id
        }
        recommendedProfiles(after: $after, first: $first)
          @connection(key: "Viewer_recommendedProfiles") {
          edges {
            node {
              ...CoverList_users
            }
          }
        }
      }
    `,
    viewer,
  );

  const users: CoverList_users$key = useMemo(() => {
    return convertToNonNullArray(
      data.recommendedProfiles.edges?.map(edge => edge?.node) ?? [],
    );
  }, [data.recommendedProfiles.edges]);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(NB_PROFILES);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  const styles = useStyleSheet(styleSheet);

  return (
    <View>
      {header}
      <CoverList
        users={users}
        onEndReached={onEndReached}
        containerStyle={styles.containerStyle}
        initialNumToRender={NB_PROFILES}
        style={style}
        renderItem={({ item }) => (
          <CoverLinkWithOptions
            profile={item}
            profileId={item.id}
            viewerProfileID={data.profile?.id}
          />
        )}
      />
    </View>
  );
};

const CoverLinkWithOptions = ({
  viewerProfileID,
  ...props
}: CoverLinkProps & { viewerProfileID?: string }) => {
  const styles = useStyleSheet(styleSheet);

  const toggleFollow = useToggleFollow(viewerProfileID);

  const environment = useRelayEnvironment();

  const intl = useIntl();

  return (
    <Animated.View style={styles.coverContainerStyle} exiting={FadeOut}>
      <CoverLink {...props} width={135} />
      <View style={styles.bottomActions}>
        <Button
          variant="little_round"
          label={intl.formatMessage({
            defaultMessage: 'Follow',
            description: 'Follow button label',
          })}
          style={{ flex: 1 }}
          onPress={() => {
            toggleFollow(props.profileId, true);
          }}
        />
        <IconButton
          icon="close"
          size={29}
          onPress={() => {
            //TODO: implement real update in database
            commitLocalUpdate(environment, store => {
              const viewer = store.getRoot().getLinkedRecord('viewer');
              if (viewer) {
                const connectionRecordSuggestions =
                  ConnectionHandler.getConnection(
                    viewer,
                    'Viewer_recommendedProfiles',
                  );

                if (connectionRecordSuggestions) {
                  ConnectionHandler.deleteNode(
                    connectionRecordSuggestions,
                    props.profileId,
                  );
                }
              }
            });
          }}
        />
      </View>
    </Animated.View>
  );
};

export default MediaSuggestionsProfiles;

const styleSheet = createStyleSheet(appearance => ({
  containerStyle: {
    paddingHorizontal: 8,
    overflow: 'visible',
    zIndex: 1,
    gap: 10,
  },
  coverContainerStyle: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    padding: 5,
    gap: 5,
    borderRadius: 15,
    ...shadow(appearance, 'bottom'),
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 5,
    width: '100%',
    alignItems: 'center',
  },
}));
