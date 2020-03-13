import * as R from 'ramda';

import {lexer, IdentifiersMap} from '@compiler/lexer/lexer';
import {
  TokenType,
  Token,
  NumberToken,
  FloatNumberToken,
  TokenKind,
} from '@compiler/lexer/tokens';

import {TokensIterator} from './tree/TokensIterator';
import {GrammarErrorCode, GrammarError} from './GrammarError';
import {TreeNode} from './tree/TreeNode';

export class SyntaxError extends GrammarError {
  constructor() {
    super(GrammarErrorCode.SYNTAX_ERROR);
  }
}

/** Basic type config */
export type GrammarProduction = () => TreeNode;

export type GrammarProductions = {
  [key: string]: GrammarProduction,
};

export type GrammarMatcher<TokenIdentifier> = (terminal: string|TokenIdentifier, type?: TokenType) => Token;

export type GrammarInitializer<TokenIdentifier> = (context: {
  grammar: Grammar<TokenIdentifier>,
  m: GrammarMatcher<TokenIdentifier>,
}) => GrammarProductions;

export type GrammarConfig = {
  ignoreCase?: boolean,
  identifiers?: IdentifiersMap,
};

/**
 * Creates simple parse tree based on grammar creator
 *
 * @see
 *  Predictive parser
 *
 * @export
 * @class Grammar
 * @extends {TokensIterator}
 * @template IdentifierType
 */
export class Grammar<TokenIdentifier> extends TokensIterator {
  private _productions: GrammarProductions;
  private _tree: TreeNode = new TreeNode(null, []);

  constructor(
    private config: GrammarConfig,
  ) {
    super(null);

    this.config = config ?? {};
    this.config.ignoreCase = this.config.ignoreCase ?? true;
  }

  get productions() { return this._productions; }
  get tree() { return this._tree; }

  /**
   * Creates grammar
   *
   * @static
   * @template TokenIdentifier
   * @param {GrammarConfig} config
   * @param {GrammarInitializer<TokenIdentifier>} initializer
   * @returns {Grammar<TokenIdentifier>}
   * @memberof Grammar
   */
  static build<TokenIdentifier>(
    config: GrammarConfig,
    initializer: GrammarInitializer<TokenIdentifier>,
  ): Grammar<TokenIdentifier> {
    const grammar = new Grammar<TokenIdentifier>(config);

    grammar._productions = initializer(
      {
        m: grammar.match,
        grammar,
      },
    );

    return grammar;
  }

  /**
   * Produces grammar tree
   *
   * @param {string} code
   * @returns {TreeNode}
   * @memberof Grammar
   */
  process(code: string): TreeNode {
    const {productions, tree} = this;
    const {identifiers} = this.config;

    this.tokens = Array.from(
      lexer(
        {
          identifiers,
          signOperatorsAsSeparateTokens: true,
          tokensParsers: {
            [TokenType.NUMBER]: NumberToken.parse,
            [TokenType.FLOAT_NUMBER]: FloatNumberToken.parse,
            [TokenType.KEYWORD]: R.T,
          },
        },
        code,
      ),
    );

    tree.children = [];
    while (true) {
      const token = this.fetchRelativeToken(0, false);
      if (!token || token.type === TokenType.EOF)
        break;

      const node = this.or(productions);
      if (node)
        tree.children.push(node);
    }

    return tree;
  }

  /**
   * Checks all production, creates tree from them
   *
   * @param {GrammarProductions} productions
   * @returns {TreeNode}
   * @memberof Grammar
   */
  private matchCallNesting: number = 0;

  or(productions: GrammarProductions): TreeNode {
    for (const name in productions) {
      const production = productions[name];

      try {
        this.matchCallNesting = 0;
        return production();
      } catch (e) {
        // already consumed some of instruction
        // but occurs parsing error
        if (!('code' in e) || this.matchCallNesting > 1)
          throw e;
      }
    }

    throw new SyntaxError;
  }

  /**
   * Match single token or group of tokens
   *
   * @private
   * @type {GrammarMatcher<TokenIdentifier>}
   * @memberof Grammar
   */
  private match: GrammarMatcher<TokenIdentifier> = (
    terminal: string | TokenIdentifier,
    type: TokenType = TokenType.KEYWORD,
  ): Token => {
    this.matchCallNesting++;

    // check if exists occurs when check types
    // throws error anyway because null token mismatch type
    const {ignoreCase} = this.config;
    let token: Token = null;

    do {
      token = this.fetchRelativeToken(0, false);

      if (token.type === TokenType.EOL)
        this.consume();
      else
        break;
    } while (true);

    if (token?.type !== type)
      throw new SyntaxError;

    if (token.kind === TokenKind.IDENTIFIER) {
      if (token.value !== terminal)
        throw new SyntaxError;

    // kill mathcher if error occurs
    // if terminal is null - match only type
    } else if (terminal !== null && ((ignoreCase ? token.lowerText : token.text) !== terminal))
      throw new SyntaxError;

    this.consume();
    return token;
  };
}
