import { Suspense, useEffect, useState } from 'react';

const ClientOnlySuspense = (props: React.SuspenseProps): any => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready ? <Suspense {...props} /> : props.fallback ?? null;
};

export default ClientOnlySuspense;
