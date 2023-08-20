import { View } from 'react-native';
import Link from '#components/Link';
import Button from '#ui/Button';

const WelcomeScreen = () => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Link route="NEW_PROFILE" prefetch>
        <Button label="Create my first webcard" />
      </Link>
    </View>
  );
};

export default WelcomeScreen;
