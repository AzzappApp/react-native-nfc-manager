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
import type { ContactDetailAIItemProfessionalExperiences_enrichment$key } from '#relayArtifacts/ContactDetailAIItemProfessionalExperiences_enrichment.graphql';

const LOGO_SIZE = 50;
const CONTAINER_PADDING = 20;
const CONTAINER_GAP = 10;

export const ContactDetailAIItemProfessionalExperiences = ({
  contact: contactKey,
}: {
  contact: ContactDetailAIItemProfessionalExperiences_enrichment$key | null;
}) => {
  const enrichment = useFragment(
    graphql`
      fragment ContactDetailAIItemProfessionalExperiences_enrichment on ContactEnrichment
      @argumentDefinitions(
        pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
      ) {
        publicProfile {
          positions {
            company
            title
            startDate
            endDate
            logo {
              uri: uri(width: 180, pixelRatio: $pixelRatio)
              id
            }
            summary
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
      {enrichment?.publicProfile?.positions &&
        enrichment?.publicProfile?.positions?.length > 0 && (
          <ContactDetailAISectionSeparator
            icon="professional"
            label={intl.formatMessage({
              defaultMessage: 'Professional Experience',
              description:
                'ContactDetailsModal - Title for AI profile Professional Experience section',
            })}
          />
        )}
      <ContactDetailExpendableSection minHeight={273}>
        <>
          {enrichment?.publicProfile?.positions?.map(
            (experienceItem, index) => {
              const displayedYear = getDisplayedDuration(experienceItem, intl);
              return (
                <View key={`experience:${index}`} style={styles.container}>
                  <View
                    style={[styles.imageContainer, { maxWidth: maxTextWith }]}
                  >
                    {experienceItem.logo?.uri ? (
                      <Image
                        source={experienceItem.logo?.uri}
                        style={styles.image}
                        contentFit="scale-down"
                      />
                    ) : (
                      <ContactDetailLogoFallback
                        label={experienceItem.company}
                      />
                    )}
                    <View style={styles.textContainer}>
                      {experienceItem.company && (
                        <Text variant="button">{experienceItem.company}</Text>
                      )}
                      {(experienceItem.title || displayedYear) && (
                        <Text variant="smallbold">
                          {experienceItem.title}
                          {displayedYear ? ' (' + displayedYear + ')' : ''}
                        </Text>
                      )}
                      {experienceItem.summary && (
                        <Text variant="small" style={styles.text}>
                          {experienceItem.summary}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            },
          )}
        </>
      </ContactDetailExpendableSection>
    </>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  container: { marginBottom: 10 },
  imageContainer: { flexDirection: 'row', gap: CONTAINER_GAP },
  image: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 8 },
  textContainer: { marginLeft: CONTAINER_GAP, gap: 7, paddingBottom: 20 },
  text: { color: appearance === 'dark' ? colors.grey600 : colors.grey400 },
}));
