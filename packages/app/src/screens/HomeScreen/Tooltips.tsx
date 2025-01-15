import { memo, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Platform } from 'react-native';
import { PopoverMode } from 'react-native-popover-view';
import { Placement, Point } from 'react-native-popover-view/dist/Types';
import { ENABLE_MULTI_USER } from '#Config';
import { useTooltipContext } from '#helpers/TooltipContext';
import Tooltip from '#ui/Tooltip';

type TooltipPosition = {
  x: number;
  y: number;
};

const Tooltips = () => {
  const { tooltips, closeTooltips, openTooltips } = useTooltipContext();
  const [tooltipCarouselPosition, setTooltipCarouselPosition] =
    useState<TooltipPosition>();
  const [tooltipBottomPosition, setTooltipBottomPosition] =
    useState<TooltipPosition>();

  useEffect(() => {
    if (tooltips['profileCarousel']?.ref.current && !tooltipCarouselPosition) {
      tooltips['profileCarousel']?.ref.current.measure(
        (x, y, width, height, dx, dy) => {
          setTooltipCarouselPosition({
            x: (dx + width) / 2,
            y: dy + height / 2,
          });
        },
      );
    }
    if (tooltips['profileBottomPanel']?.ref.current && !tooltipBottomPosition) {
      tooltips['profileBottomPanel']?.ref.current.measure(
        (x, y, width, height, dx, dy) => {
          setTooltipBottomPosition({
            x: (dx + width) / 2,
            y: dy + height / 2 - 25,
          });
        },
      );
    }
  }, [tooltipBottomPosition, tooltipCarouselPosition, tooltips]);

  const onCloseToolTip = () => {
    closeTooltips(['profileBottomPanel', 'profileCarousel', 'profileLink']);
  };

  const onCloseToolTipEdit = () => {
    closeTooltips(['profileEdit']);
    if (ENABLE_MULTI_USER) {
      openTooltips(['profileMulti']);
    }
  };

  const onCloseToolTipMulti = () => {
    closeTooltips(['profileMulti']);
  };

  return (
    <>
      <Tooltip
        mode={
          Platform.OS === 'ios' ? PopoverMode.RN_MODAL : PopoverMode.JS_MODAL
        }
        offset={-10}
        from={tooltips['profileLink']?.ref}
        placement={Placement.TOP}
        header={
          <FormattedMessage
            defaultMessage="Link to your WebCard"
            description="WebCard tooltip link"
          />
        }
        description={
          <FormattedMessage
            defaultMessage="Tap to copy"
            description="WebCard tooltip link description"
          />
        }
        isVisible={tooltips['profileLink']?.visible}
        onRequestClose={onCloseToolTip}
        onPress={() => {
          tooltips['profileLink']?.onPress?.();
          onCloseToolTip();
        }}
      />
      {tooltipCarouselPosition && (
        <Tooltip
          from={new Point(tooltipCarouselPosition.x, tooltipCarouselPosition.y)}
          toolipWidth={157}
          placement={Placement.LEFT}
          header={
            <FormattedMessage
              defaultMessage="Your WebCard is a digital profile for you or your company, adding depth and design
to your ContactCard. When shared on its own, it shows only the profile without contact details."
              description="WebCard tooltip caroussel"
            />
          }
          isVisible={tooltips['profileCarousel']?.visible}
          onRequestClose={onCloseToolTip}
        />
      )}
      {tooltipBottomPosition && (
        <Tooltip
          toolipWidth={352}
          from={new Point(tooltipBottomPosition.x, tooltipBottomPosition.y)}
          placement={Placement.BOTTOM}
          header={
            <FormattedMessage
              defaultMessage="Your ContactCard is a digital business card with your contact details. Sharing it provides recipients with both your WebCard and ContactCard for a complete presentation."
              description="WebCard tooltip bottom"
            />
          }
          isVisible={tooltips['profileBottomPanel']?.visible}
          onRequestClose={onCloseToolTip}
        />
      )}
      <Tooltip
        from={tooltips['profileEdit']?.ref}
        placement={Placement.TOP}
        header={
          <FormattedMessage
            defaultMessage="Customize your WebCard"
            description="Tooltip / Edit tooltip header"
          />
        }
        description={
          <FormattedMessage
            defaultMessage="Your WebCard is an online digital profile that enhances your ContactCard by providing a richer content."
            description="Tooltip / Edit tooltip description"
          />
        }
        isVisible={tooltips['profileEdit']?.visible}
        onRequestClose={onCloseToolTipEdit}
      />
      <Tooltip
        from={tooltips['profileMulti']?.ref}
        placement={Placement.TOP}
        header={
          <FormattedMessage
            defaultMessage="Multi-user"
            description="Tooltip / Multi-user tooltip header"
          />
        }
        description={
          <FormattedMessage
            defaultMessage="Invite team members to join your WebCard and offer a ContactCard to everyone."
            description="Tooltip / Multi-user tooltip description"
          />
        }
        isVisible={tooltips['profileMulti']?.visible}
        onRequestClose={onCloseToolTipMulti}
      />
    </>
  );
};

export default memo(Tooltips);
