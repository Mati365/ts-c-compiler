/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import * as R from 'ramda';

import {lexer} from '@compiler/lexer/lexer';
import {
  TokenType,
  Token,
  NumberToken,
  FloatNumberToken,
} from '@compiler/lexer/tokens';

import {TokensIterator} from './tree/TokensIterator';
import {GrammarErrorCode, GrammarError} from './GrammarError';

function throwSyntaxError() {
  throw new GrammarError(GrammarErrorCode.SYNTAX_ERROR);
}

/** Basic type config */
export type GrammarProduction = () => void;

export type GrammarProductions = {
  [key: string]: GrammarProduction,
};

export type GrammarMatcher = (terminal: string, type?: TokenType) => void;

export type GrammarInitializer = (context: {
  grammar: Grammar,
  m: GrammarMatcher,
}) => GrammarProduction;

export type GrammarConfig = {
  ignoreCase?: boolean,
};

/**
 * Tree of production
 *
 * @class GrammarParseTree
 * @template T
 */
export class GrammarParseTree<T = any> {
  constructor(
    public readonly parent: GrammarParseTree,
    public readonly name: string,
    public children: GrammarParseTree[] = [],
    public value: T = null,
  ) {}
}

/**
 * Creates simple parse tree based on grammar creator
 *
 * @see
 *  Predictive parser
 *
 * @export
 * @class Grammar
 * @extends {TokensIterator}
 */
export class Grammar extends TokensIterator {
  private rootProduction: GrammarProduction;
  private config: GrammarConfig = {
    ignoreCase: true,
  };

  private tree: GrammarParseTree;
  private currentTreeNode: GrammarParseTree;

  /**
   * Creates grammar
   *
   * @static
   * @param {GrammarInitializer} initializer
   * @returns {Grammar}
   * @memberof Grammar
   */
  static build(initializer: GrammarInitializer): Grammar {
    const grammar = new Grammar;

    grammar.rootProduction = initializer(
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
   * @returns {GrammarParseTree}
   * @memberof Grammar
   */
  process(code: string): GrammarParseTree {
    this.tree = new GrammarParseTree(null, 'root');
    this.currentTreeNode = this.tree;

    this.tokens = Array.from(
      lexer(
        {
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

    this.rootProduction();
    return this.tree;
  }

  /**
   * Checks all production, creates tree from them
   *
   * @param {GrammarProductions} productions
   * @memberof Grammar
   */
  or(productions: GrammarProductions): void {
    const savedIndex = this.tokenIndex;
    let anyProcessed = false;

    for (const name in productions) {
      const production = productions[name];
      const prevTree = this.currentTreeNode;

      try {
        const newTree = new GrammarParseTree(this.currentTreeNode, name);
        this.currentTreeNode.children.push(newTree);
        this.currentTreeNode = newTree;

        production();
        anyProcessed = true;
        break;
      } catch (e) {
        // revert broken tree
        if (prevTree?.parent) {
          prevTree.parent.children = R.without(
            [this.currentTreeNode],
            prevTree.parent.children,
          );
        }

        if (e.code === GrammarErrorCode.SYNTAX_ERROR)
          this.tokenIndex = savedIndex;
        else
          throw e;
      }

      this.currentTreeNode = prevTree;
    }

    if (!anyProcessed)
      throwSyntaxError();
  }

  /**
   * Match single token or group of tokens
   *
   * @private
   * @type {GrammarMatcher}
   * @memberof Grammar
   */
  private match: GrammarMatcher = (terminal: string, type: TokenType = TokenType.KEYWORD): void => {
    // check if exists occurs when check types
    // throws error anyway because null token mismatch type
    const {ignoreCase} = this.config;
    let token = null;

    do {
      token = this.fetchRelativeToken(0, false);

      if (token.type === TokenType.EOL)
        this.consume();

      else
        break;
    } while (true);

    console.info(token.lowerText, terminal, token?.type);

    if (token?.type !== type)
      throwSyntaxError();

    // kill mathcher if error occurs
    // if terminal is null - match only type
    if (terminal !== null && (ignoreCase ? token.lowerText : token.text) !== terminal)
      throwSyntaxError();

    this.currentTreeNode.children.push(
      new GrammarParseTree<Token>(
        this.currentTreeNode,
        token.text,
        null,
        token,
      ),
    );

    this.consume();
  };
}


// test
(() => {
  const grammar = Grammar.build(({m}) => {
    function body() {
      grammar.or(
        {
          macro,
        },
      );
    }

    function macro() {
      m('%macro'); m(null, TokenType.KEYWORD); m(null, TokenType.NUMBER);
      body();
      m('%endmacro');
    }

    return body;
  });

  console.info(
    grammar.process(`
      %macro dupa 1
        xor ax, ax
        int 0x10
        mov ah, 1
        mov cx, 0x2607
        int 0x10
      %endmacro
    `),
  );
})();
