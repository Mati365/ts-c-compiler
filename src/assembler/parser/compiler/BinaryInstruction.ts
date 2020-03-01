import * as R from 'ramda';

import {RMByte, X86AbstractCPU} from '../../../emulator/types';
import {RegisterSchema} from '../../shared/RegisterSchema';

import {ASTInstruction} from '../ast/instruction/ASTInstruction';
import {
  ASTInstructionArg,
  ASTInstructionMemPtrArg,
} from '../ast/instruction/args';

import {
  RMAddressingMode,
  InstructionArgSize,
  BRANCH_ADDRESSING_SIZE_MAPPING,
} from '../../types';

import {
  ParserError,
  ParserErrorCode,
} from '../../shared/ParserError';

import {X86Compiler} from './compile';
import {BinaryBlob} from './BinaryBlob';

import {roundToPowerOfTwo} from '../../utils/numberByteSize';
import {
  extractNthByte,
  findMatchingMemAddressingRMByte,
  findMatchingSregPrefix,
} from './utils';

/**
 * Compiles single instruction into:
 *
 * @export
 * @class BinaryInstruction
 */
export class BinaryInstruction extends BinaryBlob<ASTInstruction> {
  private _rmByte: RMByte;

  get rmByte() { return this._rmByte; }

  /**
   * Transforms provided AST instruction into binary
   *
   * @param {X86Compiler} compiler
   * @param {number} offset
   * @returns {BinaryInstruction}
   * @memberof BinaryInstruction
   */
  compile(compiler: X86Compiler, offset: number): BinaryInstruction {
    const {ast} = this;
    const [primarySchema] = ast.schemas;

    const binary: number[] = [];
    const binaryPrefixes: number[] = [];

    const [memArg, rmArg, immArg] = [ast.memArgs[0], ast.findRMArg(), ast.numArgs[0]];
    const rmByte = rmArg && BinaryInstruction.encodeRMByte(
      compiler.mode,
      R.find(
        (arg) => arg !== <ASTInstructionArg> rmArg,
        ast.regArgs,
      ),
      rmArg,
    );

    // todo: check if it is only available in addressing mode
    if (memArg?.addressDescription) {
      const {addressDescription} = memArg;
      const {sreg} = addressDescription;

      // check if excedding, only if RM byte present, moffset can be bigger
      if (!memArg.schema?.moffset && addressDescription.dispByteSize > memArg.byteSize) {
        throw new ParserError(
          ParserErrorCode.DISPLACEMENT_EXCEEDING_BYTE_SIZE,
          null,
          {
            address: memArg.phrase,
            byteSize: addressDescription.dispByteSize,
            maxSize: memArg.byteSize,
          },
        );
      }

      // minimum displacement size for JMP far
      // nasm produces minimum 16bit offset
      // dont know why, maybe because IMM value
      // must be at least as big as IP register?
      // todo: check it
      if (ast.jumpInstruction && !R.isNil(addressDescription.dispByteSize)) {
        addressDescription.dispByteSize = Math.max(
          ast.branchAddressingType
            ? BRANCH_ADDRESSING_SIZE_MAPPING[ast.branchAddressingType]
            : memArg.byteSize,

          addressDescription.dispByteSize,
        );
      }

      // sreg override
      if (sreg) {
        const sregPrefix = findMatchingSregPrefix(sreg);
        if (R.isNil(sregPrefix)) {
          throw new ParserError(
            ParserErrorCode.INCORRECT_SREG_OVERRIDE,
            null,
            {
              sreg: sreg.mnemonic,
            },
          );
        } else
          binaryPrefixes.push(sregPrefix);
      }
    }

    // full instruction code
    primarySchema.binarySchema.forEach(
      (schema) => {
        switch (schema) {
          // far jump
          case 's0': case 's1':
            binary.push(
              extractNthByte(
                +schema[1],
                ast.segMemArgs[0].value.segment.number,
              ),
            );
            break;

          case 'o0': case 'o1': case 'o2': case 'o3':
            binary.push(
              extractNthByte(
                +schema[1],
                ast.segMemArgs[0].value.offset.number,
              ),
            );
            break;

          // relative jump
          case 'r0': case 'r1': {
            const addrArg = ast.relAddrArgs[0];
            if (addrArg) {
              const relAddress = (<number> addrArg.value) - offset - ast.schemas[0].byteSize;

              binary.push(
                X86AbstractCPU.toUnsignedNumber(
                  extractNthByte(+schema[1], relAddress),
                  <any> addrArg.byteSize,
                ),
              );
            } else
              binary.push(0x0); // pessimistic stage
          } break;

          // immediate
          case 'i0': case 'i1': case 'i2': case 'i3':
            if (R.isNil(immArg))
              throw new ParserError(ParserErrorCode.MISSING_IMM_ARG_DEF);

            binary.push(
              extractNthByte(+schema[1], <number> immArg.value),
            );
            break;

          // displacement
          case 'd0': case 'd1': case 'd2': case 'd3': {
            // it can be also moffs arg, so do not use rmArg
            if (!memArg) {
              // register addressing, mov ax, bx
              if (rmByte)
                return;

              throw new ParserError(ParserErrorCode.MISSING_MEM_ARG_DEF);
            }

            const {addressDescription} = memArg;
            if (addressDescription && addressDescription.disp !== null) {
              const byteOffset = +schema[1];

              // destination without mod rm byte always produces exactly
              // equal number of bytes of displacement, see nasm
              if (!memArg.schema.rm || byteOffset < addressDescription.dispByteSize) {
                binary.push(
                  extractNthByte(byteOffset, addressDescription.disp),
                );
              }
            }
          } break;

          // RM byte
          case 'mr':
          case '/0': case '/1': case '/2': case '/3':
          case '/4': case '/5': case '/6': case '/7':
            if (!rmByte)
              throw new ParserError(ParserErrorCode.MISSING_RM_BYTE_DEF);

            // reg byte override
            if (schema[0] === '/')
              rmByte.reg = +schema[1];

            binary.push(rmByte.byte);
            this._rmByte = rmByte;
            break;

          // emit binary number
          default: {
            const binNumber = Number.parseInt(schema, 16);
            if (Number.isNaN(binNumber))
              throw new ParserError(ParserErrorCode.UNKNOWN_BINARY_SCHEMA_DEF, null, {schema});

            binary.push(binNumber);
          }
        }
      },
    );

    this._binary = [...binaryPrefixes, ...binary];
    return this;
  }

  /**
   * Gets information about SIB, Displacement and other stuff from mem arg
   * Intel docs:
   * Table 2-1. 16-Bit Addressing Forms with the ModR/M Byte
   *
   * @see {@link http://www.c-jump.com/CIS77/CPU/x86/lecture.html}
   * @see {@link https://board.flatassembler.net/topic.php?t=6823}
   *
   * @static
   * @param {InstructionArgSize} mode
   * @param {ASTInstructionArg} regArg
   * @param {ASTInstructionArg} rmArg
   * @returns {RMByte}
   * @memberof BinaryInstruction
   */
  static encodeRMByte(
    mode: InstructionArgSize,
    regArg: ASTInstructionArg,
    rmArg: ASTInstructionArg,
  ): RMByte {
    const rmByte = new RMByte(0, 0, 0);

    // memory
    if (rmArg instanceof ASTInstructionMemPtrArg) {
      const {addressDescription} = <ASTInstructionMemPtrArg> rmArg;
      const dispByteSize = (
        R.isNil(addressDescription.disp)
          ? null
          : roundToPowerOfTwo(addressDescription.dispByteSize)
      );

      const [mod, rm] = findMatchingMemAddressingRMByte(
        mode,
        addressDescription.reg?.mnemonic,
        addressDescription.scale?.reg.mnemonic,
        dispByteSize,
      ) || [];

      if (R.isNil(mod) && R.isNil(rm))
        throw new ParserError(ParserErrorCode.INVALID_ADDRESSING_MODE);

      rmByte.mod = mod;
      rmByte.rm = rm;
    } else {
      rmByte.mod = RMAddressingMode.REG_ADDRESSING;
      rmByte.rm = (<RegisterSchema> rmArg.value).index;
    }

    if (regArg) {
      // register mov ax, bx
      if (!rmArg)
        rmByte.mod = RMAddressingMode.REG_ADDRESSING;

      rmByte.reg = (<RegisterSchema> regArg.value).index;
    }

    return rmByte;
  }
}
