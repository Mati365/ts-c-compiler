import { useRef, useEffect } from 'react';
import { either as E } from 'fp-ts';
import clsx from 'clsx';

import { useConstRefCallback, useUpdateEffect } from '@under-control/forms';
import { VGARenderLoopDriver, X86CPU } from '@ts-c-compiler/x86-cpu';

import { useEditorState } from '../EditorStateProvider';

export const EditorScreen = () => {
  const { emulation } = useEditorState();
  const screenRef = useRef<HTMLDivElement>(null);
  const cpuRef = useRef<X86CPU | null>();

  const onHalt = useConstRefCallback(() => {
    emulation.stop();
  });

  const shutdownCPU = () => {
    cpuRef.current?.halt();
  };

  const destroyCPU = () => {
    if (!cpuRef.current) {
      return null;
    }

    cpuRef.current.release();
    cpuRef.current = null;
  };

  const resetCPU = () => {
    destroyCPU();

    if (!screenRef.current) {
      return;
    }

    const cpu = new X86CPU({
      handle: {
        onHalt,
      },
    });

    cpu.attach(VGARenderLoopDriver, {
      screenElement: screenRef.current,
    });

    cpuRef.current = cpu;
    return cpu;
  };

  useEffect(
    () => () => {
      destroyCPU();
    },
    [],
  );

  useUpdateEffect(() => {
    switch (emulation.info.state) {
      case 'stop':
        shutdownCPU();
        break;

      case 'pause':
        cpuRef.current?.freeze();
        break;

      case 'running': {
        if (E.isLeft(emulation.info.result)) {
          destroyCPU();
          return;
        }

        resetCPU()?.boot(emulation.info.result.right.blob);
        break;
      }
    }
  }, [emulation.info.state]);

  return (
    <div
      ref={screenRef}
      style={{ imageRendering: 'pixelated' }}
      className={clsx(
        'mx-auto block text-center',
        emulation.info.state === 'stop' && 'opacity-30',
      )}
    />
  );
};
