import { memo, useCallback, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Placement, Point } from 'react-native-popover-view/dist/Types';
import {
  useTooltipContext,
  useTooltipDataContext,
} from '#helpers/TooltipContext';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Tooltip from '#ui/Tooltip';
import type { Component, RefObject } from 'react';

type TooltipPosition = {
  x: number;
  y: number;
};

const Tooltips = () => {
  const { width: screenWidth } = useScreenDimensions();
  const { closeTooltips } = useTooltipContext();
  const { tooltips } = useTooltipDataContext();

  const [tooltipCoverPosition, setTooltipCoverPosition] =
    useState<TooltipPosition>();

  const computeCoverPosition = useCallback(() => {
    if (tooltips['cover']?.ref.current && !tooltipCoverPosition) {
      tooltips['cover']?.ref.current.measure((x, y, width, height, dx, dy) => {
        setTooltipCoverPosition({
          x: screenWidth / 2,
          y: dy + height,
        });
      });
    }
  }, [screenWidth, tooltipCoverPosition, tooltips]);

  useEffect(() => {
    computeCoverPosition();
  }, [computeCoverPosition, tooltipCoverPosition, tooltips]);

  const onCloseToolTip = () => {
    closeTooltips(['cover', 'editFooter', 'section']);
  };

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
      />
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
        onPositionChange={computeCoverPosition}
        isVisible={tooltips['cover']?.visible}
        onRequestClose={onCloseToolTip}
      />
      {tooltipCoverPosition && (
        <Tooltip
          offset={-50}
          from={new Point(tooltipCoverPosition.x, tooltipCoverPosition.y)}
          placement={Placement.TOP}
          description={
            <FormattedMessage
              defaultMessage="Use arrows to reorder sections. Swipe right to hide or duplicate, left to delete."
              description="Section tooltip in WebcardEditScreen"
            />
          }
          onPositionChange={computeCoverPosition}
          isVisible={tooltips['section']?.visible}
          onRequestClose={onCloseToolTip}
        />
      )}
    </>
  );
};

export default memo(Tooltips);
