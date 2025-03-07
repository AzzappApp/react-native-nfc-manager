import { getTextColor } from '@azzapp/shared/colorsHelpers';

const renderSaveMyContactButton = ({
  saveContactURL,
  saveContactMessage,
  primaryColor,
  border,
}: {
  saveContactURL: string;
  saveContactMessage: string;
  primaryColor: string;
  border?: boolean;
}) =>
  `
  <div>
  <!--[if mso]>
    <v:roundrect 
      xmlns:v="urn:schemas-microsoft-com:vml" 
      xmlns:w="urn:schemas-microsoft-com:office:word" 
      href="${saveContactURL}" 
      style="
        height:34px;
        v-text-anchor:middle;
        width:125px;" 
      arcsize="48px" 
      stroke="f" 
      ${border ? 'strokecolor="#000" strokeweight="1px"' : ''}
      fillcolor="${primaryColor}">
        <w:anchorlock/>
        <center style="
          color:${getTextColor(primaryColor)};
          font-family: Helvetica neue;
          font-size: 12px;
          text-align: center;
          font-weight: bold;">
            ${saveContactMessage}
        </center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]> <!-->
    <a
      style="
        display: block;
        background-color: ${primaryColor};
        padding: 10px 0;
        line-height: 14px;
        min-width: 125px;
        max-width: 140px;
        border-radius: 48px;
        font-size: 12px;
        text-decoration: none;
        text-decoration: unset;
        font-family: Helvetica Neue;
        text-align: center;
        font-weight: 700;
        color: ${getTextColor(primaryColor)};
        ${border ? 'border: 1px solid #000;' : ''}
      "
      href="${saveContactURL}"
    >${saveContactMessage}</a>
  <!-- <![endif]-->
  </div>`;

export default renderSaveMyContactButton;
