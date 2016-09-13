/**
 * Terminal component
 */
const React = require('react')
    , ReactDOM = require('react-dom')
    , Radium = require('radium')

    /** Custom components */
    , Titlebar = require('./titlebar.jsx')
    , Output = require('./output.jsx')

    /** CPU */
    , CPU = require('../core/x86')
    , IO = require('../core/io');

const compiled = pasm.parse(require('raw!../../test/bochs/asm/bootsec.asm')).data;

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
  initializeCPU(canvas) {
    this.cpu
      .attach(IO.BIOS, canvas)
      .boot(compiled);
  }
  render() {
    return (
      <div style={styles}>
        <Titlebar />
        <Output onContextInit={this.initializeCPU.bind(this)} />
      </div>
    );
  }
}

const styles = {
  width: 'inherit',
  height: 'inherit'
};

/** Init terminal */
ReactDOM.render(
  <Terminal />,
  document.getElementById('react-root')
);