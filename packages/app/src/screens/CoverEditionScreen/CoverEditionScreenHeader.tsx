import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import Button from '#ui/Button';
import Header, { HEADER_HEIGHT } from '#ui/Header';
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
          <Button
            variant="secondary"
            onPress={onCancel}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Cancel button label in cover edition screen',
            })}
            style={styles.buttons}
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
          <Button
            disabled={!canSave}
            onPress={onSave}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'Save button label in cover edition screen',
            })}
            style={styles.buttons}
          />
        )
      }
    />
  );
};

export default CoverEditionScreenHeader;

const styles = StyleSheet.create({
  buttons: {
    width: 74,
    height: HEADER_HEIGHT,
    paddingHorizontal: 0,
  },
});
