import React from 'react';

import {X86CPU} from '@emulator/x86-cpu/X86CPU';
import {BIOS} from '@emulator/x86-cpu/devices';

import {OutputCanvas} from './OutputCanvas';

type TerminalProps = {
  binary: Buffer,
};

export class Terminal extends React.Component<TerminalProps> {
  private cpu = new X86CPU;

  /**
   * Initialize CPU with screen
   *
   * @param {Context} canvas Screen context
   * @memberOf Terminal
   */
  initializeCPU = async (canvas: HTMLCanvasElement) => {
    const {binary} = this.props;

    this
      .cpu
      .attach(BIOS, {canvas})
      .boot(binary);
  };

  render() {
    return (
      <div
        style={{
          width: 'inherit',
          height: 'inherit',
        }}
      >
        <OutputCanvas onContextInit={this.initializeCPU} />
      </div>
    );
  }
}
