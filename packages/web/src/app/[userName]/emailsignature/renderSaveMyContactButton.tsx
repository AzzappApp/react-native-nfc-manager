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
    <div>
      <a
        style="
          display: block;
          line-height: 14px;
          font-size: 12px;
          font-family: Helvetica Neue;
          color: ${color};
        "
        href="${saveContactURL}"
      >${saveContactMessage}</a>
    </div>`;
};

export default renderSaveMyContactButton;
