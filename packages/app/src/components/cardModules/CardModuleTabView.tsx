import { memo, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import ToggleButton from '#ui/ToggleButton';

export type CardModuleViewMode = 'desktop' | 'mobile';

type CardModuleTabViewProps = {
  viewMode: CardModuleViewMode;
  onChange: (cardModule: CardModuleViewMode) => void;
};
const CardModuleTabView = ({ viewMode, onChange }: CardModuleTabViewProps) => {
  // #region Hook
  const intl = useIntl();
  // #endregion

  // #region UI update
  const showDesktop = useCallback(() => {
    onChange('desktop');
  }, [onChange]);

  const showMobile = useCallback(() => {
    onChange('mobile');
  }, [onChange]);
  // #endRegion

  return (
    <View style={styles.toggleContainer}>
      <View style={styles.viewFlex}>
        <ToggleButton
          variant="rounded_menu"
          label={intl.formatMessage({
            defaultMessage: 'Mobile',
            description:
              'CardModuleTabView - Mobile view mode title in web card preview',
          })}
          toggled={viewMode === 'mobile'}
          onPress={showMobile}
        />
      </View>
      <View style={styles.viewFlex}>
        <ToggleButton
          variant="rounded_menu"
          label={intl.formatMessage({
            defaultMessage: 'Desktop',
            description:
              'CardModuleTabView - Desktop view mode title in web card preview',
          })}
          toggled={viewMode === 'desktop'}
          onPress={showDesktop}
        />
      </View>
    </View>
  );
};
export default memo(CardModuleTabView);

export const CARD_MODULE_TAB_VIEW_HEIGHT = 55;

const styles = StyleSheet.create({
  viewFlex: { flex: 1 },
  toggleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    height: CARD_MODULE_TAB_VIEW_HEIGHT,
  },
});
