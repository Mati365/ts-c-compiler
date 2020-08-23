import React, {useEffect, useRef} from 'react';
import c from 'classnames';

import {useEmulatorContext} from '@client/context/emulator-state/context';

import {Container} from '@ui/webapp';
import {X86CPU} from '@emulator/x86-cpu/X86CPU';
import {VGARenderLoopDriver} from '@emulator/x86-cpu/devices/Video/HTML/VGARenderLoopDriver';

import {ScreenHolder} from './ScreenHolder';
import {CodeEditorCard} from './CodeEditorCard';
import {CompilerToolbar} from './CompilerToolbar/CompilerToolbar';

export const EditorContainer = () => {
  const {compilerOutput} = useEmulatorContext(
    ({state}) => ({
      compilerOutput: state.compilerOutput,
    }),
  );

  const screenRef = useRef<HTMLDivElement>();
  const cpuRef = useRef<X86CPU>();
  const {asm: asmResult} = compilerOutput;

  useEffect(
    () => {
      if (!screenRef.current || !asmResult || asmResult.isErr())
        return undefined;

      const cpu = new X86CPU;
      const binary = asmResult.unwrap().output.getBinary();

      cpu
        .attach(
          VGARenderLoopDriver,
          {
            screenElement: screenRef.current,
            upscaleWidth: Number.parseInt(
              getComputedStyle(document.body).getPropertyValue('--repl-output-width'),
              10,
            ),
          },
        )
        .boot(Buffer.from(binary));

      cpuRef.current = cpu;

      return () => {
        cpu.release();
      };
    },
    [asmResult, screenRef.current],
  );

  const active = asmResult?.isOk();
  return (
    <section>
      <Container
        className={c(
          'l-repl',
          active && 'is-active',
        )}
      >
        <div className='l-repl__container'>
          <CodeEditorCard className='l-repl__editor' />
          <div
            className={c(
              'l-repl__output',
              active && 'is-active',
            )}
          >
            {active && (
              <ScreenHolder ref={screenRef} />
            )}
            <CompilerToolbar className='l-repl__toolbar' />
          </div>
        </div>
      </Container>
    </section>
  );
};

EditorContainer.displayName = 'EditorContainer';
