import React, {useEffect, useRef} from 'react';
import c from 'classnames';

import {useEmulatorContext} from '@client/context/emulator-state/context';

import {Container} from '@ui/webapp';
import {
  X86CPU,
  VGARenderLoopDriver,
  binaryToFloppy35Buffer,
} from '@emulator/x86-cpu';

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
        .boot(binaryToFloppy35Buffer(binary));

      cpuRef.current = cpu;

      return () => {
        cpu.release();
      };
    },
    [asmResult, screenRef.current],
  );

  return (
    <section>
      <Container
        className={c(
          'l-repl',
          asmResult && 'is-active',
        )}
      >
        <div className='l-repl__container'>
          {asmResult && (
            <div
              className={c(
                'l-repl__output',
                asmResult && 'is-active',
              )}
            >
              {asmResult.isOk() && (
                <ScreenHolder ref={screenRef} />
              )}
              <CompilerToolbar className='l-repl__toolbar' />
            </div>
          )}
          <CodeEditorCard className='l-repl__editor' />
        </div>
      </Container>
    </section>
  );
};

EditorContainer.displayName = 'EditorContainer';
