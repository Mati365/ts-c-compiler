import {CTypeAnalyzeContext} from '../../CTypeAnalyzeContext';
import {CType} from '../../../types/CType';
import {ASTCInitializer} from '../../../../parser/ast/ASTCInitializer';
import {CVariableInitializerTree} from '../../../scope/variables';
import {CTypeInitializerBuilderVisitor} from '../builder/CTypeInitializerBuilderVisitor';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../../errors/CTypeCheckError';

type InitializerExtractorAttrs = {
  context: CTypeAnalyzeContext,
  type: CType,
  node: ASTCInitializer,
};

/**
 * Picks ASTCInitializer, iterates over it and constructs initializer tree
 *
 * @export
 * @param {InitializerExtractorAttrs} attrs
 * @return {CVariableInitializerTree}
 */
export function extractInitializerTreeForType(
  {
    context,
    type,
    node,
  }: InitializerExtractorAttrs,
): CVariableInitializerTree {
  if (!node)
    return null;

  const tree = (
    new CTypeInitializerBuilderVisitor(type)
      .setContext(context)
      .visit(node)
      .getBuiltTree()
  );

  if (!tree) {
    throw new CTypeCheckError(
      CTypeCheckErrorCode.UNKNOWN_INITIALIZER_TYPE,
      node.loc.start,
    );
  }

  return tree;
}
