import React, { useRef, useEffect } from 'react';
import { Buffer } from 'buffer';
import { X86CPU, VGARenderLoopDriver } from '@ts-c-compiler/x86-cpu';

type ScreenProps = {
  binary: Buffer;
};

export const Screen = ({ binary }: ScreenProps) => {
  const screenRef = useRef<HTMLCanvasElement>();

  useEffect(() => {
    if (!screenRef.current) {
      return;
    }

    const cpu = new X86CPU();
    cpu
      .attach(VGARenderLoopDriver, {
        screenElement: screenRef.current,
        upscaleWidth: Number.parseInt(
          getComputedStyle(document.body).getPropertyValue(
            '--repl-output-width',
          ),
          10,
        ),
      })
      .boot(binary);

    return () => {
      cpu.release();
    };
  }, [screenRef.current]);

  return (
    <canvas
      ref={screenRef}
      className='block mx-auto text-center'
      style={{
        imageRendering: 'pixelated',
      }}
    />
  );
};
