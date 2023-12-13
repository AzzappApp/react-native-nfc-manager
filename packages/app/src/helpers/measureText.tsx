import TextSize from 'rn-text-size';
import type { TSMeasureParams } from 'rn-text-size';

const measureText = async ({
  lineHeight,
  ...params
}: TSMeasureParams & { lineHeight?: number | null | undefined }) => {
  const textMetrics = await TextSize.measure(params);
  //there is an issue with empty line container only \n caracter
  const lines = params.text.split('\n');
  const emptyLines = lines.filter(line => line.trim() === '');
  const numberOfEmptyLines = emptyLines.length;

  return lineHeight != null
    ? lineHeight * Math.max(textMetrics.lineCount, numberOfEmptyLines)
    : textMetrics.height;
};

export default measureText;
