import {TreeVisitorsMap} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {ASTCCompilerNode, ASTCCompilerKind} from '../../parser/ast/ASTCCompilerNode';
import {CTypeAssignVisitor} from './type-assign-visitor/CTypeAssignVisitor';
import {
  CDeclarationVisitor,
  CFunctionVisitor,
} from './type-scope-builder-visitors';

export const C_TYPES_VISITORS: TreeVisitorsMap<ASTCCompilerNode> = {
  [ASTCCompilerKind.FunctionDefinition]: CFunctionVisitor,
  [ASTCCompilerKind.Declaration]: CDeclarationVisitor,
  [ASTCCompilerKind.ExpressionStmt]: CTypeAssignVisitor,
  // [ASTCCompilerKind.ReturnStmt]: CTypeAssignVisitor,
};
