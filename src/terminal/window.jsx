import React from 'react';
import ReactDOM from 'react-dom';
import Radium from 'radium';

import Output from './output';
import CPU from '../core/x86';
import * as IO from '../core/io';

import '../assembler';
import compiled from '../../kernels/build/mikeos/disk_images/mikeos.flp';
// import compiled from '../../kernels/build/bootsec.bin';

@Radium
class Terminal extends React.Component {
  componentWillMount() {
    this.cpu = new CPU;
  }

  /**
   * Initialize CPU with screen
   *
   * @param {Context} canvas Screen context
   * @memberOf Terminal
   */
  initializeCPU = (canvas) => {
    this.cpu
      .attach(IO.BIOS, canvas)
      .attach(IO.RTC)
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
        <Output onContextInit={this.initializeCPU} />
      </div>
    );
  }
}

/** Init terminal */
ReactDOM.render(
  <Terminal />,
  document.getElementById('react-root'),
);
