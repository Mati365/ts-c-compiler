import { useRef, useEffect } from 'react';
import { Buffer } from 'buffer';
import { X86CPU, VGARenderLoopDriver } from '@ts-c-compiler/x86-cpu';
import { ScreenCanvasWrapper, ScreenWrapper } from './Screen.styled';

type ScreenProps = {
  binary: number[];
};

export const Screen = ({ binary }: ScreenProps) => {
  const screenRef = useRef<HTMLDivElement>();

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
      .boot(Buffer.from(binary));

    return () => {
      cpu.release();
    };
  }, [screenRef.current]);

  return (
    <ScreenWrapper>
      <ScreenCanvasWrapper ref={screenRef} />
    </ScreenWrapper>
  );
};
