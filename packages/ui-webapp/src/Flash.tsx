import React from 'react';
import c from 'classnames';

enum FlashTypes {
  DEFAULT = 'default',
  PRIMARY = 'primary',
  DANGER = 'danger',
}

type FlashProps = Omit<JSX.IntrinsicElements['div'], 'type'> & {
  type?: FlashTypes,
};

export const Flash = (
  {
    type = FlashTypes.DEFAULT,
    className,
    ...props
  }: FlashProps,
) => (
  <div
    className={c(
      'c-flash',
      className,
      `is-${type}`,
    )}
    {...props}
  />
);

Flash.displayName = 'Flash';

Flash.Type = FlashTypes;
