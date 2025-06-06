import { graphql, useFragment } from 'react-relay';
import { DEFAULT_COLOR_PALETTE } from '@azzapp/shared/cardHelpers';
import WebCardBackgroundBase from '#components/WebCardBackground';
import type { WebCardBackground_webCard$key } from '#relayArtifacts/WebCardBackground_webCard.graphql';

const WebCardBackground = ({
  webCard: webCardKey,
}: {
  webCard: WebCardBackground_webCard$key;
}) => {
  const webCard = useFragment(
    graphql`
      fragment WebCardBackground_webCard on WebCard {
        cardColors {
          dark
          primary
        }
      }
    `,
    webCardKey,
  );
  const { primary, dark } = webCard.cardColors ?? DEFAULT_COLOR_PALETTE;
  return <WebCardBackgroundBase colors={[primary, dark]} />;
};

export default WebCardBackground;
