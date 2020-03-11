import {isWhitespace} from '@compiler/lexer/utils/matchCharacter';

import {TokensIterator} from '@compiler/grammar/tree/TokensIterator';
import {Token, TokenType} from '@compiler/lexer/tokens';
import {Result, err, ok} from '@compiler/core/monads/Result';
import {CompilerError} from '@compiler/core/shared/CompilerError';

import {ParserError, ParserErrorCode} from '../../shared/ParserError';
import {ASTAsmNode} from './ASTAsmNode';

export type TokensList = Token[]|IterableIterator<Token>;

/**
 * @todo
 *  Add more metadata about tree
 *
 * @export
 * @class ASTAsmTree
 */
export class ASTAsmTree {
  constructor(
    public astNodes: ASTAsmNode[] = [],
  ) {}
}

export type ASTInstructionParser = {
  parse(token: Token, parser: ASTAsmParser, tree: ASTAsmTree): ASTAsmNode;
};

/**
 * Creates tree from provided tokens
 *
 * @export
 * @class ASTAsmParser
 * @extends {TokensIterator}
 */
export class ASTAsmParser extends TokensIterator {
  constructor(
    private nodeParsers: ASTInstructionParser[],
    tokensIterator: TokensList,
  ) {
    super(
      'length' in tokensIterator
        ? <Token[]> tokensIterator
        : Array.from(tokensIterator),
    );
  }

  getParsers() { return this.nodeParsers; }

  /**
   * Creates clone of ASTAsmParser but with new tokens list,
   * used in some nested parsers like TIMES
   *
   * @param {TokensList} tokensIterator
   * @memberof ASTAsmParser
   */
  fork(tokensIterator: TokensList): ASTAsmParser {
    return new ASTAsmParser(this.nodeParsers, tokensIterator);
  }

  /**
   * Fetches array of matched instructions, labels etc
   *
   * @returns {Result<ASTAsmTree, CompilerError[]>}
   * @memberof ASTAsmParser
   */
  getTree(): Result<ASTAsmTree, CompilerError[]> {
    const {nodeParsers} = this;
    const tree = new ASTAsmTree;
    const errors: CompilerError[] = [];

    this.iterate(
      (token) => {
        let tokenParsed = false;

        if (token.type === TokenType.EOF)
          return false;

        for (let j = 0; j < nodeParsers.length; ++j) {
          try {
            const astNode = nodeParsers[j].parse(token, this, tree);

            if (astNode) {
              tree.astNodes.push(astNode);
              tokenParsed = true;
              break;
            }
          } catch (e) {
            e.loc = token.loc;
            errors.push(e);
          }
        }

        if (!tokenParsed && !isWhitespace(<string> token.text)) {
          errors.push(
            new ParserError(
              ParserErrorCode.UNKNOWN_OPERATION,
              token.loc,
              {
                operation: token.text,
              },
            ),
          );
        }

        return true;
      },
    );

    return (
      errors.length
        ? err(errors)
        : ok(tree)
    );
  }
}
