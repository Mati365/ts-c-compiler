import {TreeVisitorsMap} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {CTypeStructVisitor} from './CTypeStructVisitor';
import {CTypeFunctionVisitor} from './CTypeFunctionVisitor';
import {CTypeEnumVisitor} from './CTypeEnumVisitor';
import {
  ASTCCompilerKind,
  ASTCCompilerNode,
} from '../../../parser/ast/ASTCCompilerNode';

export * from './CTypeTreeVisitor';
export {
  CTypeStructVisitor,
  CTypeFunctionVisitor,
  CTypeEnumVisitor,
};

export const C_TYPES_VISITORS: TreeVisitorsMap<ASTCCompilerNode> = {
  [ASTCCompilerKind.StructSpecifier]: CTypeStructVisitor,
  [ASTCCompilerKind.EnumSpecifier]: CTypeEnumVisitor,
  [ASTCCompilerKind.FunctionDefinition]: CTypeFunctionVisitor,
};
