import { StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  Defs,
  Svg,
  RadialGradient,
  Stop,
  Rect,
  LinearGradient,
} from 'react-native-svg';
import { graphql, useFragment } from 'react-relay';
import { DEFAULT_COLOR_PALETTE } from '@azzapp/shared/cardHelpers';
import type { ProfileBackground_profile$key } from '@azzapp/relay/artifacts/ProfileBackground_profile.graphql';

const ProfileBackground = ({
  profile: profileKey,
}: {
  profile: ProfileBackground_profile$key;
}) => {
  const { width, height } = useWindowDimensions();

  const profile = useFragment(
    graphql`
      fragment ProfileBackground_profile on Profile {
        cardColors {
          dark
          light
          primary
        }
      }
    `,
    profileKey,
  );
  const { primary, dark } = profile.cardColors ?? DEFAULT_COLOR_PALETTE;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg height={height} width={width}>
        <Defs>
          <RadialGradient
            id="grad"
            cx={0.5}
            cy={0.0}
            rx={1.3}
            ry={0.66}
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0%" stopColor={primary} stopOpacity="1" />
            <Stop offset="100%" stopColor={dark} stopOpacity="1" />
          </RadialGradient>
          <LinearGradient
            id="linear"
            x1={0.5}
            y1={0}
            x2={0.5}
            y2={0.66}
            gradientUnits="objectBoundingBox"
          >
            <Stop offset={0.22} stopColor={primary} stopOpacity={0} />
            <Stop offset={0.66} stopColor={dark} stopOpacity={0.2} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" height={height} width={width} fill="url(#grad)" />
        <Rect x="0" y="0" height={height} width={width} fill="url(#linear)" />
      </Svg>
    </View>
  );
};

export default ProfileBackground;
