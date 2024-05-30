import LottieView from 'lottie-react-native';
import { memo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { shadow } from '#theme';
import { DoneHeaderButton } from '#components/commonsButtons';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import Text from '#ui/Text';
import ToolBoxSection from '#ui/ToolBoxSection';
import { useCoverEditorContext } from '../CoverEditorContext';
import { useCoverTransitionOrdonned } from '../drawing/coverTransitions';
import CoverEditorSelectionList, {
  BORDER_RADIUS_RATIO,
  BOX_WIDTH,
} from './CoverEditorSelectionList';
import type { CoverEditorTransition } from '../coverEditorTypes';
import type { TransitionListItem } from '../drawing/coverTransitions';

const CoverEditorTransitionTool = () => {
  const [show, toggleBottomSheet] = useToggle(false);
  const { coverEditorState } = useCoverEditorContext();

  const { dispatch } = useCoverEditorContext();

  const onSelect = useCallback(
    (transition: string) => {
      dispatch({
        type: 'UPDATE_MEDIA_TRANSITION',
        payload: transition as CoverEditorTransition,
      });
    },
    [dispatch],
  );

  const intl = useIntl();

  const transitions = useCoverTransitionOrdonned().map((transition, index) => {
    return { ...transition, index };
  });

  return (
    <>
      <ToolBoxSection
        icon="transition"
        label={intl.formatMessage({
          defaultMessage: 'Transition',
          description: 'Cover Edition Transition Tool Button- Animations',
        })}
        onPress={toggleBottomSheet}
      />
      {coverEditorState.medias && coverEditorState.medias.length > 0 && (
        <BottomSheetModal
          onRequestClose={toggleBottomSheet}
          visible={show}
          height={276}
          headerTitle={
            <Text variant="large">
              <FormattedMessage
                defaultMessage="Transition"
                description="CoverEditor Transition Tool - Title"
              />
            </Text>
          }
          headerRightButton={<DoneHeaderButton onPress={toggleBottomSheet} />}
          contentContainerStyle={{ paddingHorizontal: 0 }}
          headerStyle={{ paddingHorizontal: 20 }}
        >
          <CoverEditorSelectionList
            data={transitions}
            renderItem={renderItem}
            accessibilityRole="list"
            onSelect={onSelect}
            selectedItemId={coverEditorState.coverTransition ?? 'none'}
          />
        </BottomSheetModal>
      )}
    </>
  );
};

const renderItem = (item: TransitionListItem) => {
  return <TransitionOverlay transition={item} />;
};

export default memo(CoverEditorTransitionTool);

type TransitionOverlayProps = {
  transition: TransitionListItem;
};

const TransitionOverlay = ({ transition }: TransitionOverlayProps) => {
  const styles = useStyleSheet(styleSheet);

  return (
    <LottieView
      style={styles.itemPreview}
      source={transition.lottie}
      autoPlay
      loop
    />
  );
};

const styleSheet = createStyleSheet(appearance => ({
  itemPreview: {
    width: BOX_WIDTH,
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS_RATIO,
    overflow: 'hidden',
    ...shadow(appearance, 'bottom'),
  },
}));
