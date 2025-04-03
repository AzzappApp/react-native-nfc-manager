import { useMemo } from 'react';
import { RelayEnvironmentProvider } from 'react-relay';
import { getRelayEnvironment } from '#helpers/relayEnvironment';

type AppRelayEnvironmentProviderProps = {
  children: React.ReactNode;
};

const AppRelayEnvironmentProvider = ({
  children,
}: AppRelayEnvironmentProviderProps) => {
  const environment = useMemo(() => getRelayEnvironment(), []);

  return (
    <RelayEnvironmentProvider environment={environment}>
      {children}
    </RelayEnvironmentProvider>
  );
};

export default AppRelayEnvironmentProvider;
