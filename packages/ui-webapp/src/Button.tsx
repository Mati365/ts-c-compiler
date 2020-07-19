import React from 'react';
import c from 'classnames';

enum ButtonTypes {
  DEFAULT = 'default',
  PRIMARY = 'primary',
  DANGER = 'danger',
}

type ButtonProps = Omit<JSX.IntrinsicElements['button'], 'type'> & {
  type?: ButtonTypes,
};

export const Button = (
  {
    type = ButtonTypes.DEFAULT,
    className, ...props
  }: ButtonProps,
) => (
  <button
    type='button'
    className={c(
      'o-btn',
      className,
      `is-${type}`,
    )}
    {...props}
  />
);

Button.displayName = 'Button';

Button.Type = ButtonTypes;
