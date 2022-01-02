import {TreeVisitorsMap} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {CFunctionVisitor} from './CFunctionVisitor';
import {CDeclarationVisitor} from './CDeclarationVisitor';
import {
  ASTCCompilerKind,
  ASTCCompilerNode,
} from '../../../parser/ast/ASTCCompilerNode';

export * from './CInnerTypeTreeVisitor';

export const C_TYPES_VISITORS: TreeVisitorsMap<ASTCCompilerNode> = {
  [ASTCCompilerKind.FunctionDefinition]: CFunctionVisitor,
  [ASTCCompilerKind.Declaration]: CDeclarationVisitor,
};
