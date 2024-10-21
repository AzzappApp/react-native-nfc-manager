import { StyleSheet } from 'react-native';
import { useRouter, type NativeScreenProps } from '#components/NativeRouter';
import SafeAreaView from '#ui/SafeAreaView';
import ContactDetailsBody from './ContactDetailsBody';
import type { ContactDetailsRoute } from '#routes';

type Props = NativeScreenProps<ContactDetailsRoute>;

const ContactDetailsScreen = ({ route }: Props) => {
  const details = route.params;
  const router = useRouter();

  return (
    <SafeAreaView
      style={styles.container}
      edges={{ bottom: 'off', top: 'additive' }}
    >
      <ContactDetailsBody
        details={details}
        onClose={router.back}
        onSave={console.log}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ContactDetailsScreen;
