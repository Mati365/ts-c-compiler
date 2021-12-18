import {TreeVisitorsMap} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {ASTCCompilerNode, ASTCCompilerKind} from '../../../parser/ast/ASTCCompilerNode';
import {CTypeStructVisitor} from './CTypeStructVisitor';

export const C_TYPES_VISITORS: TreeVisitorsMap<ASTCCompilerNode> = {
  [ASTCCompilerKind.StructSpecifier]: CTypeStructVisitor,
};
