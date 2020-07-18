import React, {forwardRef, DetailedHTMLProps, HTMLAttributes} from 'react';

type HTMLDivElementProps = DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

export const ScreenHolder = forwardRef<HTMLDivElement, HTMLDivElementProps>((props, ref) => (
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
