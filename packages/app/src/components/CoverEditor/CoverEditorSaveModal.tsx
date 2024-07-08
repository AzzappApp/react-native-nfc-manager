import { useIntl } from 'react-intl';
import UploadProgressModal from '#ui/UploadProgressModal';
import type { SavingStatus } from './useSaveCover';
import type { Observable } from 'relay-runtime';

const CoverEditorSaveModal = ({
  status,
  progressIndicator,
}: {
  status: SavingStatus | null;
  progressIndicator: Observable<number> | null;
}) => {
  const intl = useIntl();
  return (
    <UploadProgressModal
      progressIndicator={progressIndicator}
      text={
        status === 'exporting'
          ? intl.formatMessage({
              defaultMessage: 'Exporting',
              description:
                'Message displaying in upload modal when exporting a cover',
            })
          : intl.formatMessage({
              defaultMessage: 'Uploading',
              description:
                'Message displaying in upload modal when uploading a cover',
            })
      }
    />
  );
};

export default CoverEditorSaveModal;
