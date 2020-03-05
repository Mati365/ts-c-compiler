import React from 'react';
import ReactDOM from 'react-dom';

import {X86CPU} from '@emulator/x86-cpu/X86CPU';
import {
  BIOS,
  RTC,
  Speaker,
} from '@emulator/x86-cpu/devices';

import {OutputCanvas} from './OutputCanvas';

// 'kernels/build/mikeos/disk_images/mikeos.flp'
const fetchBinaryBuffer = (path: string = 'kernels/build/mikeos/disk_images/mikeos.flp'): Promise<ArrayBuffer> => (
  fetch(path)
    .then((r) => r.arrayBuffer())
);

export class Terminal extends React.Component {
  private cpu = new X86CPU;

  /**
   * Initialize CPU with screen
   *
   * @param {Context} canvas Screen context
   * @memberOf Terminal
   */
  initializeCPU = async (canvas: HTMLCanvasElement) => {
    this
      .cpu
      .attach(BIOS, {canvas})
      .attach(RTC)
      .attach(Speaker)
      .boot(Buffer.from(await fetchBinaryBuffer()));
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

/** Init terminal */
ReactDOM.render(
  <Terminal />,
  document.getElementById('react-root'),
);
