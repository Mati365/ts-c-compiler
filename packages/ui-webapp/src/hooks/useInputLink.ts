import {useState} from 'react';
import * as R from 'ramda';

/**
 * Typedef
 */
export type LinkInputConfig<T> = {
  initialData?: T,
  value?: T,
  onChange?: (val: T) => void,
};

export type LinkInputInputProps<T> = {
  value: T,
  onChange: (e: any) => any,
};

export type InputLinkerFn<T> = (
  name?: string,
  params?: {
    defaultValue?: any,
    relatedInputsFn?: (newValue: any, name: string, value: T) => object,
    valueParserFn?: (val: any) => any,
  },
) => LinkInputInputProps<any>;

export type LinkInputAttachParams<T> = {
  initialData: T,
  value: T,
  setValue: (val: T) => void,

  input: InputLinkerFn<T>,
  numericInput: (name?: string, params?: any) => LinkInputInputProps<T>,
};

/**
 * Pick value
 */
export const pickEventValue = R.unless(
  R.either(R.isNil, R.is(String)),
  R.ifElse(
    R.has('target'),
    R.compose(
      R.cond([
        [R.propEq('type', 'checkbox'), R.prop('checked')],
        [R.propEq('type', 'file'), ({files}) => files[0]],
        [R.T, R.prop('value')],
      ]),
      R.prop('target'),
    ),
    R.identity,
  ),
);

/**
 * Linker helper types typescript
 */
export const useInputLink = <T>(
  {
    value: forwardedValue,
    initialData,
    onChange,
  }: LinkInputConfig<T> = {},
) => {
  const initial = forwardedValue || initialData;
  const [outerValue, setOuterValue] = useState<{value: T}>(
    () => ({
      value: initial,
    }),
  );

  let {value} = outerValue;
  const setValue = (newValue: T) => setOuterValue(
    {
      value: newValue,
    },
  );

  if (forwardedValue !== undefined && value !== forwardedValue) {
    outerValue.value = forwardedValue;
    value = forwardedValue;
  }

  const safeUpdateValue = (newValue: T) => {
    if (onChange)
      onChange(newValue);

    if (R.isNil(forwardedValue) || !onChange)
      setValue(newValue);
  };

  const inputFn: InputLinkerFn<T> = (
    name?: string,
    {
      defaultValue = '',
      relatedInputsFn = null,
      valueParserFn = R.identity,
    } = {},
  ): LinkInputInputProps<T> => {
    const lensPath = name && R.lensPath(name.split('.'));
    const inputValue = (
      name
        ? R.view(lensPath, value ?? {})
        : value
    );

    return {
      value: <any> R.defaultTo(defaultValue, inputValue),
      onChange(e: Event) {
        const newValue = valueParserFn(pickEventValue(e));
        let newStateValue: T = newValue;

        if (name) {
          newStateValue = R.set(
            lensPath,
            newValue,
            {
              ...value,
              ...relatedInputsFn && relatedInputsFn(newValue, name, value),
            },
          );
        } else if (R.equals(inputValue, newValue))
          return;

        safeUpdateValue(newStateValue);
      },
    };
  };

  return <LinkInputAttachParams<T>> {
    initialData: initial,
    value,
    setValue: safeUpdateValue,

    input: inputFn,
    numericInput: (name?: string, params?: any): LinkInputInputProps<T> => inputFn(name, {
      ...params,
      valueParserFn: Number.parseInt,
    }),
  };
};
