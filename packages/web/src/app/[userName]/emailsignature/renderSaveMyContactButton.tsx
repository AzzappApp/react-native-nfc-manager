import { isColorTooLight } from '@azzapp/shared/colorsHelpers';

const renderSaveMyContactButton = ({
  saveContactURL,
  saveContactMessage,
  primaryColor,
}: {
  saveContactURL: string;
  saveContactMessage: string;
  primaryColor: string;
}) => {
  let color = primaryColor;
  if (isColorTooLight(color)) {
    color = '#000';
  }
  return `
    <a
      style="
        display: block;
        line-height: 14px;
        font-size: 12px;
        font-family: Helvetica Neue;
        white-space: nowrap;
        color: ${color};
      "
      href="${saveContactURL}"
    >${saveContactMessage}</a>
  `;
};

export default renderSaveMyContactButton;
