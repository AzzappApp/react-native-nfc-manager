import { memo, useCallback, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Platform } from 'react-native';
import { PopoverMode } from 'react-native-popover-view';
import { Placement, Point } from 'react-native-popover-view/dist/Types';
import { ENABLE_MULTI_USER } from '#Config';
import {
  useTooltipContext,
  useTooltipDataContext,
} from '#helpers/TooltipContext';
import Text from '#ui/Text';
import Tooltip from '#ui/Tooltip';

type TooltipPosition = {
  x: number;
  y: number;
};

const Tooltips = () => {
  const { closeTooltips, openTooltips } = useTooltipContext();
  const { tooltips } = useTooltipDataContext();
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

  const onCloseToolTip = useCallback(() => {
    closeTooltips(['profileBottomPanel', 'profileCarousel', 'profileLink']);
  }, [closeTooltips]);

  const onCloseToolTipEdit = useCallback(() => {
    closeTooltips(['profileEdit']);
    if (ENABLE_MULTI_USER && tooltips['profileMulti']?.ref.current) {
      openTooltips(['profileMulti']);
    }
  }, [closeTooltips, openTooltips, tooltips]);

  const onCloseToolTipMulti = useCallback(() => {
    closeTooltips(['profileMulti']);
  }, [closeTooltips]);

  return (
    <>
      <Tooltip
        mode={
          Platform.OS === 'ios' ? PopoverMode.RN_MODAL : PopoverMode.JS_MODAL
        }
        offset={Platform.OS === 'ios' ? -10 : 30}
        from={tooltips['profileLink']?.ref}
        placement={Placement.TOP}
        header={
          <FormattedMessage
            defaultMessage="Link to your WebCard{azzappA}"
            description="WebCard tooltip link"
            values={{
              azzappA: <Text variant="azzapp">a</Text>,
            }}
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
          description={
            <FormattedMessage
              defaultMessage="Your WebCard{azzappA} is a digital profile that enhances your ContactCard with richer content.
Shared alone, it displays the profile without contact details."
              description="WebCard tooltip caroussel"
              values={{
                azzappA: <Text variant="azzapp">a</Text>,
              }}
            />
          }
          isVisible={tooltips['profileCarousel']?.visible}
          onRequestClose={onCloseToolTip}
          onPress={onCloseToolTip}
        />
      )}
      {tooltipBottomPosition && (
        <Tooltip
          toolipWidth={352}
          from={new Point(tooltipBottomPosition.x, tooltipBottomPosition.y)}
          placement={Placement.BOTTOM}
          description={
            <FormattedMessage
              defaultMessage="Your ContactCard{azzappA} is a digital business card.
Get your QR code scanned to share both contact details and digital profile."
              description="WebCard tooltip bottom"
              values={{
                azzappA: <Text variant="azzapp">a</Text>,
              }}
            />
          }
          isVisible={tooltips['profileBottomPanel']?.visible}
          onRequestClose={onCloseToolTip}
          onPress={onCloseToolTip}
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
        onPress={onCloseToolTipEdit}
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
        onPress={onCloseToolTipMulti}
      />
    </>
  );
};

export default memo(Tooltips);
