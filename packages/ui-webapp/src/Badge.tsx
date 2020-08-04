import React from 'react';
import c from 'classnames';

enum BadgeTypes {
  DEFAULT = 'default',
  PRIMARY = 'primary',
  DANGER = 'danger',
  WARNING = 'warning',
}

type BadgeProps = Omit<JSX.IntrinsicElements['span'], 'type'> & {
  type?: BadgeTypes,
};

export const Badge = (
  {
    type = BadgeTypes.DEFAULT,
    className, ...props
  }: BadgeProps,
) => (
  <span
    className={c(
      'o-badge',
      className,
      `is-${type}`,
    )}
    {...props}
  />
);

Badge.displayName = 'Badge';

Badge.Type = BadgeTypes;
