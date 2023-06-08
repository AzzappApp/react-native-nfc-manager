import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import FloatingIconButton from './FloatingIconButton';
import type { FloatingIconButtonProps } from './FloatingIconButton';
import type { Icons } from './Icon';

type TxtAlignment = 'center' | 'justify' | 'left' | 'right';

type AligmnetButtonProps = Omit<FloatingIconButtonProps, 'icon' | 'onPress'> & {
  /**
   * The current text alignment
   * The alignment is a string to be compatible with future addition of new alignment
   */
  alignment: string;
  /**
   * A callback called when the user change the text alignment
   */
  onAlignmentChange: (alignment: TxtAlignment) => void;
};

/**
 * A switch button to change the text alignment
 */
const AlignmentButton = ({
  alignment: alignmentProp,
  onAlignmentChange,
  ...props
}: AligmnetButtonProps) => {
  const alignment = getAlignment(alignmentProp);
  const onNextAlignment = useCallback(() => {
    switch (alignment) {
      case 'left':
        onAlignmentChange('center');
        break;
      case 'center':
        onAlignmentChange('right');
        break;
      case 'right':
        onAlignmentChange('justify');
        break;
      case 'justify':
        onAlignmentChange('left');
        break;
    }
  }, [alignment, onAlignmentChange]);

  const intl = useIntl();

  const alignmentsLabel = useMemo(
    () => ({
      center: intl.formatMessage({
        defaultMessage: 'Center',
        description: 'Label of the center alignment button',
      }),
      left: intl.formatMessage({
        defaultMessage: 'Left',
        description: 'Label of the left alignment button',
      }),
      right: intl.formatMessage({
        defaultMessage: 'Right',
        description: 'Label of the right alignment button',
      }),
      justify: intl.formatMessage({
        defaultMessage: 'Justify',
        description: 'Label of the justify alignment button',
      }),
    }),
    [intl],
  );

  return (
    <FloatingIconButton
      onPress={onNextAlignment}
      accessibilityRole="button"
      accessibilityLabel={intl.formatMessage({
        defaultMessage: 'Text alignment',
        description: 'Label of the text alignment button',
      })}
      accessibilityHint={intl.formatMessage({
        defaultMessage: 'Tap to change the text alignment of the text',
        description: 'Hint of the text alignment button',
      })}
      accessibilityValue={{
        text: alignmentsLabel[alignment] ?? '',
      }}
      icon={alignmentIcons[alignment]}
      {...props}
    />
  );
};

export default AlignmentButton;

const alignmentIcons: Record<TxtAlignment, Icons> = {
  left: 'txt_align_left',
  center: 'txt_align_center',
  right: 'txt_align_right',
  justify: 'txt_align_justif',
};

const getAlignment = (str: string): TxtAlignment => {
  switch (str) {
    case 'left':
    case 'center':
    case 'right':
    case 'justify':
      return str;
    default:
      return 'left';
  }
};
