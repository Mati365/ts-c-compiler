import React, {useEffect, useRef} from 'react';

import {Container, Card, CardType} from '@ui/webapp-scss';

import {X86CPU} from '@emulator/x86-cpu/X86CPU';
import {VGARenderLoopDriver} from '@emulator/x86-cpu/devices/Video/HTML/VGARenderLoopDriver';
import {ScreenHolder} from './ScreenHolder';
import {CodeEditor} from '../components/CodeEditor';

import {useEmulatorContext} from '../context/emulator-state/context';

export const RootContainer = () => {
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
      if (!asmResult || asmResult.isErr())
        return undefined;

      const cpu = new X86CPU;
      const binary = asmResult.unwrap().output.getBinary();

      cpu
        .attach(VGARenderLoopDriver, {screenElement: screenRef.current})
        .boot(Buffer.from(binary));

      cpuRef.current = cpu;

      return () => {
        cpu.release();
      };
    },
    [asmResult],
  );

  return (
    <section>
      <Container className='l-repl-container'>
        <Card
          header='Play'
          contentSpaced={false}
        >
          <CodeEditor />
        </Card>

        <Card
          type={CardType.PRIMARY}
          header='ABCdef'
        >
          <ScreenHolder ref={screenRef} />
        </Card>
      </Container>
    </section>
  );
};

RootContainer.displayName = 'RootContainer';
