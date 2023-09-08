import { fetchQuery } from 'react-relay';
import {
  getRequest,
  createOperationDescriptor,
  Observable,
} from 'relay-runtime';

/**
 * A wrapper around `fetchQuery` that retains the query until the returned observable is unsubscribed.
 */
const fetchQueryAndRetain: typeof fetchQuery = (
  environment,
  query,
  variables,
  options,
) => {
  const queryRequest = getRequest(query);
  const queryDescriptor = createOperationDescriptor(queryRequest, variables);
  return Observable.create(sink => {
    const disposable = environment.retain(queryDescriptor);
    const subscription = fetchQuery(
      environment,
      query,
      variables,
      options,
    ).subscribe({
      next: sink.next,
      error: sink.error,
    });
    return () => {
      disposable.dispose();
      subscription.unsubscribe();
    };
  });
};

export default fetchQueryAndRetain;
