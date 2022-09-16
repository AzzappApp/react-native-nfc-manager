import { Pressable } from 'react-native';
import CoverRenderer from './CoverRenderer';
import Link from './Link';
import type { CoverRendererProps } from './CoverRenderer';
import type { StyleProp, ViewStyle } from 'react-native';

const CoverLink = ({
  style,
  coverStyle,
  ...props
}: CoverRendererProps & {
  userId: string;
  coverStyle?: StyleProp<ViewStyle>;
}) => (
  <Link
    route="USER"
    params={{
      userName: props.userName,
    }}
  >
    <Pressable style={style}>
      {({ pressed }) => (
        <CoverRenderer
          {...props}
          style={[coverStyle, pressed && { opacity: 0.8 }]}
          videoPaused={pressed}
          playTransition={!pressed}
        />
      )}
    </Pressable>
  </Link>
);

export default CoverLink;
