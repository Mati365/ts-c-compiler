import React from 'react';
import c from 'classnames';

export const Container = ({className, ...props}: JSX.IntrinsicElements['div']) => (
  <div
    className={c('l-container', className)}
    {...props}
  />
);

Container.displayName = 'Container';
