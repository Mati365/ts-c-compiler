import * as R from 'ramda';

import { safeArray } from '@ts-c/core';
import {
  lexer,
  IdentifiersMap,
  TokenType,
  Token,
  NumberToken,
  FloatNumberToken,
  TokenKind,
} from '@ts-c/lexer';

import { TokensIterator } from './tree/TokensIterator';
import { GrammarErrorCode, GrammarError } from './GrammarError';
import { TreeNode } from './tree/TreeNode';

export class SyntaxError extends GrammarError {
  constructor() {
    super(GrammarErrorCode.SYNTAX_ERROR);
  }

  static isSyntaxError(e: any) {
    return 'code' in e && e instanceof SyntaxError;
  }
}

/** Basic type config */
export type GrammarCheckListBreak = {
  continue?: boolean;
};

export type GrammarProduction<K> = () =>
  | GrammarCheckListBreak
  | (TreeNode<K> | TreeNode<K>[] | {});

export type GrammarProductions<K> = {
  [key: string]: GrammarProduction<K>;
};

export type GrammarInitializer<I, K> = (context: {
  g: Grammar<I, K>;
}) => GrammarProduction<K>;

export type GrammarConfig = {
  ignoreCase?: boolean;
  identifiers?: IdentifiersMap;
  ignoreMatchCallNesting?: boolean;
};

type GrammarMatcherInfo<I> = {
  terminal?: string | I;
  optional?: boolean;
  type?: TokenType;
  kind?: TokenKind;
  types?: TokenType[];
  consume?: boolean;
  ignoreMatchNesting?: boolean;
};

/**
 * Creates simple parse tree based on grammar creator
 *
 * @see
 *  Predictive parser
 */
export class Grammar<I, K = string> extends TokensIterator {
  private rootProduction: GrammarProduction<K>;
  private tree: TreeNode<K> = new TreeNode<K>(null, null, []);
  private matchCallNesting: number = 0;

  constructor(private config: GrammarConfig) {
    super(null);

    this.config = config ?? {};
    this.config.ignoreCase = this.config.ignoreCase ?? true;
  }

  getRootProduction() {
    return this.rootProduction;
  }
  getTree() {
    return this.tree;
  }

  /**
   * Creates grammar
   */
  static build<I, K>(
    config: GrammarConfig,
    initializer: GrammarInitializer<I, K>,
  ): Grammar<I, K> {
    const grammar = new Grammar<I, K>(config);

    grammar.rootProduction = initializer({
      g: grammar,
    });

    return grammar;
  }

  /**
   * Produces grammar tree
   */
  process(code: string | Token[]): TreeNode<K> {
    if (R.is(String, code)) {
      const { identifiers } = this.config;

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
          <string>code,
        ),
      );
    } else {
      this.tokens = <Token[]>code;
    }

    try {
      // this.tokenIndex = 0;
      // this._matchCallNesting = 0;
      this.tree = new TreeNode<K>(
        <any>'Root',
        null,
        safeArray(this.rootProduction()),
      );
    } catch (e) {
      e.loc = this.currentToken.loc;
      throw e;
    }

    return this.tree;
  }

  /**
   * Matches multiple trees
   */
  matchList(productions: GrammarProductions<K>): TreeNode<K>[] {
    const list: TreeNode<K>[] = [];

    while (true) {
      const token = this.fetchRelativeToken(0, false);
      if (!token || token.type === TokenType.EOF) {
        break;
      }

      let node = this.or(productions);
      if (node && !(<GrammarCheckListBreak>node).continue) {
        if (!R.is(Array, node)) {
          node = [<TreeNode<K>>node];
        }

        (<TreeNode<K>[]>node).forEach(listNode => {
          if (!listNode.isEmpty()) {
            list.push(listNode);
          }
        });
      } else {
        break;
      }
    }

    return list;
  }

  /**
   * Saves token index and tries to exec grammar
   */
  try<R>(production: () => R): R {
    const savedIndex = this.tokenIndex;

    try {
      return production();
    } catch (e) {
      // already consumed some of instruction
      // but occurs parsing error
      if (SyntaxError.isSyntaxError(e)) {
        this.tokenIndex = savedIndex;
      } else {
        throw e;
      }
    }

    return null;
  }

  /**
   * Checks all production and chooses single matching
   */
  or(productions: GrammarProductions<K>): ReturnType<GrammarProduction<K>> {
    // search for matching production
    const savedMatchCallNesting = this.matchCallNesting;
    const savedIndex = this.tokenIndex;

    for (const name in productions) {
      const production = productions[name];

      try {
        this.matchCallNesting = savedMatchCallNesting;
        const result = production();
        this.matchCallNesting = savedMatchCallNesting;

        return result;
      } catch (e) {
        const matchCallingDelta = this.matchCallNesting - savedMatchCallNesting;
        this.matchCallNesting = savedMatchCallNesting;

        // already consumed some of instruction
        // but occurs parsing error
        if (
          !SyntaxError.isSyntaxError(e) ||
          (!this.config.ignoreMatchCallNesting && matchCallingDelta > 1)
        ) {
          throw e;
        } else {
          this.tokenIndex = savedIndex;
        }
      }
    }

    throw new SyntaxError();
  }

  /**
   * Raises error for preprocessor that kills grammar matcher
   * and moves to next without crashing app
   */
  raiseNonCriticalMatchError(): void {
    this.matchCallNesting = null;
    throw new SyntaxError();
  }

  /**
   * Match single token or group of tokens
   */
  match({
    terminal = null,
    consume = true,
    type = TokenType.KEYWORD,
    kind,
    types,
    optional,
    ignoreMatchNesting,
  }: GrammarMatcherInfo<I> = {}): Token {
    if (!ignoreMatchNesting) {
      this.matchCallNesting++;
    }

    // check if exists occurs when check types
    // throws error anyway because null token mismatch type
    const { ignoreCase } = this.config;
    const token: Token = this.fetchRelativeToken(0, false);

    if (!token) {
      return null;
    }

    if (
      (!types && terminal === null && token.type !== type) ||
      (kind !== undefined && token.kind !== kind) ||
      (types && types.indexOf(token.type) === -1) ||
      (terminal !== null &&
        (ignoreCase ? token.lowerText : token.text) !== terminal)
    ) {
      if (optional) {
        return null;
      }

      throw new SyntaxError();
    }

    if (consume) {
      this.consume();
    }

    return token;
  }

  /**
   * Return token that is not identifier
   */
  nonIdentifierKeyword(): Token {
    return this.match({
      type: TokenType.KEYWORD,
      kind: null,
    });
  }

  /**
   * Match token by type
   */
  terminalType(type: TokenType): Token {
    return this.match({
      type,
    });
  }

  /**
   * Matches single character
   */
  terminal(char: string | string[], consume: boolean = true) {
    const token: Token = this.fetchRelativeToken(0, false);

    if (char instanceof Array) {
      if (!char.includes(token.text)) {
        throw new SyntaxError();
      }
    } else if (token.text !== char) {
      throw new SyntaxError();
    }

    if (consume) {
      this.consume();
    }

    return token;
  }

  /**
   * Catches multiple terminals in row
   */
  terminals(chars: string) {
    for (let i = 0; i < chars.length; ++i) {
      this.terminal(chars[i]);
    }
  }

  /**
   * Matches token defined in identifiers list
   */
  identifier(
    identifier?: I | I[],
    optional?: boolean,
    consume: boolean = true,
  ): Token {
    this.matchCallNesting++;

    const token: Token = this.fetchRelativeToken(0, false);
    if (
      token.kind !== TokenKind.IDENTIFIER ||
      (!R.isNil(identifier) &&
        (R.is(Array, identifier)
          ? !(<I[]>identifier).includes(token.value)
          : token.value !== identifier))
    ) {
      if (optional) {
        return null;
      }

      throw new SyntaxError();
    }

    if (consume) {
      this.consume();
    }

    return token;
  }
}
