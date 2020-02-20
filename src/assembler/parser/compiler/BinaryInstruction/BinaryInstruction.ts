import * as R from 'ramda';

import {RMByte} from '../../../../emulator/types';
import {RegisterSchema} from '../../../shared/RegisterSchema';

import {ASTInstruction} from '../../ast/Instruction/ASTInstruction';
import {ASTInstructionArg} from '../../ast/Instruction/ASTInstructionArg';
import {ASTInstructionMemArg} from '../../ast/Instruction/ASTInstructionMemArg';
import {RMAddressingMode} from '../../../types';
import {
  ParserError,
  ParserErrorCode,
} from '../../../shared/ParserError';

import {numberByteSize} from '../../../utils/numberByteSize';

const findRMArgIndex = R.findIndex<ASTInstructionArg>(
  (arg) => arg.schema.rm,
);

/**
 * Compiles single instruction into:
 *
 * @export
 * @class BinaryInstruction
 */
export class BinaryInstruction {
  private _binary: Uint8Array;

  constructor(
    public readonly ast: ASTInstruction,
  ) {
    const rmArgIndex = findRMArgIndex(ast.args);
    if (rmArgIndex !== -1)
      BinaryInstruction.encodeRMArg(ast.args, ast.args[rmArgIndex]);
  }

  get binary() { return this._binary; }

  /**
   * Gets information about SIB, Displacement and other stuff from mem arg
   *
   * @see {@link http://www.c-jump.com/CIS77/CPU/x86/lecture.html}
   *
   * @static
   * @param {ASTInstructionArg[]} args
   * @param {ASTInstructionArg} rmArg
   * @memberof BinaryInstruction
   */
  static encodeRMArg(args: ASTInstructionArg[], rmArg: ASTInstructionArg): RMByte {
    const rmByte: RMByte = {
      mod: 0,
      reg: 0,
      rm: 0,
    };

    // memory
    if (rmArg instanceof ASTInstructionMemArg) {
      const {addressDescription} = <ASTInstructionMemArg> rmArg;

      // displacement only mode, mov ax, [100]
      if (addressDescription.disp && !addressDescription.reg && !addressDescription.scale) {
        rmByte.rm = 0b101;
        rmByte.mod = RMAddressingMode.INDIRECT_ADDRESSING;

      // register indirect addressing mode, mov ax, [bx]
      } else if (addressDescription.reg && !addressDescription.disp && !addressDescription.scale) {
        rmByte.mod = RMAddressingMode.INDIRECT_ADDRESSING;

      // sib with no displacement, mov ax, [ax*4]
      } else if (addressDescription.scale && !addressDescription.disp) {
        rmByte.mod = RMAddressingMode.INDIRECT_ADDRESSING;

      // displacement one or four bytes
      } else if (addressDescription.disp) {
        const byteSize = numberByteSize(addressDescription.disp);

        rmByte.mod = (
          byteSize === 1
            ? RMAddressingMode.ONE_BYTE_SIGNED_DISP
            : RMAddressingMode.FOUR_BYTE_SIGNED_DISP
        );
      } else
        throw new ParserError(ParserErrorCode.INCORRECT_MODRM, null, {phrase: rmArg.phrase});

      // register
      if (addressDescription.reg)
        rmByte.reg = addressDescription.reg.index;

    // register mov ax, bx
    } else {
      rmByte.mod = RMAddressingMode.REG_ADDRESSING;
      rmByte.rm = (<RegisterSchema> rmArg.value).index;
    }

    console.log(rmByte); // eslint-disable-line

    return rmByte;
  }

  /**
   * Transforms instruction to binary
   *
   * @static
   * @param {ASTInstruction} ast
   * @returns {BinaryInstruction}
   * @memberof BinaryInstruction
   */
  static compile(ast: ASTInstruction): BinaryInstruction {
    return new BinaryInstruction(ast);
  }
}
