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

@Radium
class Terminal extends React.Component {
  /**
   * Initialize CPU with screen
   *
   * @param {Context} ctx Screen context
   * @memberOf Terminal
   */
  initializeCPU(ctx) {
    new CPU()
      .attach(IO.BIOS)
      .attach(IO.Screen, ctx);
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