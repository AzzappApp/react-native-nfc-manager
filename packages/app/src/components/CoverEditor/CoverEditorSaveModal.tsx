import { useKeepAwake } from 'expo-keep-awake';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import UploadProgressModal from '#ui/UploadProgressModal';
import type { Observable } from 'relay-runtime';

const CoverEditorSaveModal = ({
  exportProgressIndicator,
  uploadProgressIndicator,
}: {
  exportProgressIndicator: Observable<number> | null;
  uploadProgressIndicator: Observable<number> | null;
}) => {
  useKeepAwake();

  const intl = useIntl();
  const progressIndicators = useMemo(
    () => [exportProgressIndicator, uploadProgressIndicator],
    [exportProgressIndicator, uploadProgressIndicator],
  );
  const texts = useMemo(
    () => [
      intl.formatMessage({
        defaultMessage: 'Export',
        description: 'Export phase title in cover editor save modal',
      }),
      intl.formatMessage({
        defaultMessage: 'Upload',
        description: 'Upload phase title in cover editor save modal',
      }),
    ],
    [intl],
  );
  return (
    <UploadProgressModal
      progressIndicators={progressIndicators}
      texts={texts}
    />
  );
};

export default CoverEditorSaveModal;
