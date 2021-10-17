import {Grammar} from '@compiler/grammar/Grammar';
import {CCompilerIdentifier} from '../../../constants';
import {ASTCStmt} from '../../ast/ASTCStmt';
import {ASTCCompilerKind} from '../../ast/ASTCCompilerNode';

export type CGrammar = {
  g: Grammar<CCompilerIdentifier, ASTCCompilerKind>,
  stmt(): ASTCStmt,
};
