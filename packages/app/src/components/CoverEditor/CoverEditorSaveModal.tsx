import { useKeepAwake } from 'expo-keep-awake';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import UploadProgressModal from '#ui/UploadProgressModal';
import type { Observable } from 'relay-runtime';

const CoverEditorSaveModal = ({
  exportProgressIndicator,
}: {
  exportProgressIndicator: Observable<number> | null;
}) => {
  useKeepAwake();

  const intl = useIntl();
  const progressIndicators = useMemo(() => {
    const result = [];
    if (exportProgressIndicator) {
      result.push(exportProgressIndicator);
    }

    return result;
  }, [exportProgressIndicator]);

  const texts = useMemo(() => {
    const result = [];
    if (exportProgressIndicator) {
      result.push(
        intl.formatMessage({
          defaultMessage: 'Export',
          description: 'Export phase title in cover editor save modal',
        }),
      );
    }

    return result;
  }, [exportProgressIndicator, intl]);
  return (
    <UploadProgressModal
      progressIndicators={progressIndicators}
      texts={texts}
    />
  );
};

export default CoverEditorSaveModal;
