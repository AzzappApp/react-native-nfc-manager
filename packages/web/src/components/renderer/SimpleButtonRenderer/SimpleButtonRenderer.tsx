import { SIMPLE_BUTTON_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from '../../CardModuleBackground';
import styles from './SimpleButtonRenderer.css';
import type { ModuleRendererProps } from '../ModuleRenderer';

export type SimpleButtonRendererProps = ModuleRendererProps &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;
/**
 * Render a SimpleButton module
 */
const SimpleButtonRenderer = ({
  module,
  style,
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
  } = Object.assign({}, SIMPLE_BUTTON_DEFAULT_VALUES, module.data);

  let href: string | undefined;
  switch (actionType as string) {
    case 'phone':
      href = `tel:${actionLink}`;
      break;
    case 'email':
      href = `mailto:${actionLink}`;
      break;
    default:
      href = actionLink;
  }

  return (
    <CardModuleBackground
      {...props}
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
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
          backgroundColor: buttonColor,
          borderRadius,
          borderWidth,
          borderColor,
        }}
        href={href}
      >
        <span
          style={{
            fontFamily,
            color: fontColor,
            fontSize,
          }}
          className={styles.label}
        >
          {buttonLabel}
        </span>
      </a>
    </CardModuleBackground>
  );
};

export default SimpleButtonRenderer;
