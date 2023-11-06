import { useIntl } from 'react-intl';
import AccountHeader from '#components/AccountHeader';
import type { AccountHeader_webCard$key } from '@azzapp/relay/artifacts/AccountHeader_webCard.graphql';

const AccountDetailsHeader = ({
  webCard,
}: {
  webCard: AccountHeader_webCard$key | null;
}) => {
  const intl = useIntl();
  return (
    <AccountHeader
      webCard={webCard}
      title={intl.formatMessage({
        defaultMessage: 'Account details',
        description:
          'Title of the account details screen where user can change their email, phone number ...',
      })}
    />
  );
};

export default AccountDetailsHeader;
