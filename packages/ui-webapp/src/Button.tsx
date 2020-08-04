import React from 'react';
import c from 'classnames';
import {SizeType} from './shared/types';

enum ButtonTypes {
  DEFAULT = 'default',
  PRIMARY = 'primary',
  DANGER = 'danger',
}

type ButtonProps = Omit<JSX.IntrinsicElements['button'], 'type'> & {
  type?: ButtonTypes,
  size?: SizeType,
};

export const Button = (
  {
    type = ButtonTypes.DEFAULT,
    size,
    className, ...props
  }: ButtonProps,
) => (
  <button
    type='button'
    className={c(
      'o-btn',
      className,
      `is-${type}`,
      size && `is-${size}`,
    )}
    {...props}
  />
);

Button.displayName = 'Button';

Button.Type = ButtonTypes;
