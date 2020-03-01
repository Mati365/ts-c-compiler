import * as R from 'ramda';

import BINARY_INSTRUCTION_DEFS from '../assets/binaryInstructionsDefs.json';

import {ASTInstructionSchema} from '../parser/ast/instruction/ASTInstructionSchema';
import {
  argMatchersFromStr,
  ASTOpcodeMatchers,
} from '../parser/ast/instruction/args/ASTInstructionArgMatchers';

const _op = (
  mnemonic: string,
  argsSchema: string,
  binarySchema: string,
) => new ASTInstructionSchema(
  mnemonic,
  argMatchersFromStr(argsSchema),
  R.split(' ', binarySchema),
);

/**
 * @see {@link http://www.mathemainzel.info/files/x86asmref.html}
 */
export const COMPILER_INSTRUCTIONS_SET: ASTOpcodeMatchers = <any> R.mapObjIndexed(
  (instructions, mneomonic) => R.ifElse(
    R.is(String),
    (binarySchema) => [_op(mneomonic, '', binarySchema)],
    R.map(
      ([argsSchema, binarySchema]) => _op(mneomonic, argsSchema, binarySchema),
    ),
  )(instructions),

  <any> BINARY_INSTRUCTION_DEFS,
);
