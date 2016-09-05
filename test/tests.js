const fs = require('fs')
    , childProcess = require('child_process')
    , expect = require('chai').expect
    , pasm = require('pasm')
    , winston = require('winston')

    /** Project classes */
    , CPU = require('../src/x86')
    , IO = require('../src/io');

const compile = (code) => {
  return pasm.parse(`
    [bits 16]
    ${code}
    hlt
  `).data
}

describe('Intel 8086 emulator', () => {
  let cpu = null;
  beforeEach(() => {
    cpu = new CPU({
      ignoreMagic: true,
      clockSpeed: 0,
      silent: true
    });
  });

  describe('Interpreter', () => {
    describe('opcodes', () => {
      it('mov imm and registers', () => {
        cpu.boot(compile(`
          xor ax, ax
          mov al, 0x0
          add al, 0x3
          sub al, 0x1
          xor bx, bx
          mov bl, al
          add bx, 0x3
          mov dx, bx
          add dl, 0xFF
          add dl, 1
        `));
        expect(cpu.registers.al).to.equal(0x2);
        expect(cpu.registers.bx).to.equal(0x5);
        expect(cpu.registers.status.cf).to.equal(0x0);
      });


      it('alu opcodes', () => {
        cpu.boot(compile(`
          xor al,cl
          and al,al
          or  al,cl
          xor ax,cx
          and cx,dx
          or  cx,dx
          xor eax,ecx
          and ecx,edx
          or  ecx,edx
          xor ax,0x1
          and ax,0x1
          or  ax,0x1
          xor cx,0x1
          and cx,0x1
          or  cx,0x1
        `));
        expect(cpu.registers.ax).to.equal(0x1);
        expect(cpu.registers.cx).to.equal(0x1);
      });
    });
  });

  describe('Binary execution', () => {
    it('exec test bootsec.bin', (done) => {
      const runBootsector = () => {
        /** Read boot device */
        fs.open('test/bochs/build/bootsec.bin', 'r', (status, fd) => {
          if (status)
            done(status.message);

          /** Exec */
          let time = Date.now();
          cpu.config = {
            ignoreMagic: true,
            clockSpeed: 0,
            silent: false
          };
          cpu
            .attach(IO.BIOS)
            .boot(fd);

          /** TODO: registers check */
          winston.warn('Total exec time: ' + (Date.now() - time) + 'ms\n\n');
          done();
        });
      }
      childProcess.exec('test/bochs/build.sh', runBootsector);
    });
  });
});
