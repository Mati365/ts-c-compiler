import {Grammar} from '@compiler/grammar/Grammar';
import {CCompilerIdentifier} from '../../../constants';
import {
  ASTCStmt,
  ASTCUnaryExpression,
  ASTCCompilerKind,
} from '../../ast';

export type CGrammar = {
  g: Grammar<CCompilerIdentifier, ASTCCompilerKind>,
  stmt(): ASTCStmt,
  unaryExpression(): ASTCUnaryExpression,
};
