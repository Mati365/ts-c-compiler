/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import {Grammar, GrammarInitializer} from '@compiler/grammar/Grammar';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token, TokenType} from '@compiler/lexer/tokens';

import {empty} from '@compiler/grammar/matchers';
import {isEOFToken} from '@compiler/lexer/utils';
import {fetchTokensUntil} from '@compiler/grammar/utils';

import {CCompilerIdentifier} from '../constants';
import {ASTCCompilerKind, ASTCCompilerNode} from './ast/ASTCCompilerNode';
import {
  ASTCFunction,
  ASTCExpression,
  ASTCStmt,
  ASTCType,
  ASTCVariableDeclaration,
  ASTCVariableDeclarator,
  ASTCReturn,
  ASTCIf,
} from './ast';

import {logicExpression} from './matchers';

const compilerMatcher: GrammarInitializer<CCompilerIdentifier, ASTCCompilerKind> = ({g}) => {
  /**
   * Fetch expression
   *
   * @param {TokenType} [untilTokenType=TokenType.SEMICOLON]
   * @param {boolean} excludeBreakToken
   * @returns {ASTCExpression}
   */
  function expression(
    breakFn: (token: Token) => boolean = (token: Token) => token.type === TokenType.SEMICOLON,
    excludeBreakToken?: boolean,
  ): ASTCExpression {
    const tokens = fetchTokensUntil(breakFn, g, excludeBreakToken);
    if (!tokens.length)
      return null;

    return new ASTCExpression(
      NodeLocation.fromTokenLoc(tokens[0].loc),
      tokens,
    );
  }

  /**
   * return {expression};
   *
   * @returns {ASTCReturn}
   */
  function returnStmt(): ASTCReturn {
    const startToken = g.identifier(CCompilerIdentifier.RETURN);

    return new ASTCReturn(
      NodeLocation.fromTokenLoc(startToken.loc),
      expression(),
    );
  }

  /**
   * Matches C type
   *
   * @todo
   *  - Add modifiers for primitive types, add pointers support
   *  - Handle void (*ptr)()
   *
   * @returns {ASTCType}
   */
  function typeDeclaration(): ASTCType {
    const token = g.match(
      {
        type: TokenType.KEYWORD,
      },
    );

    return new ASTCType(
      NodeLocation.fromTokenLoc(token.loc),
      token.text,
    );
  }

  /**
   * Matches block
   *
   * @returns {ASTCStmt}
   */
  function stmtBlock(): ASTCStmt {
    g.terminal('{');
    const content = stmt();
    g.terminal('}');
    return content;
  }

  /**
   * Defines C function
   *
   * @returns {ASTCFunction}
   */
  function functionArgs(): ASTCVariableDeclaration[] {
    const args: ASTCVariableDeclaration[] = [];

    for (;;) {
      const token = g.fetchRelativeToken(0, false);
      if (isEOFToken(token) || token.text === ')')
        break;

      const type = typeDeclaration();
      args.push(
        new ASTCVariableDeclaration(
          type.loc,
          type,
          g.match(
            {
              type: TokenType.KEYWORD,
            },
          ).text,
        ),
      );

      const nextToken = g.terminal([')', ','], false);
      if (nextToken.text === ')')
        break;

      g.consume();
    }

    return args;
  }

  function functionDeclaration(): ASTCFunction {
    const type = typeDeclaration();
    const name = g.match(
      {
        type: TokenType.KEYWORD,
      },
    );

    g.terminal('(');
    const args = functionArgs();
    g.terminal(')');

    return new ASTCFunction(type.loc, type, name.text, args, stmtBlock());
  }

  /**
   * Declaration of variable / constant
   *
   * @returns {ASTCVariableDeclarator}
   */
  function variableDeclaration(): ASTCVariableDeclarator {
    const type = typeDeclaration();
    const declarations: ASTCVariableDeclaration[] = [];

    for (;;) {
      let varValueExpression: ASTCCompilerNode = null;
      const varNameToken = g.match(
        {
          type: TokenType.KEYWORD,
        },
      );

      if (g.match({type: TokenType.ASSIGN, optional: true})) {
        varValueExpression = expression(
          (token) => token.type === TokenType.COMMA || token.type === TokenType.SEMICOLON,
          true,
        );
      }

      declarations.push(
        new ASTCVariableDeclaration(
          NodeLocation.fromTokenLoc(varNameToken.loc),
          type,
          varNameToken.text,
          varValueExpression,
        ),
      );

      const token = g.match(
        {
          types: [
            TokenType.COMMA,
            TokenType.SEMICOLON,
          ],
        },
      );

      if (token.type === TokenType.SEMICOLON
          || token.type === TokenType.EOF)
        break;
    }

    return new ASTCVariableDeclarator(type.loc, declarations);
  }

  /**
   * if ( <expression> ) {}
   *
   * @returns {ASTCIf}
   */
  function ifStmt(): ASTCIf {
    const startToken = g.identifier(CCompilerIdentifier.IF);
    g.terminal('(');
    const testExpression = logicExpression(g);
    g.terminal(')');

    return new ASTCIf(
      NodeLocation.fromTokenLoc(startToken.loc),
      testExpression,
      stmtBlock(),
    );
  }

  /**
   * Matches list of ast compiler nodes
   */
  function stmt(): ASTCStmt {
    return new ASTCStmt(
      NodeLocation.fromTokenLoc(g.currentToken.loc),
      <ASTCCompilerNode[]> g.matchList(
        {
          functionDeclaration,
          variableDeclaration,
          returnStmt,
          stmtBlock,
          ifStmt,
          empty,
        },
      ),
    );
  }

  return stmt;
};

export function createCCompilerGrammar() {
  return Grammar.build(
    {
      ignoreMatchCallNesting: true,
    },
    compilerMatcher,
  );
}
