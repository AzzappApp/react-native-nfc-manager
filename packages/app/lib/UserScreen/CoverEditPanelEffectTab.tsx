import chunk from 'lodash/chunk';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import type { CoverUpdates } from './CoverEditPanel';
import type { StyleProp, ViewStyle } from 'react-native';

type CoverEditPanelEffectTabProps = {
  overlayEffect: string;
  updateField: <T extends keyof CoverUpdates>(
    t: T,
    value: CoverUpdates[T],
  ) => void;
  style: StyleProp<ViewStyle>;
};

const CoverEditPanelEffectTab = ({
  overlayEffect,
  updateField,
  style,
}: CoverEditPanelEffectTabProps) => (
  <View style={[style, styles.container]}>
    {chunk(EFFECTS, 5).map((effects, index) => (
      <View key={index} style={styles.row}>
        {effects.map(({ effect, icon }) => (
          <View
            key={effect}
            style={[
              styles.buttonContainer,
              overlayEffect === effect && styles.buttonContainerSelected,
            ]}
          >
            <Pressable
              onPress={() => updateField('overlayEffect', effect)}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              {icon && <Image source={icon} style={styles.buttonIcon} />}
            </Pressable>
          </View>
        ))}
      </View>
    ))}
  </View>
);

export default CoverEditPanelEffectTab;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonContainer: {
    width: 52,
    height: 59,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 10,
  },
  buttonContainerSelected: {
    borderColor: '#000',
  },
  button: {
    position: 'absolute',
    width: 48,
    height: 55,
    borderRadius: 9,
    backgroundColor: colors.lightGrey,
    justifyContent: 'flex-end',
  },
  buttonPressed: {
    backgroundColor: colors.grey,
  },
  buttonIcon: {
    resizeMode: 'stretch',
    width: 48,
    borderRadius: 1.75,
  },
});

const EFFECTS = [
  { effect: 'none', icon: null },
  { effect: 'diagonal-right', icon: require('./assets/diagonal-right.png') },
  { effect: 'diagonal-left', icon: require('./assets/diagonal-left.png') },
  { effect: 'gradient-bottom', icon: require('./assets/gradient-bottom.png') },
  {
    effect: 'gradient-bottom-top',
    icon: require('./assets/gradient-bottom-top.png'),
  },
  { effect: 'intersect', icon: require('./assets/intersect.png') },
  { effect: 'intersect-round', icon: require('./assets/intersect-round.png') },
  { effect: 'substract', icon: require('./assets/substract.png') },
  { effect: 'wave', icon: require('./assets/wave.png') },
  { effect: 'darken', icon: require('./assets/darken.png') },
] as const;
