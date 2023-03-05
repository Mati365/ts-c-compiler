import React, { useRef, useEffect, useState } from 'react';
import { Buffer } from 'buffer';

import { X86CPU } from '@x86-toolkit/cpu/X86CPU';
import { VGARenderLoopDriver } from '@x86-toolkit/cpu/devices/Video/HTML/VGARenderLoopDriver';

import { ScreenHolder } from './parts';
import { compileBootsecC } from '../utils';
import { MOCK_C_FILE } from '../../shared';

export const EditorContainer = () => {
  const screenRef = useRef<HTMLDivElement>();
  const cpuRef = useRef<X86CPU>();
  const [asmResult] = useState(() => compileBootsecC(MOCK_C_FILE));

  useEffect(() => {
    if (!screenRef.current) {
      return;
    }

    const cpu = new X86CPU();
    const binary = asmResult?.output.getBinary();

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

    cpuRef.current = cpu;

    return () => {
      cpu.release();
    };
  }, [asmResult, screenRef.current]);

  return <ScreenHolder ref={screenRef} />;
};
