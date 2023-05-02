import range from 'lodash/range';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
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

  const appearanceStyle = useStyleSheet(computedStyle);

  return (
    <View style={[styles.root, { width: windowWidth }]}>
      {range(5).map(index => (
        <View key={index} style={{ height: rowHeight }}>
          <View style={styles.categoryHeader}>
            <View style={appearanceStyle.backgroundLine} />
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
                    appearanceStyle.coverShadow,
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

const computedStyle = createStyleSheet(appearance => ({
  coverShadow: {
    shadowColor: appearance === 'light' ? colors.black : colors.white,
    shadowOpacity: 0.11,
    shadowOffset: { width: 0, height: 4.69 },
    shadowRadius: 18.75,
  },
  backgroundLine: {
    flex: 1,
    height: 1,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    alignSelf: 'center',
  },
}));

const styles = StyleSheet.create({
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
  templateList: {
    overflow: 'visible',
    flexDirection: 'row',
    columnGap: TEMPLATE_GAP,
    paddingHorizontal: 20,
  },
});
