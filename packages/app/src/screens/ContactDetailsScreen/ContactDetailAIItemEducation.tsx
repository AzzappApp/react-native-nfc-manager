import { Image } from 'expo-image';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Text from '#ui/Text';
import { ContactDetailAISectionSeparator } from './ContactDetailAISectionSeparator';
import { ContactDetailExpendableSection } from './ContactDetailExpendableSection';
import { ContactDetailLogoFallback } from './ContactDetailLogoFallback';
import { getDisplayedDuration } from './ContactDetailToolBox';
import type { ContactDetailAIItemEducation_enrichment$key } from '#relayArtifacts/ContactDetailAIItemEducation_enrichment.graphql';

const LOGO_SIZE = 50;
const CONTAINER_PADDING = 20;
const CONTAINER_GAP = 10;

export const ContactDetailAIItemEducation = ({
  contact: contactKey,
}: {
  contact: ContactDetailAIItemEducation_enrichment$key | null;
}) => {
  const enrichment = useFragment(
    graphql`
      fragment ContactDetailAIItemEducation_enrichment on ContactEnrichment
      @argumentDefinitions(
        pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
      ) {
        publicProfile {
          education {
            school
            summary
            endDate
            startDate
            logo {
              uri: uri(width: 180, pixelRatio: $pixelRatio)
            }
          }
        }
      }
    `,
    contactKey,
  );
  const { width: screenWidth } = useScreenDimensions();
  const maxTextWith =
    screenWidth - LOGO_SIZE - 2 * CONTAINER_PADDING - CONTAINER_GAP;
  const styles = useStyleSheet(stylesheet);

  const intl = useIntl();

  return (
    <>
      {enrichment?.publicProfile?.education &&
        enrichment?.publicProfile?.education?.length > 0 && (
          <ContactDetailAISectionSeparator
            icon="education"
            label={intl.formatMessage({
              defaultMessage: 'Education',
              description:
                'ContactDetailsModal - Title for AI profile education section',
            })}
          />
        )}
      <ContactDetailExpendableSection minHeight={223}>
        <>
          {enrichment?.publicProfile?.education?.map((educationItem, index) => {
            const displayedYear = getDisplayedDuration(educationItem, intl);

            return (
              <View key={`education:${index}`} style={styles.container}>
                <View
                  style={[styles.imageContainer, { maxWidth: maxTextWith }]}
                >
                  {educationItem?.logo?.uri ? (
                    <Image
                      source={educationItem.logo?.uri}
                      style={styles.image}
                      contentFit="scale-down"
                    />
                  ) : (
                    <ContactDetailLogoFallback label={educationItem.school} />
                  )}
                  <View style={styles.textContainer}>
                    {educationItem.school && (
                      <Text variant="button">{educationItem.school}</Text>
                    )}
                    {educationItem.summary && (
                      <Text variant="smallbold">{educationItem.summary}</Text>
                    )}
                    {displayedYear && (
                      <Text variant="small" style={styles.text}>
                        ({displayedYear})
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </>
      </ContactDetailExpendableSection>
    </>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  container: { marginBottom: 10 },
  imageContainer: { flexDirection: 'row', gap: CONTAINER_GAP },
  image: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 8 },
  textContainer: {
    marginLeft: CONTAINER_GAP,
    gap: CONTAINER_GAP,
    paddingBottom: 20,
  },
  text: { color: appearance === 'dark' ? colors.grey600 : colors.grey400 },
}));
