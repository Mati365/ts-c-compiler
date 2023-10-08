import { dumpAttributesToString } from '@compiler/core/utils';
import { TreePrintVisitor } from '@compiler/grammar/tree/TreePrintVisitor';

import { ASTCCompilerNode } from '../ast';
import { isNewScopeASTNode } from '../../analyze/interfaces';

export function serializeTypedTreeToString(ast: ASTCCompilerNode): string {
  return TreePrintVisitor.serializeToString<ASTCCompilerNode>(ast, {
    formatterFn: node =>
      dumpAttributesToString(node.toString(), {
        type: node.type?.toString(),
        scoped: isNewScopeASTNode(node) || null,
      }),
  });
}
