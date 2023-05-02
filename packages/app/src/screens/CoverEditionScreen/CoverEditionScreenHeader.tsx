import { useIntl } from 'react-intl';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import IconButton from '#ui/IconButton';

export type CoverEditionScreenHeaderProps = {
  isCreation: boolean;
  cropEditionMode: boolean;
  canSave: boolean;
  onCancel?: () => void;
  onSave?: () => void;
  onNextOrientation?: () => void;
};

const CoverEditionScreenHeader = ({
  isCreation,
  cropEditionMode,
  canSave,
  onCancel,
  onSave,
  onNextOrientation,
}: CoverEditionScreenHeaderProps) => {
  const intl = useIntl();
  return (
    <Header
      middleElement={
        isCreation
          ? intl.formatMessage({
              defaultMessage: 'Create your cover',
              description: 'Cover creation screen title',
            })
          : intl.formatMessage({
              defaultMessage: 'Update your cover',
              description: 'Cover edition screen title',
            })
      }
      leftElement={
        !cropEditionMode ? (
          <HeaderButton
            variant="secondary"
            onPress={onCancel}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Cancel button label in cover edition screen',
            })}
          />
        ) : null
      }
      rightElement={
        cropEditionMode ? (
          <IconButton
            icon="rotate"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Rotate',
              description:
                'Accessibility label of the rotate button in the cover edition screen',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage:
                'Rotate the image by 90° clockwise. This will change the crop area.',
              description:
                'Accessibility hint of the rotate button in in the cover edition screen',
            })}
            onPress={onNextOrientation}
          />
        ) : (
          <HeaderButton
            disabled={!canSave}
            onPress={onSave}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'Save button label in cover edition screen',
            })}
          />
        )
      }
    />
  );
};

export default CoverEditionScreenHeader;
