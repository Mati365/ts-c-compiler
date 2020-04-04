/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {isLineTerminatorToken} from '@compiler/lexer/utils';

import {TokenType, NumberToken, Token, TokenKind, NumberFormat} from '@compiler/lexer/tokens';
import {Grammar, GrammarInitializer, SyntaxError} from '@compiler/grammar/Grammar';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

import {empty} from '@compiler/grammar/matchers';
import {fetchTokensUntilEOL} from '@compiler/grammar/utils/fetchTokensUntilEOL';
import {logicExpression} from './matchers/logicExpression';

import {
  ASTPreprocessorSyntaxLine,
  ASTPreprocessorMacro,
  ASTPreprocessorDefine,
  ASTPreprocessorDefineArgSchema,
  ASTPreprocessorIF,
  ASTPreprocessorExpression,
  ASTPreprocessorStmt,
  ASTPreprocessorIFDef,
} from './nodes';

import {
  PreprocessorIdentifier,
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from './constants';

const preprocessorMatcher: GrammarInitializer<PreprocessorIdentifier, ASTPreprocessorKind> = ({g}) => {
  /**
   * Consumes all EOL characters from line begin
   *
   * @returns {number} empty lines
   */
  function startLine(): number {
    let emptyLines = 0;

    do {
      const token = g.fetchRelativeToken(0, false);
      if (token.type === TokenType.EOL) {
        g.consume();
        emptyLines++;
      } else
        break;
    } while (true);

    return emptyLines;
  }

  /**
   * Matches identifier that must be in single line, without others
   *
   * @param {(PreprocessorIdentifier|PreprocessorIdentifier[])} identifier
   * @returns {Token}
   */
  function singleLineIdentifier(identifier: PreprocessorIdentifier|PreprocessorIdentifier[]): Token {
    startLine();
    return g.identifier(identifier);
  }

  /**
   * Matches %ifdef, %ifndef
   *
   * @param {PreprocessorIdentifier} [identifier=PreprocessorIdentifier.IFDEF]
   * @returns {ASTPreprocessorNode}
   */
  function ifDefStmt(identifier: PreprocessorIdentifier = PreprocessorIdentifier.IFDEF): ASTPreprocessorNode {
    const negated = (
      identifier === PreprocessorIdentifier.IFNDEF
        || identifier === PreprocessorIdentifier.ELIFNDEF
    );

    const startToken = singleLineIdentifier(identifier);
    const macroName = g.match(
      {
        type: TokenType.KEYWORD,
      },
    );

    const consequent = stmt();
    const alternate = <ASTPreprocessorStmt> g.or(
      {
        else() {
          g.identifier(PreprocessorIdentifier.ELSE);
          return stmt();
        },
        elifdef() {
          g.identifier(PreprocessorIdentifier.ELIFDEF, false, false);
          return ifDefStmt(PreprocessorIdentifier.ELIFDEF);
        },
        elifndef() {
          g.identifier(PreprocessorIdentifier.ELIFNDEF, false, false);
          return ifDefStmt(PreprocessorIdentifier.ELIFNDEF);
        },
        empty,
      },
    );

    if (identifier === PreprocessorIdentifier.IFDEF || identifier === PreprocessorIdentifier.IFNDEF)
      g.identifier(PreprocessorIdentifier.ENDIF);

    return new ASTPreprocessorIFDef(
      NodeLocation.fromTokenLoc(startToken.loc),
      negated,
      macroName.text,
      consequent,
      alternate,
    );
  }

  function ifNdefStmt() {
    return ifDefStmt(PreprocessorIdentifier.IFNDEF);
  }

  /**
   * Matches %if, %ifn
   *
   * @param {PreprocessorIdentifier} [identifier=PreprocessorIdentifier.IF]
   * @returns {ASTPreprocessorNode}
   */
  function ifStmt(identifier: PreprocessorIdentifier = PreprocessorIdentifier.IF): ASTPreprocessorNode {
    const negated = (
      identifier === PreprocessorIdentifier.IFN
        || identifier === PreprocessorIdentifier.ELIFN
    );

    const startToken = singleLineIdentifier(identifier);
    const expression = logicExpression(g);

    const bodyLoc = NodeLocation.fromTokenLoc(g.currentToken.loc);
    const consequent = stmt();
    const alternate = <ASTPreprocessorStmt> g.or(
      {
        else() {
          g.identifier(PreprocessorIdentifier.ELSE);
          return stmt();
        },
        elif() {
          g.identifier(PreprocessorIdentifier.ELIF, false, false);
          return ifStmt(PreprocessorIdentifier.ELIF);
        },
        elifn() {
          g.identifier(PreprocessorIdentifier.ELIFN, false, false);
          return ifStmt(PreprocessorIdentifier.ELIFN);
        },
        empty,
      },
    );

    if (identifier === PreprocessorIdentifier.IF || identifier === PreprocessorIdentifier.IFN)
      g.identifier(PreprocessorIdentifier.ENDIF);

    return new ASTPreprocessorIF(
      NodeLocation.fromTokenLoc(startToken.loc),
      negated,
      new ASTPreprocessorExpression(
        bodyLoc,
        expression,
      ),
      consequent,
      alternate,
    );
  }

  function ifnStmt() {
    return ifStmt(PreprocessorIdentifier.IFN);
  }

  /**
   * matches %macro, %imacro
   *
   * @returns {TreeNode}
   */
  function macroStmt(): ASTPreprocessorNode {
    const startToken = singleLineIdentifier(
      [
        PreprocessorIdentifier.MACRO,
        PreprocessorIdentifier.IMACRO,
      ],
    );

    const caseIntensive = startToken.value === PreprocessorIdentifier.MACRO;
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

      stmt(),
    ];

    startLine();
    g.identifier(PreprocessorIdentifier.ENDMACRO);

    return new ASTPreprocessorMacro(
      NodeLocation.fromTokenLoc(startToken.loc),
      name,
      caseIntensive,
      argsCount,
      children,
    );
  }

  /**
   * matches %define, %idefine
   *
   * @returns {TreeNode}
   */
  function defineStmt(): ASTPreprocessorNode {
    const startToken = singleLineIdentifier(
      [
        PreprocessorIdentifier.DEFINE,
        PreprocessorIdentifier.IDEFINE,
      ],
    );

    const caseIntensive = startToken.value === PreprocessorIdentifier.DEFINE;
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
    let expression = fetchTokensUntilEOL(g);
    if (!expression.length) {
      expression = [
        new NumberToken(nameToken.text, -Infinity, NumberFormat.DEC, nameToken.loc),
      ];
    }

    // eslint-disable-next-line
    return new ASTPreprocessorDefine(
      NodeLocation.fromTokenLoc(startToken.loc),
      nameToken.text,
      caseIntensive,
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
   * Preserve empty line
   *
   * @returns {ASTPreprocessorNode}
   */
  function newLine(): ASTPreprocessorNode {
    const token = g.match(
      {
        type: TokenType.EOL,
        consume: true,
      },
    );

    return new ASTPreprocessorSyntaxLine(
      NodeLocation.fromTokenLoc(token.loc),
      [
        token.fork(' '), // syntax line already contains \n serializer
      ],
    );
  }

  /**
   * Matches body of define and main documen
   *
   * @returns {TreeNode[]}
   */
  function stmt(): ASTPreprocessorStmt {
    return new ASTPreprocessorStmt(
      NodeLocation.fromTokenLoc(g.currentToken.loc),
      <ASTPreprocessorNode[]> g.matchList(
        {
          newLine,
          ifStmt,
          ifDefStmt,
          ifNdefStmt,
          ifnStmt,
          defineStmt,
          macroStmt,
          syntaxLine,
          empty,
        },
      ),
    );
  }

  return stmt;
};

export function createPreprocessorGrammar() {
  return Grammar.build(
    {
      identifiers: {
        '%if': PreprocessorIdentifier.IF,
        '%ifn': PreprocessorIdentifier.IFN,
        '%ifdef': PreprocessorIdentifier.IFDEF,
        '%ifndef': PreprocessorIdentifier.IFNDEF,
        '%endif': PreprocessorIdentifier.ENDIF,
        '%else': PreprocessorIdentifier.ELSE,
        '%elif': PreprocessorIdentifier.ELIF,
        '%elifn': PreprocessorIdentifier.ELIFN,
        '%elifdef': PreprocessorIdentifier.ELIFDEF,
        '%elifndef': PreprocessorIdentifier.ELIFNDEF,
        '%define': PreprocessorIdentifier.DEFINE,
        '%idefine': PreprocessorIdentifier.IDEFINE,
        '%macro': PreprocessorIdentifier.MACRO,
        '%imacro': PreprocessorIdentifier.IMACRO,
        '%endmacro': PreprocessorIdentifier.ENDMACRO,
      },
    },
    preprocessorMatcher,
  );
}
