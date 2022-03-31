import { Suspense } from 'react';
import { useLazyLoadQuery } from 'react-relay';
import type { GraphQLTaggedNode, Variables } from 'react-relay';

type RelayScreenWrapperProps = {
  component: React.ComponentType<any>;
  query: GraphQLTaggedNode;
  fallback?: React.ComponentType<any> | null;
  getVariables?: (componentProps: any) => Variables;
};

const RelayScreenWrapper = (props: RelayScreenWrapperProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { component, query, fallback: Fallback, ...componentProps } = props;
  return (
    <Suspense fallback={Fallback ? <Fallback {...componentProps} /> : null}>
      <RelayScreenWrapperInner {...props} />
    </Suspense>
  );
};

export default RelayScreenWrapper;

const RelayScreenWrapperInner = (props: RelayScreenWrapperProps) => {
  const {
    component: Component,
    query,
    fallback, // eslint-disable-line @typescript-eslint/no-unused-vars
    getVariables,
    ...componentProps
  } = props;
  const data = useLazyLoadQuery(
    query,
    getVariables ? getVariables(componentProps) : {},
  );

  return <Component data={data} {...componentProps} />;
};
