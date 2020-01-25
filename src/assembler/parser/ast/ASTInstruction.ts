import INSTRUCTION_SET_SCHEMA from '../../constants/instructionSetSchema';
import {TOKEN_TYPES} from '../lexer/Token';

import ASTNode from './ASTNode';

// import * as R from 'ramda';

export default class ASTInstruction extends ASTNode('Instruction') {
  constructor(schema, loc, args) {
    super(loc);

    this.loc = loc;
    this.schema = schema;
    this.args = args;
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
  static parse(token, {fetchNextToken}) {
    if (token.type !== TOKEN_TYPES.KEYWORD)
      return null;

    const schema = INSTRUCTION_SET_SCHEMA[token.text];
    if (!schema)
      return null;

    const args = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // value
      args.push(
        fetchNextToken(1, true),
      );

      // comma
      const commaToken = fetchNextToken();
      if (commaToken?.type !== TOKEN_TYPES.COMMA)
        break;
    }

    console.log(args);
    return new ASTInstruction(
      schema,
      {
        start: token.loc,
        end: token.loc,
      },
      args,
    );
  }
}
