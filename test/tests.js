const fs = require('fs')
    , childProcess = require('child_process')
    , expect = require('chai').expect
    , pasm = require('pasm')
    , winston = require('winston')
    , CPU = require('../src/main');

const compile = (code) => pasm.parse('[bits 16]\n' + code + '\nhlt').data

describe('Intel 8086 emulator', () => {
  let cpu = null;
  beforeEach(() => {
    cpu = new CPU({
      ignoreMagic: true,
      clockSpeed: 0,
      silent: true
    });
  });

  describe('Opcode interpreter', () => {
    describe('mov', () => {
      it('imm and registers', () => {
        cpu.boot(compile(`
          mov al, 0x2
          mov ah, 0x1
          mov ds, ax
          mov cx, ds
          mov es, cx
          mov [0x1], 0x12
        `));
        expect(cpu.registers.ds).to.equal(0x102);
        expect(cpu.registers.es).to.equal(cpu.registers.ds);
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
          cpu.boot(fd);

          /** TODO: registers check */
          winston.warn('Total exec time: ' + (Date.now() - time) + 'ms\n\n');
          done();
        });
      }
      childProcess.exec('test/bochs/build.sh', runBootsector);
    });
  });
});
