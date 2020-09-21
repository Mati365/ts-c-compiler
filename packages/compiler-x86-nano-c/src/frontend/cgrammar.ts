/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import {Grammar, GrammarInitializer} from '@compiler/grammar/Grammar';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TokenType} from '@compiler/lexer/tokens';

import {empty} from '@compiler/grammar/matchers';

import {CCompilerIdentifier} from '../constants';
import {ASTCCompilerKind, ASTCCompilerNode} from './ast/ASTCCompilerNode';
import {
  ASTCFunction,
  ASTCExpression,
  ASTCStmt,
  ASTCType,
  ASTCVariableDeclaration,
  ASTCVariableDeclarator,
} from './ast';

const compilerMatcher: GrammarInitializer<CCompilerIdentifier, ASTCCompilerKind> = ({g}) => {
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
  function functionDeclaration(): ASTCFunction {
    const type = typeDeclaration();
    const name = g.match(
      {
        type: TokenType.KEYWORD,
      },
    );

    g.terminal('(');
    // todo: args list matcher
    g.terminal(')');

    const content = stmtBlock();

    return new ASTCFunction(
      type.loc,
      type,
      name.text,
      [],
      content,
    );
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
        g.consume();

        varValueExpression = new ASTCExpression(
          NodeLocation.fromTokenLoc(varNameToken.loc),
          null,
        );
      }

      declarations.push(
        new ASTCVariableDeclaration(
          NodeLocation.fromTokenLoc(varNameToken.loc),
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

    return new ASTCVariableDeclarator(
      type.loc,
      declarations,
      type,
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
          stmtBlock,
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
