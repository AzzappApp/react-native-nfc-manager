import { useIntl } from 'react-intl';
import { useEditionParametersDisplayInfos } from '#components/gpu';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import type { EditionParameters } from '#components/gpu';

export type CECHeaderProps = {
  isCreation: boolean;
  canSave: boolean;
  onCancel?: () => void;
  onSave?: () => void;
  editedParameter?: keyof EditionParameters | null;
};

const CECHeader = ({
  isCreation,
  canSave,
  onCancel,
  onSave,
  editedParameter,
}: CECHeaderProps) => {
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
        !editedParameter ? (
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
        !editedParameter ? (
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

export default CECHeader;
