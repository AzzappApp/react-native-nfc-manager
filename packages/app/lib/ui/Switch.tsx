import { Switch as RNSwitch } from 'react-native';
import { colors } from '../../theme';
import type { SwitchProps } from 'react-native';

const Switch = (props: SwitchProps) => (
  <RNSwitch
    thumbColor="#FFF"
    {...props}
    trackColor={{ false: colors.grey, true: colors.orange }}
  />
);

export default Switch;
