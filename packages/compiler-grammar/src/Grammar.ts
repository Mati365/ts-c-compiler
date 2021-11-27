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
export type GrammarCheckListBreak = {
  continue?: boolean,
};

export type GrammarProduction<K> = () => GrammarCheckListBreak | (TreeNode<K> | TreeNode<K>[] | {});

export type GrammarProductions<K> = {
  [key: string]: GrammarProduction<K>,
};

export type GrammarInitializer<I, K> = (
  context: {
    g: Grammar<I, K>
  }
) => GrammarProduction<K>;

export type GrammarConfig = {
  ignoreCase?: boolean,
  identifiers?: IdentifiersMap,
  ignoreMatchCallNesting?: boolean,
};

type GrammarMatcherInfo<I> = {
  terminal?: string | I,
  optional?: boolean,
  type?: TokenType,
  kind?: TokenKind,
  types?: TokenType[],
  consume?: boolean,
  ignoreMatchNesting?: boolean,
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
 * @template I Identifier
 * @template K NodeKind
 */
export class Grammar<I, K = string> extends TokensIterator {
  private _rootProduction: GrammarProduction<K>;
  private _tree: TreeNode<K> = new TreeNode<K>(null, null, []);
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
   * @template I
   * @template K
   * @param {GrammarConfig} config
   * @param {GrammarInitializer<I, K>} initializer
   * @returns {Grammar<I, K>}
   * @memberof Grammar
   */
  static build<I, K>(config: GrammarConfig, initializer: GrammarInitializer<I, K>): Grammar<I, K> {
    const grammar = new Grammar<I, K>(config);

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
   * @param {string|Token[]} code
   * @returns {TreeNode}
   * @memberof Grammar
   */
  process(code: string|Token[]): TreeNode<K> {
    if (R.is(String, code)) {
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
          <string> code,
        ),
      );
    } else
      this.tokens = <Token[]> code;

    try {
      // this.tokenIndex = 0;
      // this._matchCallNesting = 0;
      this._tree = new TreeNode<K>(
        <any> 'Root',
        null,
        safeArray(
          this._rootProduction(),
        ),
      );
    } catch (e) {
      e.loc = this.currentToken.loc;
      throw e;
    }

    return this._tree;
  }

  /**
   * Matches multiple trees
   *
   * @param {GrammarProductions<K>} productions
   * @returns {TreeNode<K>[]}
   * @memberof Grammar
   */
  matchList(productions: GrammarProductions<K>): TreeNode<K>[] {
    const list: TreeNode<K>[] = [];

    while (true) {
      const token = this.fetchRelativeToken(0, false);
      if (!token || token.type === TokenType.EOF)
        break;

      let node = this.or(productions);
      if (node && !(<GrammarCheckListBreak> node).continue) {
        if (!R.is(Array, node))
          node = [<TreeNode<K>> node];

        (<TreeNode<K>[]> node).forEach((listNode) => {
          if (!listNode.isEmpty())
            list.push(listNode);
        });
      } else
        break;
    }

    return list;
  }

  /**
   * Saves token index and tries to exec grammar
   *
   * @param {GrammarProduction<K>} production
   * @returns {ReturnType<GrammarProduction<K>>}
   * @memberof Grammar
   */
  try<R>(production: () => R): R {
    const savedIndex = this.tokenIndex;

    try {
      return production();
    } catch (e) {
      // already consumed some of instruction
      // but occurs parsing error
      if (!('code' in e))
        throw e;
      else
        this.tokenIndex = savedIndex;
    }

    return null;
  }

  /**
   * Checks all production and chooses single maching
   *
   * @private
   * @type {number}
   * @memberof Grammar
   */
  or(productions: GrammarProductions<K>): ReturnType<GrammarProduction<K>> {
    // search for matching production
    const savedMatchCallNesting = this._matchCallNesting;
    const savedIndex = this.tokenIndex;

    for (const name in productions) {
      const production = productions[name];

      try {
        this._matchCallNesting = savedMatchCallNesting;
        const result = production();
        this._matchCallNesting = savedMatchCallNesting;

        return result;
      } catch (e) {
        const matchCallingDelta = this._matchCallNesting - savedMatchCallNesting;
        this._matchCallNesting = savedMatchCallNesting;

        // already consumed some of instruction
        // but occurs parsing error
        if (!(e instanceof SyntaxError)
            || !('code' in e)
            || (!this._config.ignoreMatchCallNesting && matchCallingDelta > 1))
          throw e;
        else
          this.tokenIndex = savedIndex;
      }
    }

    throw new SyntaxError;
  }

  /**
   * Raises error for preprocessor that kills grammar matcher
   * and moves to next without crashing app
   *
   * @memberof Grammar
   */
  raiseNonCriticalMatchError(): void {
    this._matchCallNesting = null;
    throw new SyntaxError;
  }

  /**
   * Match single token or group of tokens
   *
   * @param {GrammarMatcherInfo<TokenIdentifier>} attrs
   * @returns {Token}
   * @memberof Grammar
   */
  match(
    {
      terminal = null,
      consume = true,
      type = TokenType.KEYWORD,
      kind,
      types,
      optional,
      ignoreMatchNesting,
    }: GrammarMatcherInfo<I> = {},
  ): Token {
    if (!ignoreMatchNesting)
      this._matchCallNesting++;

    // check if exists occurs when check types
    // throws error anyway because null token mismatch type
    const {ignoreCase} = this._config;
    const token: Token = this.fetchRelativeToken(0, false);

    if (!token)
      return null;

    if ((!types && terminal === null && token.type !== type)
        || (kind !== undefined && token.kind !== kind)
        || (types && types.indexOf(token.type) === -1)
        || (terminal !== null && ((ignoreCase ? token.lowerText : token.text) !== terminal))) {
      if (optional)
        return null;

      throw new SyntaxError;
    }

    if (consume)
      this.consume();

    return token;
  }

  /**
   * Return token that is not identifier
   *
   * @return {Token}
   * @memberof Grammar
   */
  nonIdentifierKeyword(): Token {
    return this.match(
      {
        type: TokenType.KEYWORD,
        kind: null,
      },
    );
  }

  /**
   * Match token by type
   *
   * @param {TokenType} type
   * @return {Token}
   * @memberof Grammar
   */
  terminalType(type: TokenType): Token {
    return this.match(
      {
        type,
      },
    );
  }

  /**
   * Matches single character
   *
   * @param {string|string[]} char
   * @param {boolean} consume
   * @returns
   * @memberof Grammar
   */
  terminal(char: string|string[], consume: boolean = true) {
    const token: Token = this.fetchRelativeToken(0, false);

    if (char instanceof Array) {
      if (!char.includes(token.text))
        throw new SyntaxError;
    } else if (token.text !== char)
      throw new SyntaxError;

    if (consume)
      this.consume();

    return token;
  }

  /**
   * Catches multiple terminals in row
   *
   * @param {string} chars
   * @memberof Grammar
   */
  terminals(chars: string) {
    for (let i = 0; i < chars.length; ++i)
      this.terminal(chars[i]);
  }

  /**
   * Matches token defined in identifiers list
   *
   * @param {(I|I[])} identifier
   * @param {boolean} [optional]
   * @param {boolean} [consume=true]
   * @returns {Token}
   * @memberof Grammar
   */
  identifier(identifier?: I|I[], optional?: boolean, consume: boolean = true): Token {
    this._matchCallNesting++;

    const token: Token = this.fetchRelativeToken(0, false);
    if (token.kind !== TokenKind.IDENTIFIER
      || (!R.isNil(identifier)
          && (R.is(Array, identifier) ? !(<I[]> identifier).includes(token.value) : token.value !== identifier))
    ) {
      if (optional)
        return null;

      throw new SyntaxError;
    }

    if (consume)
      this.consume();

    return token;
  }
}
