import { useIntl } from 'react-intl';
import { useEditionParametersDisplayInfos } from '#components/gpu';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import IconButton from '#ui/IconButton';
import type { EditionParameters } from '#components/gpu';

export type CoverEditionScreenHeaderProps = {
  isCreation: boolean;
  cropEditionMode: boolean;
  canSave: boolean;
  onCancel?: () => void;
  onSave?: () => void;
  onNextOrientation?: () => void;
  editedParameter?: keyof EditionParameters | null;
};

const CoverEditionScreenHeader = ({
  isCreation,
  cropEditionMode,
  canSave,
  onCancel,
  onSave,
  onNextOrientation,
  editedParameter,
}: CoverEditionScreenHeaderProps) => {
  const intl = useIntl();
  const paramsInfos = useEditionParametersDisplayInfos();

  return (
    <Header
      middleElement={
        isCreation
          ? intl.formatMessage({
              defaultMessage: 'Create your cover',
              description: 'Cover creation screen title',
            })
          : editedParameter
          ? paramsInfos[editedParameter]?.label ?? ''
          : intl.formatMessage({
              defaultMessage: 'Update your cover',
              description: 'Cover edition screen title',
            })
      }
      leftElement={
        !editedParameter && !cropEditionMode ? (
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
        ) : !editedParameter ? (
          <HeaderButton
            disabled={!canSave}
            onPress={onSave}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'Save button label in cover edition screen',
            })}
          />
        ) : null
      }
    />
  );
};

export default CoverEditionScreenHeader;
