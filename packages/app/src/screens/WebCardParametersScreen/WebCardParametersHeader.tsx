import { useIntl } from 'react-intl';
import { graphql, useFragment } from 'react-relay';
import AccountHeader from '#components/AccountHeader';
import Text from '#ui/Text';
import type { WebCardParametersHeader_webCard$key } from '#relayArtifacts/WebCardParametersHeader_webCard.graphql';

const WebcardParametersHeader = ({
  webCard: webCardKey,
}: {
  webCard: WebCardParametersHeader_webCard$key | null;
}) => {
  const intl = useIntl();
  const webCard = useFragment(
    graphql`
      fragment WebCardParametersHeader_webCard on WebCard {
        ...AccountHeader_webCard
      }
    `,
    webCardKey,
  );
  return (
    <AccountHeader
      webCard={webCard || null}
      title={intl.formatMessage(
        {
          defaultMessage: 'WebCard{azzappA} parameters',
          description: 'Title of the webcard parameters screen.',
        },
        {
          azzappA: <Text variant="azzapp">a</Text>,
        },
      )}
    />
  );
};

export default WebcardParametersHeader;
