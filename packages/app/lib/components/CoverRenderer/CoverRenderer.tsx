import { COVER_BASE_WIDTH } from '@azzapp/shared/lib/imagesFormats';
import {
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { graphql, useFragment } from 'react-relay';
import CoverRendererImage from './CoverRenderImage';
import type { CoverRenderer_cover$key } from './__generated__/CoverRenderer_cover.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type CoverRendererProps = {
  cover: CoverRenderer_cover$key | null | undefined;
  userId: string;
  fullScreen?: boolean;
  useLargeImage?: boolean;
  style?: StyleProp<ViewStyle>;
};

const CoverRenderer = ({
  cover: coverKey,
  userId,
  style,
  fullScreen,
  useLargeImage,
}: CoverRendererProps) => {
  const cover = useFragment(
    graphql`
      fragment CoverRenderer_cover on UserCardCover {
        picture
        title
      }
    `,
    coverKey ?? null,
  );

  const { width: windowWidth } = useWindowDimensions();
  let { width } = StyleSheet.flatten(style) || {};

  if (typeof width !== 'number') {
    width = fullScreen ? windowWidth : COVER_BASE_WIDTH;
  }
  let borderRadius: number;
  let fontSize: number;
  if (Platform.OS === 'web') {
    borderRadius = '5%' as any;
    fontSize = fullScreen
      ? (`calc((100vw / ${COVER_BASE_WIDTH}) * ${TEXT_BASE_FONT})` as any)
      : TEXT_BASE_FONT;
  } else {
    borderRadius = 0.05 * width;
    fontSize = fullScreen
      ? (windowWidth / COVER_BASE_WIDTH) * TEXT_BASE_FONT
      : TEXT_BASE_FONT;
  }

  return (
    <View
      style={[styles.container, { borderRadius }, style]}
      nativeID={`cover-${userId}`}
    >
      <CoverRendererImage
        picture={cover?.picture}
        style={[{ borderRadius }, styles.coverImage]}
        nativeID={`cover-${userId}-image`}
        testID={`cover-${userId}-picture`}
        useLargeImage={useLargeImage ?? fullScreen}
      />
      <Text
        style={[styles.text, { fontSize }]}
        nativeID={`cover-${userId}-text`}
      >
        {cover?.title}
      </Text>
    </View>
  );
};

export default CoverRenderer;

const styles = StyleSheet.create({
  container: { aspectRatio: 0.625 },
  coverImage: {
    backgroundColor: '#D0D0D0',
  },
  text: {
    position: 'absolute',
    color: 'white',
    bottom: '5%',
    left: '5%',
  },
});

const TEXT_BASE_FONT = 12;
