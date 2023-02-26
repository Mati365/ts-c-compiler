import React, { forwardRef } from 'react';

export const ScreenHolder = forwardRef<
  HTMLDivElement,
  JSX.IntrinsicElements['div']
>((props, ref) => (
  <div
    {...props}
    ref={ref}
    style={{
      display: 'block',
      margin: '0 auto',
      imageRendering: 'pixelated',
      textAlign: 'center',
    }}
  />
));
