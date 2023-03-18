import type { Grammar } from '@compiler/grammar/Grammar';
import type { CCompilerIdentifier } from '@compiler/pico-c/constants';
import type {
  ASTCStmt,
  ASTCUnaryExpression,
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCDeclarator,
  ASTCAbstractDeclarator,
  ASTCSpecifiersQualifiersList,
  ASTCInitializer,
  ASTCForStatement,
  ASTCWhileStatement,
  ASTCDoWhileStatement,
  ASTCSwitchStatement,
} from '../../ast';

export type CGrammarDef = Grammar<CCompilerIdentifier, ASTCCompilerKind>;

export type CGrammar = {
  parentNode: {
    loopStmt?: ASTCForStatement | ASTCWhileStatement | ASTCDoWhileStatement;
    switchStmt?: ASTCSwitchStatement;
  };

  g: CGrammarDef;
  declarator(): ASTCDeclarator;
  abstractDeclarator(): ASTCAbstractDeclarator;
  statement(): ASTCStmt;
  unaryExpression(): ASTCUnaryExpression;
  assignmentExpression(): ASTCCompilerNode;
  qualifiersSpecifiers(): ASTCSpecifiersQualifiersList;
  initializer(): ASTCInitializer;
};
