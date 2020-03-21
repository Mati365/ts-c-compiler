/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {isLineTerminatorToken} from '@compiler/lexer/utils';

import {TokenType, NumberToken, Token, TokenKind} from '@compiler/lexer/tokens';
import {Grammar, GrammarInitializer, SyntaxError} from '@compiler/grammar/Grammar';
import {TreePrintVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

import {empty} from '@compiler/grammar/matchers';
import {fetchTokensUntilEOL} from '@compiler/grammar/utils/fetchTokensUntilEOL';
import {logicExpression} from './matchers';

import {
  ASTPreprocessorSyntaxLine,
  ASTPreprocessorMacro,
  ASTPreprocessorDefine,
  ASTPreprocessorDefineArgSchema,
  ASTPreprocessorIF,
  ASTPreprocessorLogicalExpression,
  ASTPreprocessorStmt,
} from './nodes';

import {PreprocessorInterpreter} from './interpreter/PreprocessorInterpreter';
import {
  PreprocessorIdentifier,
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from './constants';

const preprocessorMatcher: GrammarInitializer<PreprocessorIdentifier, ASTPreprocessorKind> = ({g}) => {
  /**
   * Consumes all EOL characters from line begin
   *
   * @returns {TreeNode}
   */
  function startLine(): ASTPreprocessorNode {
    do {
      const token = g.fetchRelativeToken(0, false);
      if (token.type === TokenType.EOL)
        g.consume();
      else
        break;
    } while (true);

    return null;
  }

  /**
   * Matches identifier that must be in single line, without others
   *
   * @param {PreprocessorIdentifier} identifier
   * @returns {Token}
   */
  function singleLineIdentifier(identifier: PreprocessorIdentifier): Token {
    startLine();
    return g.identifier(identifier);
  }

  /**
   * Matches %ifdef
   *
   * @returns {TreeNode}
   */
  function ifStmt(): ASTPreprocessorNode {
    const startToken = singleLineIdentifier(PreprocessorIdentifier.IF);
    const expression = logicExpression(g);

    const bodyLoc = NodeLocation.fromTokenLoc(g.currentToken.loc);
    const consequent = body();
    g.identifier(PreprocessorIdentifier.ENDIF);

    return new ASTPreprocessorIF(
      NodeLocation.fromTokenLoc(startToken.loc),
      new ASTPreprocessorLogicalExpression(
        bodyLoc,
        expression,
      ),
      consequent,
    );
  }

  /**
   * matches %macro
   *
   * @returns {TreeNode}
   */
  function macroStmt(): ASTPreprocessorNode {
    const startToken = singleLineIdentifier(PreprocessorIdentifier.MACRO);
    const [name, argsCount, children] = [
      g.match(
        {
          type: TokenType.KEYWORD,
        },
      ).text,

      (<NumberToken> g.match(
        {
          type: TokenType.NUMBER,
          optional: true,
        },
      ))?.value?.number ?? 0,

      body(),
    ];

    startLine();
    g.identifier(PreprocessorIdentifier.ENDMACRO);

    return new ASTPreprocessorMacro(
      NodeLocation.fromTokenLoc(startToken.loc),
      name,
      argsCount,
      children,
    );
  }

  /**
   * matches %define
   *
   * @returns {TreeNode}
   */
  function defineStmt(): ASTPreprocessorNode {
    const startToken = singleLineIdentifier(PreprocessorIdentifier.DEFINE);
    const nameToken = g.match(
      {
        type: TokenType.KEYWORD,
      },
    );

    // args list match name(adef, b, c)
    const args: ASTPreprocessorDefineArgSchema[] = [];
    if (nameToken.kind === TokenKind.BRACKET_PREFIX) {
      g.match(
        {
          type: TokenType.BRACKET,
          terminal: '(',
        },
      );

      do {
        const token = g.consume();
        if (token.type === TokenType.COMMA)
          continue;

        if (token.kind === TokenKind.PARENTHES_BRACKET && token.text === ')')
          break;

        if (token.type !== TokenType.KEYWORD)
          throw new SyntaxError;

        args.push(
          new ASTPreprocessorDefineArgSchema(token.text),
        );
      } while (true);
    }

    // definition content
    const expression = fetchTokensUntilEOL(g);
    if (!expression.length)
      throw new SyntaxError;

    // eslint-disable-next-line
    return new ASTPreprocessorDefine(
      NodeLocation.fromTokenLoc(startToken.loc),
      nameToken.text,
      args,
      expression,
    );
  }

  /**
   * Match res of line
   *
   * @returns {TreeNode}
   */
  function syntaxLine(): ASTPreprocessorNode {
    startLine();

    const loc = g.fetchRelativeToken(0, false)?.loc;
    const tokens: Token[] = [];

    do {
      const token = g.consume();
      if (!token || isLineTerminatorToken(token))
        break;
      else {
        if (token.kind === TokenKind.IDENTIFIER)
          throw new SyntaxError;

        tokens.push(token);
      }
    } while (true);

    return new ASTPreprocessorSyntaxLine(
      NodeLocation.fromTokenLoc(loc),
      tokens,
    );
  }

  /**
   * Matches body of define and main documen
   *
   * @returns {TreeNode[]}
   */
  function body(): ASTPreprocessorStmt {
    return new ASTPreprocessorStmt(
      NodeLocation.fromTokenLoc(g.currentToken.loc),
      <ASTPreprocessorNode[]> g.matchList(
        {
          ifStmt,
          defineStmt,
          macroStmt,
          syntaxLine,
          empty,
        },
      ),
    );
  }

  return body;
};

export const preprocessorGrammar = Grammar.build(
  {
    identifiers: {
      '%if': PreprocessorIdentifier.IF,
      '%endif': PreprocessorIdentifier.ENDIF,
      '%define': PreprocessorIdentifier.DEFINE,
      '%macro': PreprocessorIdentifier.MACRO,
      '%endmacro': PreprocessorIdentifier.ENDMACRO,
    },
  },
  preprocessorMatcher,
);

/**
 * Exec preprocessor on phrase
 *
 * @export
 * @param {string} str
 */
export function preprocessor(str: string): string {
  const stmt: ASTPreprocessorStmt = preprocessorGrammar.process(str).children[0];

  const interpreter = new PreprocessorInterpreter;
  const result = interpreter.exec(stmt);

  console.info((new TreePrintVisitor).visit(stmt).reduced);
  return result;
}

const output = preprocessor(`
  %if 3+2*5 > 5 && (5 * 5 < 9 || 5 * 5 > 1)
    xor bx, cx
  %endif

  %define test_define(arg1,brg2,c) arg1
  %define test_define2 abce
  %macro dupa 3
    %macro test_abc 4
      xor ax, bx
      mov bx, [bx:cx+5]
    %endmacro

    %define test_define(arg1,brg2,c) ax
    %define test_define2 abce
  %endmacro

  xor ax, test_define(2*(5-6), 3, 4)
  times 55 db (2+2)
`);

console.info(`Output: \n${output}`);
