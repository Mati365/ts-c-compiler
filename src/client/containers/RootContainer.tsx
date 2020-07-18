import React, {useEffect, useRef} from 'react';

import {X86CPU} from '@emulator/x86-cpu/X86CPU';
import {VGARenderLoopDriver} from '@emulator/x86-cpu/devices/Video/HTML/VGARenderLoopDriver';
import {ScreenHolder} from './ScreenHolder';

import {useEmulatorContext} from '../context/emulator-state/context';

export const RootContainer = () => {
  const {compilerOutput} = useEmulatorContext(
    ({state}) => ({
      compilerOutput: state.compilerOutput,
    }),
  );

  const screenRef = useRef<HTMLDivElement>();
  const cpuRef = useRef<X86CPU>();

  useEffect(
    () => {
      if (compilerOutput.asm.isErr())
        return undefined;

      const cpu = new X86CPU;
      const binary = compilerOutput.asm.unwrap().output.getBinary();

      cpu
        .attach(VGARenderLoopDriver, {screenElement: screenRef.current})
        .boot(Buffer.from(binary));

      cpuRef.current = cpu;

      return () => {
        cpu.release();
      };
    },
    [compilerOutput.asm],
  );

  return (
    <ScreenHolder ref={screenRef} />
  );
};

RootContainer.displayName = 'RootContainer';
