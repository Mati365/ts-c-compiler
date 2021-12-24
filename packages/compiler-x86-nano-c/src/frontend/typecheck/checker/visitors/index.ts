import {TreeVisitorsMap} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {CTypeStructVisitor} from './CTypeStructVisitor';
import {CTypeFuncVisitor} from './CTypeFuncVisitor';
import {
  ASTCCompilerKind,
  ASTCCompilerNode,
} from '../../../parser/ast/ASTCCompilerNode';

export const C_TYPES_VISITORS: TreeVisitorsMap<ASTCCompilerNode> = {
  [ASTCCompilerKind.StructSpecifier]: CTypeStructVisitor,
  [ASTCCompilerKind.FunctionDefinition]: CTypeFuncVisitor,
};
