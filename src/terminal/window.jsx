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

const compiled = pasm.parse(`
  ; NASM breakpoint
  ; xchg bx, bx
  [bits 16]
  [org 0x7c00]

  jmp 0x0000:boot

  boot:
    mov ax, 0x0
    int 10

    mov ah, 0x9
    mov al, 65
    mov bh, 0
    mov bl, 0xF
    mov cx, 2
    int 10
    hlt

  times 510 - ($-$$) db 0
  dw 0xAA55
`).data;

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