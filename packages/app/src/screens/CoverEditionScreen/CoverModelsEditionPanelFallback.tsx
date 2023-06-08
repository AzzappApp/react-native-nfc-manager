import range from 'lodash/range';
import { View, useWindowDimensions } from 'react-native';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import Skeleton from '#components/Skeleton';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { TAB_BAR_HEIGHT } from '#ui/TabsBar';
import {
  COVER_TEMPLATE_MINIATURE_RATIO,
  TEMPLATE_BORDER_WIDTH,
  TEMPLATE_GAP,
} from './coverEditionConstants';

const CoverModelsEditionPanelFallback = () => {
  const { width: windowWidth } = useWindowDimensions();
  const coverWidth = windowWidth * COVER_TEMPLATE_MINIATURE_RATIO;
  const coverHeight = coverWidth / COVER_RATIO;
  const templateItemWidth = coverWidth + 2 * TEMPLATE_BORDER_WIDTH - 0.5;
  const templateItemHeight = coverHeight + 2 * TEMPLATE_BORDER_WIDTH;
  const rowHeight = TAB_BAR_HEIGHT + coverHeight + 2 * TEMPLATE_BORDER_WIDTH;

  const styles = useStyleSheet(styleSheet);

  return (
    <View style={[styles.root, { width: windowWidth }]}>
      {range(5).map(index => (
        <View key={index} style={{ height: rowHeight }}>
          <View style={styles.categoryHeader}>
            <View style={styles.backgroundLine} />
          </View>
          <View style={styles.templateList}>
            {range(5).map(index => (
              <View
                key={index}
                style={[
                  styles.templateContainer,
                  {
                    width: templateItemWidth,
                    height: templateItemHeight,
                    borderRadius:
                      COVER_CARD_RADIUS * coverWidth + TEMPLATE_BORDER_WIDTH,
                  },
                ]}
              >
                <Skeleton
                  style={[
                    {
                      width: coverWidth,
                      height: coverHeight,
                      borderRadius: COVER_CARD_RADIUS * coverWidth,
                    },
                    styles.coverShadow,
                  ]}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

export default CoverModelsEditionPanelFallback;

const styleSheet = createStyleSheet(appearance => ({
  root: {
    paddingTop: 10,
    flex: 1,
  },
  templateContainer: {
    borderWidth: TEMPLATE_BORDER_WIDTH,
    borderColor: 'transparent',
  },
  categoryHeader: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
  },
  backgroundLine: {
    flex: 1,
    height: 1,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    alignSelf: 'center',
  },
  templateList: {
    overflow: 'visible',
    flexDirection: 'row',
    columnGap: TEMPLATE_GAP,
    paddingHorizontal: 20,
  },
  coverShadow: shadow(appearance, 'center'),
}));
