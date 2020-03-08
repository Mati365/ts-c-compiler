import {X87RegName} from '@emulator/x86-cpu/x87/X87Regs';
import {reduceRegSchemaStore} from './x86';

/**
 * FPU Reg schema
 *
 * @export
 * @class X87StackRegisterSchema
 */
export class X87StackRegisterSchema {
  constructor(
    public readonly mnemonic: X87RegName,
    public readonly index: number,
  ) {}

  toString() {
    return this.mnemonic;
  }
}

export type X87RegisterSchema = X87StackRegisterSchema;

export const X87_COMPILER_REGISTERS_SET = reduceRegSchemaStore(
  [
    new X87StackRegisterSchema('st0', 0x0),
    new X87StackRegisterSchema('st1', 0x1),
    new X87StackRegisterSchema('st2', 0x2),
    new X87StackRegisterSchema('st3', 0x3),
    new X87StackRegisterSchema('st4', 0x4),
    new X87StackRegisterSchema('st5', 0x5),
    new X87StackRegisterSchema('st6', 0x6),
    new X87StackRegisterSchema('st7', 0x7),
  ],
);
