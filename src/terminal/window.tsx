import React from 'react';
import ReactDOM from 'react-dom';
import Radium from 'radium';

import {OutputCanvas} from './OutputCanvas';
import CPU from '../core/X86';
import {
  BIOS,
  RTC,
  Speaker,
} from '../core/io';

import '../assembler';

import compiled from '../../kernels/build/mikeos/disk_images/mikeos.flp';
// import compiled from '../../kernels/build/bootsec.bin';

@Radium
class Terminal extends React.Component {
  private cpu = new CPU;

  /**
   * Initialize CPU with screen
   *
   * @param {Context} canvas Screen context
   * @memberOf Terminal
   */
  initializeCPU = (canvas) => {
    this
      .cpu
      .attach(BIOS, canvas)
      .attach(RTC)
      .attach(Speaker)
      .boot(Buffer.from(compiled));
  }

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
