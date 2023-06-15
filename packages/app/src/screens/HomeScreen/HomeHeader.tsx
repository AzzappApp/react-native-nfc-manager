import { Image, StyleSheet, View, useColorScheme } from 'react-native';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { ViewProps } from 'react-native';

type HomeHeaderProps = ViewProps & {
  goToSettings: () => void;
};

const HomeHeader = ({ goToSettings, style, ...props }: HomeHeaderProps) => {
  const colorScheme = useColorScheme();
  return (
    <Header
      leftElement={
        <Image
          testID="logo"
          source={
            colorScheme === 'dark'
              ? require('#assets/logo-full_white.png')
              : require('#assets/logo-full_dark.png')
          }
          style={styles.logo}
        />
      }
      rightElement={
        <View style={styles.rightButtonContainer}>
          <IconButton
            icon="notification"
            iconSize={24}
            size={45}
            variant="icon"
            onPress={goToSettings}
          />
          <IconButton
            icon="account"
            onPress={goToSettings}
            iconSize={26}
            size={45}
            variant="icon"
          />
        </View>
      }
      style={[styles.header, style]}
      {...props}
    />
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  logo: {
    height: 28,
  },
  rightButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  header: {
    marginBottom: 8,
  },
});
