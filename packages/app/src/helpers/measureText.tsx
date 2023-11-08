import TextSize from 'rn-text-size';
import type { TSMeasureParams } from 'rn-text-size';

const measureText = async ({
  lineHeight,
  ...params
}: TSMeasureParams & { lineHeight?: number | null | undefined }) => {
  const textMetrics = await TextSize.measure(params);

  return lineHeight != null
    ? lineHeight * textMetrics.lineCount
    : textMetrics.height;
};

export default measureText;
