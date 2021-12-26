import {TreeVisitorsMap} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {CTypeFunctionVisitor} from './CTypeFunctionVisitor';
import {CDeclarationVisitor} from './CDeclarationVisitor';
import {
  ASTCCompilerKind,
  ASTCCompilerNode,
} from '../../../parser/ast/ASTCCompilerNode';

export * from './CTypeTreeVisitor';
export {
  CTypeFunctionVisitor,
};

export const C_TYPES_VISITORS: TreeVisitorsMap<ASTCCompilerNode> = {
  [ASTCCompilerKind.FunctionDefinition]: CTypeFunctionVisitor,
  [ASTCCompilerKind.Declaration]: CDeclarationVisitor,
};
