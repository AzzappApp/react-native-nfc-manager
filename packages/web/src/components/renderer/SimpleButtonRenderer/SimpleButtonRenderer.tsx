import cx from 'classnames';
import { parsePhoneNumber } from 'libphonenumber-js';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  SIMPLE_BUTTON_STYLE_VALUES,
  getButtonDefaultValues,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import { fontsMap } from '#helpers/fonts';
import CardModuleBackground from '../../CardModuleBackground';
import styles from './SimpleButtonRenderer.css';
import type { ModuleRendererProps } from '../ModuleRenderer';
import type { CardModuleSimpleButton } from '@azzapp/data';
import type { CountryCode } from 'libphonenumber-js';

export type SimpleButtonRendererProps =
  ModuleRendererProps<CardModuleSimpleButton> &
    Omit<React.HTMLProps<HTMLDivElement>, 'children'>;
/**
 * Render a SimpleButton module
 */
const SimpleButtonRenderer = ({
  module,
  colorPalette,
  cardStyle,
  style,
  coverBackgroundColor,
  ...props
}: SimpleButtonRendererProps) => {
  const {
    buttonLabel,
    actionType,
    actionLink,
    fontFamily,
    fontColor,
    fontSize,
    buttonColor,
    borderColor,
    borderWidth,
    borderRadius,
    marginTop,
    marginBottom,
    width,
    height,
    backgroundId,
    backgroundStyle,
  } = getModuleDataValues({
    data: module.data,
    cardStyle,
    styleValuesMap: SIMPLE_BUTTON_STYLE_VALUES,
    defaultValues: getButtonDefaultValues(coverBackgroundColor),
  });

  let href: string | undefined;
  switch (actionType as string) {
    case 'link':
      href = actionLink;
      break;
    case 'email':
      href = `mailto:${actionLink}`;
      break;
    default:
      href = `tel:${parsePhoneNumber(
        actionLink,
        actionType as CountryCode,
      ).formatInternational()}`;
  }

  return (
    <CardModuleBackground
      {...props}
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
      colorPalette={colorPalette}
      style={{
        ...style,
        height: height + marginTop + marginBottom,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <a
        className={styles.link}
        style={{
          height,
          width,
          marginBottom,
          marginTop,
          backgroundColor: swapColor(buttonColor, colorPalette),
          borderRadius,
          borderWidth,
          borderColor: swapColor(borderColor, colorPalette),
        }}
        href={href}
      >
        <span
          style={{
            color: swapColor(fontColor, colorPalette),
            fontSize,
          }}
          className={cx(styles.label, fontsMap[fontFamily].className)}
        >
          {buttonLabel}
        </span>
      </a>
    </CardModuleBackground>
  );
};

export default SimpleButtonRenderer;
