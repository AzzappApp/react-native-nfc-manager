import { Skia } from '@shopify/react-native-skia';
import { swapColor } from '@azzapp/shared/cardHelpers';
import coverMediasDrawer from './coverMediasDrawer';
import coverOverlayDrawer from './coverOverlayDrawer';
import coverTextDrawer from './coverTextDrawer';
import type { CoverDrawerOptions } from './types';

const coverDrawer = (options: CoverDrawerOptions) => {
  'worklet';
  const {
    coverEditorState: { backgroundColor },
    cardColors,
  } = options;
  if (backgroundColor) {
    options.canvas.drawColor(
      Skia.Color(swapColor(backgroundColor, cardColors)),
    );
  }
  coverMediasDrawer(options);
  coverOverlayDrawer(options);
  const {
    coverEditorState: { textLayers },
  } = options;
  for (let i = 0; i < textLayers.length; i++) {
    coverTextDrawer({ ...options, index: i });
  }
};

export default coverDrawer;
