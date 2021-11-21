import {Grammar} from '@compiler/grammar/Grammar';
import {CCompilerIdentifier} from '../../../constants';
import {
  ASTCStmt,
  ASTCUnaryExpression,
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCDeclarator,
  ASTCAbstractDeclarator,
  ASTCSpecifiersQualifiersList,
} from '../../ast';

export type CGrammarDef = Grammar<CCompilerIdentifier, ASTCCompilerKind>;

export type CGrammar = {
  g: CGrammarDef,
  declarator(): ASTCDeclarator,
  abstractDeclarator(): ASTCAbstractDeclarator,
  statement(): ASTCStmt,
  unaryExpression(): ASTCUnaryExpression,
  assignmentExpression(): ASTCCompilerNode,
  qualifiersSpecifiers(): ASTCSpecifiersQualifiersList,
};
