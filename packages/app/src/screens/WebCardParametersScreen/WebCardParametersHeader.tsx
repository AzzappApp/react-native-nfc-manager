import { useIntl } from 'react-intl';
import AccountHeader from '#components/AccountHeader';
import Text from '#ui/Text';
import type { AccountHeader_webCard$key } from '#relayArtifacts/AccountHeader_webCard.graphql';

const WebcardParametersHeader = ({
  webCard,
}: {
  webCard: AccountHeader_webCard$key | null;
}) => {
  const intl = useIntl();
  return (
    <AccountHeader
      webCard={webCard}
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
