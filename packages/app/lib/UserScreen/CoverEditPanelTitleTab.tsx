import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontFamilies, textStyles } from '../../theme';
import ColorPicker from '../components/ColorPicker';
import DashedSlider from '../components/DashedSlider';
import FontPicker from '../components/FontPicker';
import { TitlePositionIcon } from './TitlePositionIcon';
import TitlePositionPicker from './TitlePositionPicker';
import type { CoverUpdates } from './CoverEditPanel';
import type { StyleProp, ViewStyle } from 'react-native';

type CoverEditPanelTitleTabProps = {
  title: string;
  titlePosition: string;
  titleFont: string;
  titleFontSize: number;
  titleColor: string;
  titleRotation: number;
  bottomSheetHeights: number;
  updateField: <T extends keyof CoverUpdates>(
    t: T,
    value: CoverUpdates[T],
  ) => void;
  style: StyleProp<ViewStyle>;
};

const CoverEditPanelTitleTab = ({
  title,
  titlePosition,
  titleFont,
  titleFontSize,
  titleColor,
  titleRotation,
  bottomSheetHeights,
  updateField,
  style,
}: CoverEditPanelTitleTabProps) => {
  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [titlePositonPickerOpen, setTitlePositonPickerOpen] = useState(false);

  return (
    <>
      <View style={[style, styles.container]}>
        <TextInput
          value={title}
          onChangeText={text => updateField('title', text)}
          style={styles.titleInput}
        />
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { marginRight: 10 },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setFontPickerOpen(true)}
          >
            <Text
              style={{
                fontSize: 21,
                fontFamily: titleFont,
              }}
            >
              abc
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { marginRight: 10 },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setColorPickerOpen(true)}
          >
            <Text
              style={{
                fontFamily: fontFamilies.semiBold,
                fontSize: 24,
                color: titleColor,
              }}
            >
              A
            </Text>
            <View
              style={{
                width: 25,
                height: 3,
                borderRadius: 4,
                backgroundColor: titleColor,
              }}
            />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setTitlePositonPickerOpen(true)}
          >
            <TitlePositionIcon value={titlePosition} />
          </Pressable>
        </View>
        <View style={styles.sliders}>
          <View style={[styles.sliderContainer, { marginRight: 40 }]}>
            <DashedSlider
              value={titleFontSize}
              min={8}
              max={36}
              step={2}
              interval={10}
              onChange={value => updateField('titleFontSize', value)}
            />
            <Text style={[textStyles.small, styles.sliderTitle]}>
              FONT SIZE : {titleFontSize}
            </Text>
          </View>
          <View style={styles.sliderContainer}>
            <DashedSlider
              value={titleRotation}
              min={0}
              max={180}
              step={15}
              interval={10}
              onChange={value => updateField('titleRotation', value)}
            />
            <Text style={[textStyles.small, styles.sliderTitle]}>
              ROTATE : {titleRotation}°
            </Text>
          </View>
        </View>
      </View>
      <FontPicker
        title="Font style"
        value={titleFont}
        visible={fontPickerOpen}
        onRequestClose={() => setFontPickerOpen(false)}
        onChange={value => updateField('titleFont', value)}
        height={bottomSheetHeights}
      />
      <ColorPicker
        title="Font color"
        initialValue={titleColor}
        visible={colorPickerOpen}
        onRequestClose={() => setColorPickerOpen(false)}
        onChange={value => updateField('titleColor', value)}
        height={bottomSheetHeights}
      />
      <TitlePositionPicker
        value={titlePosition}
        visible={titlePositonPickerOpen}
        onRequestClose={() => setTitlePositonPickerOpen(false)}
        onChange={value => updateField('titlePosition', value)}
        height={bottomSheetHeights}
      />
    </>
  );
};

export default CoverEditPanelTitleTab;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 0,
    justifyContent: 'space-between',
  },
  titleInput: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: colors.darkWhite,
    borderRadius: 15,
    fontFamily: fontFamilies.semiBold,
  },
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.darkGrey,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.grey,
  },
  sliders: {
    marginTop: 10,
    flexDirection: 'row',
  },
  sliderContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  sliderTitle: {
    marginTop: 4,
    alignSelf: 'center',
  },
  titlePositionIcon: {
    width: 24,
    resizeMode: 'contain',
  },
});
