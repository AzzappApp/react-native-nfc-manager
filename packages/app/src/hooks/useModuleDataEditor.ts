import isEqual from 'lodash/isEqual';
import memoize from 'lodash/memoize';
import { useCallback, useMemo, useState } from 'react';
import { getValuesFromStyle, type CardStyle } from '@azzapp/shared/cardHelpers';
import { getModuleDataValues } from '@azzapp/shared/cardModuleHelpers';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';

/**
 * A hook for editing module data.
 * initial value is the current module data.
 * :warning: initialValue must contains all the keys of the module data.
 */
const useModuleDataEditor = <
  TModuleData extends object,
  TStyleValues extends Partial<Record<keyof TModuleData, keyof CardStyle>>,
  TDefaultValues extends Partial<TModuleData>,
>({
  initialValue,
  cardStyle,
  styleValuesMap,
  defaultValues,
}: {
  /**
   * The current module data.
   */
  initialValue: NullableFields<TModuleData>;
  /**
   * The card style used to render the web card.
   */
  cardStyle: CardStyle | null | undefined;
  /**
   * A map of the module data keys to the card style keys.
   */
  styleValuesMap: TStyleValues | null | undefined;
  /**
   * The default value of the data.
   */
  defaultValues: TDefaultValues;
}) => {
  const [value, setValue] = useState<NullableFields<TModuleData>>(initialValue);

  const data = getModuleDataValues({
    data: value as TModuleData,
    cardStyle,
    styleValuesMap,
    defaultValues,
  });

  const styleValues = useMemo(() => {
    return getValuesFromStyle(cardStyle, styleValuesMap as any);
  }, [cardStyle, styleValuesMap]);

  const updateFields = useCallback(
    (updates: Partial<TModuleData>) => {
      setValue(value => {
        value = { ...value };
        typedEntries(updates).forEach(([field, fieldValue]) => {
          if (
            isEqual(fieldValue, styleValues[field]) ||
            isEqual(fieldValue, defaultValues[field])
          ) {
            value[field] = null;
          } else {
            value[field] = fieldValue ?? null;
          }
        });
        return value;
      });
    },
    [defaultValues, styleValues],
  );

  const fieldUpdateHandler = useMemo(
    () =>
      memoize(
        <TField extends keyof TModuleData>(key: TField) =>
          (value: TModuleData[TField]) => {
            updateFields({ [key]: value } as any);
          },
      ),
    [updateFields],
  );

  return {
    data,
    value,
    updateFields,
    setValue,
    fieldUpdateHandler,
    dirty: !isEqual(value, initialValue),
  };
};

export default useModuleDataEditor;
