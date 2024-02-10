import { useRef, useEffect } from 'react';
import { either as E } from 'fp-ts';

import { VGARenderLoopDriver, X86CPU } from '@ts-c-compiler/x86-cpu';

import { useInstantUpdateEffect } from 'hooks';
import { useEditorState } from '../EditorStateProvider';

export const EditorScreen = () => {
  const { emulation } = useEditorState();
  const screenRef = useRef<HTMLDivElement>(null);
  const cpuRef = useRef<X86CPU>();

  useEffect(() => {
    if (!screenRef.current) {
      return;
    }

    const cpu = new X86CPU();
    cpu.attach(VGARenderLoopDriver, {
      screenElement: screenRef.current,
    });

    cpuRef.current = cpu;

    return () => {
      cpu.release();
    };
  }, []);

  useInstantUpdateEffect(() => {
    const cpu = cpuRef.current;

    if (!cpu) {
      return;
    }

    switch (emulation.info.state) {
      case 'stop':
        cpu.halt();
        break;

      case 'pause':
        cpu.freeze();
        break;

      case 'running': {
        if (E.isLeft(emulation.info.result)) {
          cpu.halt();
          return;
        }

        cpu.boot(emulation.info.result.right.blob);
        break;
      }
    }
  }, [emulation.info.state]);

  return (
    <div
      ref={screenRef}
      className="mx-auto block text-center"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
