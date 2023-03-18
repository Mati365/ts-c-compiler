import { Grammar } from '@compiler/grammar/Grammar';
import { CCompilerIdentifier } from '@compiler/pico-c/constants';
import {
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
} from '../../ast';

export type CGrammarDef = Grammar<CCompilerIdentifier, ASTCCompilerKind>;

export type CGrammar = {
  parentNode: {
    loopStmt?: ASTCForStatement | ASTCWhileStatement | ASTCDoWhileStatement;
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
