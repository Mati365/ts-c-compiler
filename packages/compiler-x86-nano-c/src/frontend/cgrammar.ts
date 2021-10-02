/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import {Grammar, GrammarInitializer} from '@compiler/grammar/Grammar';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token, TokenType} from '@compiler/lexer/tokens';

import {empty} from '@compiler/grammar/matchers';
import {isEOFToken} from '@compiler/lexer/utils';
import {fetchTokensUntil} from '@compiler/grammar/utils';

import {ASTCCompilerKind, ASTCCompilerNode} from './ast/ASTCCompilerNode';
import {
  CCompilerIdentifier,
  CCompilerKeyword,
  CTypeQualifiers,
} from '../constants';

import {
  ASTCFunction,
  ASTCExpression,
  ASTCStmt,
  ASTCType,
  ASTCVariableDeclaration,
  ASTCReturn,
  ASTCIf,
  ASTCAssignExpression,
  ASTCVariableDeclarator,
} from './ast';

import {logicExpression} from './matchers';

/**
 * @see {@link https://www.lysator.liu.se/c/ANSI-C-grammar-y.html}
 * @see {@link https://cs.wmich.edu/~gupta/teaching/cs4850/sumII06/The%20syntax%20of%20C%20in%20Backus-Naur%20form.htm}
 */
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
    const startToken = g.identifier(CCompilerKeyword.RETURN);

    return new ASTCReturn(
      NodeLocation.fromTokenLoc(startToken.loc),
      expression(),
    );
  }

  /**
   * Matches const/volatile
   *
   * @param {boolean} optional
   */
  function typeQualifier(opitonal?: boolean) {
    /**
      type_qualifier
      : CONST
      | VOLATILE
      ;
     */
    const token = g.identifier(
      [
        CTypeQualifiers.CONST,
        CTypeQualifiers.VOLATILE,
      ],
      opitonal,
    );

    return token && CTypeQualifiers[token.upperText];
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
    /**
      declarator
        : pointer direct_declarator
        | direct_declarator
        ;

      direct_declarator
        : IDENTIFIER
        | '(' declarator ')'
        | direct_declarator '[' constant_expression ']'
        | direct_declarator '[' ']'
        | direct_declarator '(' parameter_type_list ')'
        | direct_declarator '(' identifier_list ')'
        | direct_declarator '(' ')'
        ;

      pointer
        : '*'
        | '*' type_qualifier_list
        | '*' pointer
        | '*' type_qualifier_list pointer
        ;
     */
    const qualifier = typeQualifier(true);
    const token = g.match(
      {
        type: TokenType.KEYWORD,
      },
    );

    return new ASTCType(
      NodeLocation.fromTokenLoc(token.loc),
      token.text,
      qualifier,
    );
  }

  function directDeclarator() {
    const type = typeDeclaration();

    return new ASTCVariableDeclaration(
      type.loc,
      type,
      g.match(
        {
          type: TokenType.KEYWORD,
        },
      ).text,
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

      args.push(
        directDeclarator(),
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
   * if ( <expression> ) {}
   *
   * @returns {ASTCIf}
   */
  function ifStmt(): ASTCIf {
    const startToken = g.identifier(CCompilerKeyword.IF);
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
    <expression> ::= <assignment-expression>
                  | <expression> , <assignment-expression>

    <assignment-expression> ::= <conditional-expression>
                              | <unary-expression> <assignment-operator> <assignment-expression>
   */
  function assignOperator(): Token {
    return g.match(
      {
        types: [
          TokenType.ASSIGN,
          TokenType.MUL_ASSIGN,
          TokenType.DIV_ASSIGN,
          TokenType.MOD_ASSIGN,
          TokenType.ADD_ASSIGN,
          TokenType.SUB_ASSIGN,
          TokenType.SHIFT_LEFT_ASSIGN,
          TokenType.SHIFT_RIGHT_ASSIGN,
          TokenType.AND_ASSIGN,
          TokenType.XOR_ASSIGN,
          TokenType.OR_ASSIGN,
        ],
      },
    );
  }

  function assignExpression(): ASTCAssignExpression {
    const unary = g.match(
      {
        type: TokenType.KEYWORD,
      },
    );

    const op = assignOperator();
    const expr = g.match(
      {
        type: TokenType.KEYWORD,
      },
    );

    g.match(
      {
        type: TokenType.SEMICOLON,
      },
    );

    return new ASTCAssignExpression(
      NodeLocation.fromTokenLoc(unary.loc),
      new ASTCExpression(null, [unary]),
      op.type,
      new ASTCExpression(null, [expr]),
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
   * Matches list of ast compiler nodes
   */
  function stmt(): ASTCStmt {
    return new ASTCStmt(
      NodeLocation.fromTokenLoc(g.currentToken.loc),
      <ASTCCompilerNode[]> g.matchList(
        {
          functionDeclaration,
          returnStmt,
          stmtBlock,
          ifStmt,
          assignExpression,
          variableDeclaration,
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
