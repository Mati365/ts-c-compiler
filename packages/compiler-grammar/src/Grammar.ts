import * as R from 'ramda';

import {safeArray} from '@compiler/core/utils/safeArray';
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
export type GrammarProduction = () => TreeNode|TreeNode[];

export type GrammarProductions = {
  [key: string]: GrammarProduction,
};

export type GrammarInitializer<TokenIdentifier> = (context: {g: Grammar<TokenIdentifier>}) => GrammarProduction;

export type GrammarConfig = {
  ignoreCase?: boolean,
  identifiers?: IdentifiersMap,
};

type GrammarMatcherInfo<TokenIdentifier> = {
  terminal?: string | TokenIdentifier,
  optional?: boolean,
  type?: TokenType,
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
  private _rootProduction: GrammarProduction;
  private _tree: TreeNode = new TreeNode(null, []);
  private _matchCallNesting: number = 0;

  constructor(
    private _config: GrammarConfig,
  ) {
    super(null);

    this._config = _config ?? {};
    this._config.ignoreCase = this._config.ignoreCase ?? true;
  }

  get tree() { return this._tree; }
  get config() { return this._config; }

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

    grammar._rootProduction = initializer(
      {
        g: grammar,
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
    const {identifiers} = this._config;

    this.tokens = Array.from(
      lexer(
        {
          identifiers,
          consumeBracketContent: false,
          allowBracketPrefixKeyword: true,
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

    this._tree = new TreeNode(
      null,
      safeArray(
        this._rootProduction(),
      ),
    );
    return this._tree;
  }

  /**
   * Matches multiple trees
   *
   * @param {GrammarProductions} productions
   * @returns {TreeNode[]}
   * @memberof Grammar
   */
  matchList(productions: GrammarProductions): TreeNode[] {
    const list: TreeNode[] = [];

    while (true) {
      const token = this.fetchRelativeToken(0, false);
      if (!token || token.type === TokenType.EOF)
        break;

      let node = this.or(productions);
      if (node) {
        if (!R.is(Array, node))
          node = [<TreeNode> node];

        (<TreeNode[]> node).forEach((listNode) => {
          if (!listNode.isEmpty())
            list.push(listNode);
        });
      } else
        break;
    }

    return list;
  }

  /**
   * Checks all production, creates tree from them
   *
   * @private
   * @type {number}
   * @memberof Grammar
   */
  or(productions: GrammarProductions): TreeNode|TreeNode[] {
    // search for matching production
    const savedIndex = this.tokenIndex;

    for (const name in productions) {
      const production = productions[name];

      try {
        this._matchCallNesting = 0;
        return production();
      } catch (e) {
        // already consumed some of instruction
        // but occurs parsing error
        if (!('code' in e) || this._matchCallNesting > 1)
          throw e;
        else
          this.tokenIndex = savedIndex;
      }
    }

    throw new SyntaxError;
  }

  /**
   * Match single token or group of tokens
   *
   * @param {GrammarMatcherInfo<TokenIdentifier>} {
   *       terminal,
   *       type = TokenType.KEYWORD,
   *     }
   * @returns {Token}
   * @memberof Grammar
   */
  match(
    {
      terminal = null,
      type = TokenType.KEYWORD,
      optional,
    }: GrammarMatcherInfo<TokenIdentifier> = {},
  ): Token {
    this._matchCallNesting++;

    // check if exists occurs when check types
    // throws error anyway because null token mismatch type
    const {ignoreCase} = this._config;
    const token: Token = this.fetchRelativeToken(0, false);

    if (token?.type !== type || (terminal !== null && ((ignoreCase ? token.lowerText : token.text) !== terminal))) {
      if (optional)
        return null;

      throw new SyntaxError;
    }

    this.consume();
    return token;
  }

  /**
   * Matches token defined in identifiers list
   *
   * @param {TokenIdentifier} identifier
   * @returns {Token}
   * @memberof Grammar
   */
  identifier(identifier: TokenIdentifier): Token {
    this._matchCallNesting++;

    const token: Token = this.fetchRelativeToken(0, false);
    if (token.kind !== TokenKind.IDENTIFIER || token.value !== identifier)
      throw new SyntaxError;

    this.consume();
    return token;
  }
}
