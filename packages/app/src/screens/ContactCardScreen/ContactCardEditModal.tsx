import { useIntl } from 'react-intl';
import { StyleSheet, useWindowDimensions } from 'react-native';
import useViewportSize, { insetTop } from '#hooks/useViewportSize';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';

const ContactCardEditModal = ({
  visible,
  toggleBottomSheet,
}: {
  visible: boolean;
  toggleBottomSheet: () => void;
}) => {
  const intl = useIntl();

  const vp = useViewportSize();

  const { height } = useWindowDimensions();

  return (
    <BottomSheetModal
      visible={visible}
      height={vp`${height - 30} - ${insetTop}`}
      onRequestClose={toggleBottomSheet}
      headerTitle={intl.formatMessage({
        defaultMessage: 'Edit Contact Card',
        description: 'Edit Contact Card Modal title',
      })}
      showGestureIndicator
      headerLeftButton={
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'Edit contact card modal cancel button title',
          })}
          onPress={toggleBottomSheet}
          variant="cancel"
          style={styles.headerButton}
        />
      }
      headerRightButton={
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Save',
            description: 'Edit contact card modal save button label',
          })}
          onPress={toggleBottomSheet}
          variant="primary"
          style={styles.headerButton}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
  container: { rowGap: 20 },
  field: { paddingTop: 10, rowGap: 5 },
  input: { rowGap: 10 },
});

export default ContactCardEditModal;
