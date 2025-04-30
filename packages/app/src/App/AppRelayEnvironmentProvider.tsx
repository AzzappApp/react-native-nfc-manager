import { useMemo } from 'react';
import { RelayEnvironmentProvider } from 'react-relay';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import type { ReactNode } from 'react';

type AppRelayEnvironmentProviderProps = {
  children: ReactNode;
};

const AppRelayEnvironmentProvider = ({
  children,
}: AppRelayEnvironmentProviderProps) => {
  const environment = useMemo(() => getRelayEnvironment(), []);

  return (
    <RelayEnvironmentProvider environment={environment}>
      {children as any /* remove this cast once all projects are on react 19 */}
    </RelayEnvironmentProvider>
  );
};

export default AppRelayEnvironmentProvider;
