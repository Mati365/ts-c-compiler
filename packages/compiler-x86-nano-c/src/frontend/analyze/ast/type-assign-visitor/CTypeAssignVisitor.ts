import * as R from 'ramda';

import {TreeVisitorsMap} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {ASTCCompilerNode} from '@compiler/x86-nano-c/frontend/parser/ast/ASTCCompilerNode';
import {CInnerTypeTreeVisitor} from '../CInnerTypeTreeVisitor';
import {CAnalyzeContext} from '../../CAnalyzeContext';

import {ASTC_TYPE_CREATORS} from './nodes';

/**
 * Map of all types visitors that just assigns to tree types
 *
 * @export
 * @class CTypeAssignVisitor
 * @extends {CInnerTypeTreeVisitor}
 */
export class CTypeAssignVisitor extends CInnerTypeTreeVisitor {
  constructor() {
    super();

    this.setVisitorsMap(
      R.reduce(
        (acc, ItemClass) => {
          const obj = new ItemClass(this);
          acc[obj.kind] = obj;

          return acc;
        },
        {} as TreeVisitorsMap<ASTCCompilerNode>,
        ASTC_TYPE_CREATORS,
      ),
    );
  }

  /**
   * Initializes visitors and assigns types to all nested nodes
   *
   * @static
   * @param {CAnalyzeContext} context
   * @param {ASTCCompilerNode} node
   * @memberof CTypeAssignVisitor
   */
  static assignTypeForNode(context: CAnalyzeContext, node: ASTCCompilerNode) {
    new CTypeAssignVisitor()
      .setContext(context)
      .visit(node);
  }
}
