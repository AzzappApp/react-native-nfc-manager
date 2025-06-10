import { memo, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Placement, Point } from 'react-native-popover-view/dist/Types';
import {
  useTooltipContext,
  useTooltipDataContext,
} from '#helpers/TooltipContext';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Tooltip from '#ui/Tooltip';
import { useWebCardEditScale } from './webCardEditScreenHelpers';
import type { ChildPositionAwareScrollViewHandle } from '#ui/ChildPositionAwareScrollView';
import type { Component, RefObject } from 'react';

type TooltipPosition = {
  x: number;
  y: number;
};

const ESTIMATED_POPUP_HEIGHT = 100; // Estimated height for the tooltip popup
const BOTTOM_BAR_HEIGHT = 100; // Estimated height of discarded zone at the bottom of the screen

const Tooltips = ({
  scrollViewRef,
}: {
  scrollViewRef: React.RefObject<ChildPositionAwareScrollViewHandle | null>;
}) => {
  const { width: screenWidth, height: screenHeight } = useScreenDimensions();
  const { closeTooltips } = useTooltipContext();
  const { tooltips } = useTooltipDataContext();

  const [tooltipCoverPosition, setTooltipCoverPosition] =
    useState<TooltipPosition>();

  const [tooltipSectionPosition, setTooltipSectionPosition] =
    useState<TooltipPosition>();

  useEffect(() => {
    const tooltip = tooltips['cover'];
    if (tooltip?.visible && tooltip.ref.current) {
      tooltip.ref.current.measure((x, y, width, height, dx, dy) => {
        setTooltipCoverPosition({
          x: screenWidth / 2,
          y: dy + height,
        });
      });
    }
  }, [screenWidth, tooltips]);
  const editScale = useWebCardEditScale();

  useEffect(() => {
    const computeSectionPosition = async () => {
      const contentInfos = await scrollViewRef.current?.getContentInfos();
      if (!contentInfos) {
        return;
      }
      const scaledScrollY = editScale * contentInfos.scrollY;
      const selectedModuleIndex = contentInfos?.childInfos.findIndex(
        (child, index) => {
          const scaledLayoutY = editScale * child.layout.y;
          return (
            index !== 0 &&
            scaledLayoutY -
              scaledScrollY +
              child.layout.height / 2 -
              ESTIMATED_POPUP_HEIGHT >
              ESTIMATED_POPUP_HEIGHT
          );
        },
      );
      if (selectedModuleIndex === -1) return;
      const selectedModule = contentInfos?.childInfos.at(selectedModuleIndex);
      if (!selectedModule) return;

      let targetY = editScale * selectedModule.layout.y - scaledScrollY;
      targetY =
        targetY +
        selectedModule.layout.height / 2 -
        ESTIMATED_POPUP_HEIGHT +
        contentInfos.scrollViewLayout.y;
      // here we ensure the displayed popup is not out of screen
      if (
        targetY >=
        screenHeight - ESTIMATED_POPUP_HEIGHT - BOTTOM_BAR_HEIGHT
      ) {
        targetY = screenHeight - ESTIMATED_POPUP_HEIGHT - BOTTOM_BAR_HEIGHT;
      } else if (targetY <= BOTTOM_BAR_HEIGHT) {
        targetY = BOTTOM_BAR_HEIGHT;
      }
      setTooltipSectionPosition({
        x: screenWidth / 2,
        y: targetY,
      });
    };
    const tooltip = tooltips['section'];
    if (tooltip?.visible) {
      computeSectionPosition();
    }
  }, [editScale, screenHeight, screenWidth, scrollViewRef, tooltips]);

  const onCloseToolTip = () => {
    closeTooltips(['cover', 'editFooter', 'section']);
    setTooltipCoverPosition(undefined);
    setTooltipSectionPosition(undefined);
  };

  if (
    !tooltips['section']?.visible ||
    !tooltips['editFooter']?.visible ||
    !tooltips['cover']?.visible
  ) {
    // We want to ensure the 3
    return null;
  }
  return (
    <>
      <Tooltip
        offset={-20}
        from={tooltips['editFooter']?.ref as RefObject<Component>}
        placement={Placement.TOP}
        description={
          <FormattedMessage
            defaultMessage="Click « + » to add sections"
            description="Add section tooltip in WebcardEditScreen"
          />
        }
        isVisible={tooltips['editFooter']?.visible}
        onRequestClose={onCloseToolTip}
        onPress={onCloseToolTip}
      />
      {tooltipCoverPosition && tooltipCoverPosition.y > 400 && (
        <Tooltip
          offset={-50}
          from={tooltips['cover']?.ref as RefObject<Component>}
          placement={Placement.TOP}
          description={
            <FormattedMessage
              defaultMessage="Tap the cover or any section to edit."
              description="Cover tooltip in WebcardEditScreen"
            />
          }
          isVisible={tooltips['cover']?.visible}
          onRequestClose={onCloseToolTip}
          onPress={onCloseToolTip}
        />
      )}
      {tooltipSectionPosition && (
        <Tooltip
          from={new Point(tooltipSectionPosition.x, tooltipSectionPosition.y)}
          placement={Placement.TOP}
          description={
            <FormattedMessage
              defaultMessage="Use arrows to reorder sections. Swipe right to hide or duplicate, left to delete."
              description="Section tooltip in WebcardEditScreen"
            />
          }
          isVisible={tooltips['section']?.visible}
          onRequestClose={onCloseToolTip}
          onPress={onCloseToolTip}
        />
      )}
    </>
  );
};

export default memo(Tooltips);
