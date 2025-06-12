import * as Sentry from '@sentry/react-native';
import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, useWindowDimensions, View, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useMutation } from 'react-relay';
import { useDebounce } from 'use-debounce';
import MediaGridList from '#components/MediaGridList';
import { useProfileInfos } from '#hooks/authStateHooks';
import SearchBarStatic from '#ui/SearchBarStatic';
import type { SourceMedia } from '#helpers/mediaHelpers';
import type {
  LogosMediaListMutation,
  LogosMediaListMutation$data,
} from '#relayArtifacts/LogosMediaListMutation.graphql';
import type { ViewProps } from 'react-native';

type LogoImage = NonNullable<
  NonNullable<LogosMediaListMutation$data['extractCompanyLogo']>[number]
>;

type StockMediaListProps = Omit<ViewProps, 'children'> & {
  selectedMediasIds: string[];
  onMediaSelected: (media: SourceMedia) => void;
  defaultSearchValue?: string | null;
};

const LogosMediaList = ({
  selectedMediasIds,
  onMediaSelected,
  style,
  defaultSearchValue = null,
  ...props
}: StockMediaListProps) => {
  const intl = useIntl();
  const profileInfos = useProfileInfos();
  const [search, setSearch] = useState<string | null>(defaultSearchValue);
  const [debouncedSearch] = useDebounce(search, 300);
  const [logos, setLogos] = useState<LogoImage[]>([]);

  const [commit] = useMutation<LogosMediaListMutation>(graphql`
    mutation LogosMediaListMutation($brand: String!) {
      extractCompanyLogo(brand: $brand) {
        id
        score
        uri
      }
    }
  `);

  if (!profileInfos?.profileId) {
    throw new Error('LogoList should be used only when user is logged in');
  }

  const onSearchChange = useCallback((text?: string) => {
    setSearch(text || null);
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      commit({
        variables: { brand: debouncedSearch },
        onCompleted: data => {
          setLogos(data.extractCompanyLogo as LogoImage[]);
        },
      });
    }
  }, [commit, debouncedSearch]);

  const onStockMediaSelect = useCallback(
    async (media: LogoImage) => {
      try {
        const { width, height } = await Image.getSize(media.uri);
        onMediaSelected({
          id: media.id,
          kind: 'image',
          uri: media.uri,
          width,
          height,
        });
      } catch (error) {
        Sentry.captureException(error);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Error while reading the media',
            description:
              'Error toast message when reading logo media in the media picker',
          }),
        });
      }
    },
    [intl, onMediaSelected],
  );

  const { width: windowWidth } = useWindowDimensions();

  return (
    <View style={[style, styles.root]} {...props}>
      <SearchBarStatic
        value={search ?? ''}
        placeholder={intl.formatMessage({
          defaultMessage: 'Search for a logo',
          description: 'Search placeholder for logos images',
        })}
        onChangeText={onSearchChange}
        style={styles.searchBar}
      />
      <MediaGridList
        medias={debouncedSearch ? logos : []}
        selectedMediaIds={selectedMediasIds}
        filesDownloading={null}
        refreshing={false}
        numColumns={4}
        width={windowWidth}
        getItemId={getItemId}
        getItemUri={getItemUri}
        getItemDuration={getItemDuration}
        onSelect={onStockMediaSelect}
        testID="logos-gallery-list"
      />
    </View>
  );
};

export default LogosMediaList;

const getItemId = (item: LogoImage) => item.id;

const getItemUri = (item: LogoImage) => item.uri;

const getItemDuration = () => undefined;

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 10, gap: 10 },
  searchBar: { marginHorizontal: 20 },
});
