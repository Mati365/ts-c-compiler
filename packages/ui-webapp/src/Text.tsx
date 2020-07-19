import React from 'react';
import c from 'classnames';
import {SizeType} from './shared/types';

type TextProps = JSX.IntrinsicElements['span'] & {
  uppercase?: boolean,
  underline?: boolean,
  size?: SizeType,
};

export const Text = (
  {
    uppercase, underline,
    size = SizeType.NORMAL,
    className, ...props
  }: TextProps,
) => (
  <span
    className={c(
      className,
      `size-${size}`,
      {
        'text-underline': underline,
        'text-uppercase': uppercase,
      },
    )}
    {...props}
  />
);

Text.displayName = 'Text';
