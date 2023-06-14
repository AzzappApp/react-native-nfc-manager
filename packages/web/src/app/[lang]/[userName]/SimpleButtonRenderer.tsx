import { SIMPLE_BUTTON_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from './CardModuleBackground';
import type { CardModule } from '@azzapp/data/domains';

export type SimpleButtonRendererProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children'
> & {
  module: CardModule;
};
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
        style={{
          height,
          width,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom,
          marginTop,
          backgroundColor: buttonColor,
          borderStyle: 'solid',
          borderRadius,
          borderWidth,
          borderColor,
          overflow: 'hidden',
          textDecoration: 'none',
        }}
        href={href}
      >
        <span
          style={{
            fontFamily,
            color: fontColor,
            fontSize,
            flexWrap: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {buttonLabel}
        </span>
      </a>
    </CardModuleBackground>
  );
};

export default SimpleButtonRenderer;
