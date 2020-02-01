import {InstructionSchema, COMPILER_INSTRUCTIONS_SET} from '../../constants/instructionSetSchema';

import {ASTParser} from './ASTParser';
import {
  KindASTNode,
  ASTNodeLocation,
} from './ASTNode';

import {
  TokenType,
  Token,
} from '../lexer/tokens';

/**
 * Parser for:
 * [opcode] [arg1] [arg2] [argX]
 *
 * @export
 * @class ASTInstruction
 * @extends {KindASTNode('Instruction')}
 */
export class ASTInstruction extends KindASTNode('Instruction') {
  public schema: InstructionSchema;

  constructor(schema: InstructionSchema, loc: ASTNodeLocation) {
    super(loc);
    this.schema = schema;
  }

  /**
   * Returns instruction
   *
   * @static
   * @param {Token} token
   * @param {Object} recursiveParseParams
   *
   * @returns ASTInstruction
   * @memberof ASTInstruction
   */
  static parse(token: Token, parser: ASTParser): ASTInstruction {
    if (token.type !== TokenType.KEYWORD)
      return null;

    const schema = COMPILER_INSTRUCTIONS_SET[token.text];
    if (!schema)
      return null;

    const args = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // value
      args.push(
        parser.fetchNextToken(1, true),
      );

      // comma
      const commaToken = parser.fetchNextToken();
      if (commaToken?.type !== TokenType.COMMA)
        break;
    }

    return new ASTInstruction(
      schema[0],
      new ASTNodeLocation(token.loc, token.loc),
    );
  }
}
