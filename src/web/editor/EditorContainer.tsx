import React, { useRef, useEffect, useState } from 'react';
import { Buffer } from 'buffer';

import { X86CPU } from '@x86-toolkit/cpu/X86CPU';
import { VGARenderLoopDriver } from '@x86-toolkit/cpu/devices/Video/HTML/VGARenderLoopDriver';

import { ScreenHolder } from './parts';
import { compileBootsecC } from '../utils';

export const EditorContainer = () => {
  const screenRef = useRef<HTMLDivElement>();
  const cpuRef = useRef<X86CPU>();
  const [asmResult] = useState(() =>
    compileBootsecC(/* c */ `
      struct Vec2 {
        int x, y;
      };

      void inc(struct Vec2* vec, int k) {
        vec->y += 3 + k;
        vec->y--;
      }

      int main() {
        int a = 1;
        struct Vec2 vec = { .x = 5, .y = 11 };
        inc(&vec, 10);

        a = vec.y;
        asm('xchg dx, dx');
        return a;
      }
    `),
  );

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
