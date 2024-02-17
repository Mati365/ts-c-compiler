import { dumpAttributesToString } from '@ts-cc/core';
import { TreePrintVisitor } from '@ts-cc/grammar';

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
