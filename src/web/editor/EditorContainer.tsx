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
      int strlen(const char* str) {
        for (int i = 0;;++i) {
          if (*(str + i) == 0) {
            return i;
          }
        }

        return 0;
      }

      int sum(int a, int b) {
        return a + b;
      }

      int max(int a, int b) {
        if (a > b) {
          return a;
        }

        return b;
      }

      int min(int a, int b) {
        if (b > a) {
          return a;
        }

        return b;
      }

      struct Vec2 {
        int x, y, z, w;
      };

      struct Vec2 make_vec(int a, int b) {
        struct Vec2 v = { .x = a * 2, .y = b };
        return v;
      }

      int magic_shit() {
        struct Vec2 v = make_vec(6, 2);
        int k = v.x + v.y;
        int length = sum(2, 3) + strlen("Hello world!") + sum(5, 5) + max(1, 2) + min(10, 1) + k;
        int j = 66;

        if (v.x + v.y > 10) {
          j += 2 + k;
        }

        if (length == 44) {
          j += 2;
        }

        return j;
      }

      void main() {
        int k = magic_shit() * 2;
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
