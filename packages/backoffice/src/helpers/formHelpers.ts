import React, { useEffect } from 'react';
import useLatestFunction from './useLatestFunction';

export const useForm = <TData>(
  getInitialState: (() => Partial<TData>) | null = null,
  errors?: Partial<Record<keyof TData, string[]>> | null,
  resetDependencies: unknown[] = [],
) => {
  const { useCallback, useState } = React;
  const getInitialStateLatest = useLatestFunction(
    () => getInitialState?.() ?? {},
  );
  const [data, setData] = useState<Partial<TData>>(getInitialStateLatest);

  useEffect(() => {
    if (getInitialStateLatest) {
      setData(getInitialStateLatest());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getInitialStateLatest, ...resetDependencies]);

  const fieldProps = useCallback(
    <TField extends keyof TData, TValue = TData[TField]>(
      field: TField,
      {
        parse,
        format,
      }: {
        parse?: (value: TValue) => TData[TField];
        format?: (value?: TData[TField] | null) => TValue;
      } = {},
    ): {
      value: TValue;
      onChange: (
        value:
          | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
          | TValue,
      ) => void;
      error: boolean;
      helperText?: string;
    } => ({
      value: (format ? format(data[field]) : data[field]) as any,
      onChange: (
        value:
          | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
          | TValue,
      ) => {
        if (value && typeof value === 'object' && 'target' in value) {
          if (value.target.type === 'checkbox') {
            value = (value.target as any).checked as unknown as TValue;
          } else {
            value = value.target.value as unknown as TValue;
          }
        }
        setData(state => ({
          ...state,
          [field]: parse ? parse(value as TValue) : value,
        }));
      },
      error: !!errors?.[field]?.length,
      helperText: errors?.[field]?.join(', ') ?? undefined,
    }),
    [errors, data],
  );

  return {
    data,
    setData,
    fieldProps,
  };
};

export const intParser = (value: string) => parseInt(value, 10);
