import { useIntl } from 'react-intl';
import AccountHeader from '#components/AccountHeader';
import type { AccountHeader_profile$key } from '@azzapp/relay/artifacts/AccountHeader_profile.graphql';

const AccountDetailsHeader = ({
  profile,
}: {
  profile: AccountHeader_profile$key | null;
}) => {
  const intl = useIntl();
  return (
    <AccountHeader
      profile={profile}
      title={intl.formatMessage({
        defaultMessage: 'Account details',
        description:
          'Title of the account details screen where user can change their email, phone number ...',
      })}
    />
  );
};

export default AccountDetailsHeader;
