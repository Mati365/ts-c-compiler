import React, {ComponentType} from 'react';
import * as R from 'ramda';

import {useInputLink, LinkInputAttachParams} from '../hooks/useInputLink';

export {
  LinkInputAttachParams,
};

export type LinkProps<T> = {
  l?: LinkInputAttachParams<T>,
  value?: T
  initialData?: T,
  onChange?: (t: T) => void,
};

export const linkInputs = <NewValType extends unknown = any>(
  {
    initialData: defaultInitialData = null,
    parsers = {
      input: R.identity,
      output: R.identity,
    },
  }: {
    initialData?: NewValType,
    parsers?: {
      input(inVal: any): NewValType,
      output(outVal: NewValType): any,
    },
  } = {},
) => <PropsType extends object> (Component: ComponentType<PropsType>) => {
  const Wrapped = (
    {
      l, initialData, value, onChange,
      ...props
    }: (PropsType & LinkProps<NewValType>),
  ) => {
    const newLink = useInputLink<NewValType>(
      {
        initialData: R.defaultTo(defaultInitialData, initialData),
        value: parsers.input(value),
        onChange: onChange && ((newValue) => onChange(
          parsers.output(newValue),
        )),
      },
    );

    return (
      <Component
        {...props as any}
        l={newLink}
        value={newLink.value}
      />
    );
  };

  Wrapped.displayName = 'Wrapped';

  return Wrapped;
};
