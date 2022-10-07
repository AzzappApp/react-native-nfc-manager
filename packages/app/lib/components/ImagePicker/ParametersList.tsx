import { StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { colors, textStyles } from '../../../theme';
import Icon from '../../ui/Icon';
import PressableNative from '../../ui/PressableNative';
import { useEditionParametersDisplayInfos } from './helpers';
import type { ImageEditionParameters } from './helpers';
import type { ScrollViewProps } from 'react-native';

const ParametersList = ({
  onSelectParam,
  ...props
}: ScrollViewProps & {
  onSelectParam(param: keyof ImageEditionParameters): void;
}) => {
  const paramsInfos = useEditionParametersDisplayInfos();
  return (
    <ScrollView {...props} horizontal>
      {parametersList.map(param => {
        const { label, icon } = paramsInfos[param]!;
        return (
          <View key={param} style={styles.paramsButtonContainer}>
            <PressableNative
              onPress={() => onSelectParam(param)}
              style={styles.paramsButton}
            >
              <View style={styles.paramIconContainer}>
                <Icon icon={icon} style={styles.paramIcon} />
              </View>
              <Text style={textStyles.button}>{label}</Text>
            </PressableNative>
          </View>
        );
      })}
    </ScrollView>
  );
};

export default ParametersList;

const styles = StyleSheet.create({
  paramsButtonContainer: {
    width: 100,
    alignItems: 'center',
  },
  paramsButton: {
    alignItems: 'center',
  },
  paramIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.grey100,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paramIcon: {
    width: 20,
    height: 20,
    tintColor: colors.black,
  },
});

export const parametersList: Array<keyof ImageEditionParameters> = [
  'cropData',
  'brightness',
  'contrast',
  'highlights',
  'saturation',
  'shadow',
  'sharpness',
  'structure',
  'temperature',
  'tint',
  'vibrance',
  'vigneting',
];
