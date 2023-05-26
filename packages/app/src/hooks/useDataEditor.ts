import isEqual from 'lodash/isEqual';
import memoize from 'lodash/memoize';
import { useCallback, useMemo, useRef, useState } from 'react';
import { typedEntries } from '@azzapp/shared/objectHelpers';

/**
 * A hook for editing data. It keeps track of the initial value, the current value, and the updates.
 */
const useDataEditor = <
  TValue extends object,
  TDefault extends Partial<TValue> = Partial<TValue>,
>(options: {
  /**
   * The initial value of the data.
   * If the updated fields are equal to the initial value one, they will be removed from the updates.
   */
  initialValue?: TValue | null;
  /**
   * The default value of the data.
   */
  defaultValue?: TDefault | null;
  /**
   * The initial updates to create.
   */
  initialUpdates?: Partial<TValue> | (() => Partial<TValue>) | null;
}) => {
  // The initial value should not change between renders, so we use a ref to ensure that.
  const initialValue = useRef(options.initialValue).current;

  const [updates, setUpdates] = useState<Partial<TValue>>(
    options.initialUpdates ?? {},
  );

  const data = useMemo<PartialIfNotInDefault<TValue, TDefault>>(
    () => ({ ...options.defaultValue, ...initialValue, ...updates } as any),
    [options.defaultValue, initialValue, updates],
  );

  const updateFields = useCallback(
    (values: Partial<TValue>) => {
      setUpdates(updates => {
        updates = { ...updates };
        typedEntries(values).forEach(([key, value]) => {
          if (isEqual(value, initialValue?.[key])) {
            delete updates[key];
          } else {
            updates[key] = value;
          }
        });
        return updates;
      });
    },
    [initialValue],
  );

  const fieldUpdateHandler = useMemo(
    () =>
      memoize(
        <TField extends keyof TValue>(key: TField) =>
          (value: TValue[TField]) => {
            updateFields({ [key]: value } as any);
          },
      ),
    [updateFields],
  );

  return {
    data,
    updates,
    updateFields,
    setUpdates,
    fieldUpdateHandler,
    dirty: Object.keys(updates).length > 0,
  };
};

export default useDataEditor;

type PartialIfNotInDefault<TValue, UDefault extends Partial<TValue>> = {
  [K in keyof TValue]: UDefault[K] extends undefined
    ? TValue[K] | undefined
    : Exclude<TValue[K], undefined>;
};
