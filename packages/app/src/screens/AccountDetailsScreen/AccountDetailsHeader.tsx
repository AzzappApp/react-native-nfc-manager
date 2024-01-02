import { useIntl } from 'react-intl';
import AccountHeader from '#components/AccountHeader';

const AccountDetailsHeader = () => {
  const intl = useIntl();
  return (
    <AccountHeader
      webCard={null}
      title={intl.formatMessage({
        defaultMessage: 'Account details',
        description:
          'Title of the account details screen where user can change their email, phone number ...',
      })}
    />
  );
};

export default AccountDetailsHeader;
