import { Image } from 'expo-image';
import { View, StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import COUNTRY_FLAG from '@azzapp/shared/CountryFlag';
import Text from '#ui/Text';
import type { ContactDetailAIItemLocations_enrichment$key } from '#relayArtifacts/ContactDetailAIItemLocations_enrichment.graphql';
import type { CountryCode } from 'libphonenumber-js';

export const ContactDetailAIItemLocations = ({
  contact: contactKey,
}: {
  contact: ContactDetailAIItemLocations_enrichment$key | null;
}) => {
  const publicProfile = useFragment(
    graphql`
      fragment ContactDetailAIItemLocations_enrichment on PublicProfile {
        location {
          city
          country {
            code
            name
          }
        }
      }
    `,
    contactKey,
  );
  const location = publicProfile?.location;

  if (!location) return undefined;
  const flagUri =
    location.country?.code &&
    COUNTRY_FLAG[location.country.code as CountryCode];
  return (
    <View key="location" style={styles.container}>
      {flagUri && <Image source={{ uri: flagUri }} style={styles.image} />}
      {(location.country.name || location.city) && (
        <Text variant="medium">{`${location.country.name ? location.country.name : ''} ${location.city ? location.city : ''}`}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'center',
  },
  image: { width: 22, height: 16, borderRadius: 2 },
});
