import * as React from 'react';

type ForgotPasswordProps = {
  code: string;
  email: string;
};

export const ForgotPassword: React.FC<Readonly<ForgotPasswordProps>> = ({
  code,
  email,
}) => (
  <div>
    <h1>Reset your password !</h1>
    <a
      href={`azzapp://reset-password?token=${code}&issuer=${encodeURIComponent(
        email,
      )}`}
    >
      Click here to reset your password
    </a>
    <br />
    or type this code in the app: {code}
  </div>
); //todo i18n

export default ForgotPassword;
