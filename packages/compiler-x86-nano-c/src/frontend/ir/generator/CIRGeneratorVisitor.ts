import {CScopeVisitor, CScopeTree} from '../../analyze/scope';
import {ASTCCompilerNode} from '../../parser';
import {CIRGeneratorConfig} from '../constants';

/**
 * Root IR generator visitor
 *
 * @export
 * @class CIRGeneratorVisitor
 * @extends {CScopeVisitor}
 */
export class CIRGeneratorVisitor extends CScopeVisitor {
  constructor(
    readonly config: CIRGeneratorConfig,
  ) {
    super();
  }

  enter(
    node: CScopeTree<ASTCCompilerNode<any>>,
    history: CScopeTree<ASTCCompilerNode<any>>[],
  ): boolean | void {
    console.info(node, history);
  }
}
