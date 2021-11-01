import {Grammar} from '@compiler/grammar/Grammar';
import {CCompilerIdentifier} from '../../../constants';
import {
  ASTCStmt,
  ASTCUnaryExpression,
  ASTCCompilerKind,
} from '../../ast';

export type CGrammarDef = Grammar<CCompilerIdentifier, ASTCCompilerKind>;

export type CGrammar = {
  g: CGrammarDef,
  stmt(): ASTCStmt,
  unaryExpression(): ASTCUnaryExpression,
  assignmentExpression(): ASTCUnaryExpression,
};
