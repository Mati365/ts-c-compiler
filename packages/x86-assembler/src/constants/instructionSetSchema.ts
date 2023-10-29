import * as R from 'ramda';

import { BINARY_INSTRUCTION_DEFS } from '../assets/binaryInstructionsDefs';

import { X86TargetCPU } from '../types';
import { ASTInstructionSchema } from '../parser/ast/instruction/ASTInstructionSchema';
import {
  argMatchersFromStr,
  ASTOpcodeMatchers,
} from '../parser/ast/instruction/args/ASTInstructionArgMatchers';

const opcode = (
  mnemonic: string,
  argsSchema: string,
  binarySchema: string,
  target?: string,
) =>
  new ASTInstructionSchema(
    mnemonic,
    argMatchersFromStr(argsSchema),
    R.split(' ', binarySchema),
    X86TargetCPU[target ? `I_${R.toUpper(target)}` : 'I_186'],
  );

/**
 * @see {@link http://www.mathemainzel.info/files/x86asmref.html}
 * @see {@link https://www.polstronki.pl/AsmPrawa.php?F=B16&S=INVLPG}
 */
export const COMPILER_INSTRUCTIONS_SET: ASTOpcodeMatchers = <any>(
  R.mapObjIndexed(
    (instructions, mneomonic) =>
      R.ifElse(
        R.is(String),
        binarySchema => [opcode(mneomonic, '', binarySchema)],
        binarySchemas => {
          if (R.is(String, binarySchemas[0])) {
            binarySchemas = [binarySchemas];
          }

          return R.map(
            ([argsSchema, binarySchema, target]) =>
              opcode(mneomonic, argsSchema, binarySchema, target),
            R.sort(
              (schemaA, schemaB) => schemaA[1].length - schemaB[1].length,
              binarySchemas,
            ),
          );
        },
      )(instructions),

    <any>BINARY_INSTRUCTION_DEFS,
  )
);
