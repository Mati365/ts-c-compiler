import React, {createRef} from 'react';

// import {X86CPU} from '@emulator/x86-cpu/X86CPU';
// import {BIOS} from '@emulator/x86-cpu/devices';
import {ScreenHolder} from './ScreenHolder';

export const ScreenCPUContainer = () => {
  const screenHolderRef = createRef<HTMLDivElement>();

  return (
    <ScreenHolder ref={screenHolderRef} />
  );
};

ScreenCPUContainer.displayName = 'ScreenCPUContainer';
