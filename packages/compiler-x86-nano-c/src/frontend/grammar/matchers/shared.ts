import {Grammar} from '@compiler/grammar/Grammar';
import {CCompilerIdentifier} from '../../../constants';
import {
  ASTCStmt,
  ASTCUnaryExpression,
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCDeclarator,
} from '../../ast';

export type CGrammarDef = Grammar<CCompilerIdentifier, ASTCCompilerKind>;

export type CGrammar = {
  g: CGrammarDef,
  declarator(): ASTCDeclarator,
  statement(): ASTCStmt,
  unaryExpression(): ASTCUnaryExpression,
  assignmentExpression(): ASTCCompilerNode,
};
