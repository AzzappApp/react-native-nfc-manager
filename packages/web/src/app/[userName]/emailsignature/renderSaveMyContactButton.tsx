import { getTextColor } from '@azzapp/shared/colorsHelpers';

const renderSaveMyContactButton = ({
  url,
  saveContactMessage,
  primaryColor,
}: {
  url: string;
  saveContactMessage: string;
  primaryColor: string;
}) =>
  `
  <div>
  <!--[if mso]>
    <v:roundrect 
      xmlns:v="urn:schemas-microsoft-com:vml" 
      xmlns:w="urn:schemas-microsoft-com:office:word" 
      href="${url}" 
      style="
        height:34px;
        v-text-anchor:middle;
        width:125px;" 
      arcsize="48px" 
      stroke="f" 
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
        border-radius: 48px;
        font-size: 12px;
        text-decoration: none;
        text-decoration: unset;
        font-family: Helvetica Neue;
        text-align: center;
        font-weight: 700;
        color: ${getTextColor(primaryColor)};
      "
      href="${url}"
    >${saveContactMessage}</a>
  <!-- <![endif]-->
  </div>`;

export default renderSaveMyContactButton;
