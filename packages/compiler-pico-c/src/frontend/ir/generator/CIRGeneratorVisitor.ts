import {CScopeVisitor, CScopeTree} from '../../analyze/scope';
import {ASTCCompilerNode} from '../../parser';
import {CIRGeneratorConfig} from '../constants';
import {CIRBranchesBuilder} from './CIRBranchesBuilder';
import {CIRNameGenerator} from './CIRNameGenerator';

/**
 * Root IR generator visitor
 *
 * @export
 * @class CIRGeneratorVisitor
 * @extends {CScopeVisitor}
 */
export class CIRGeneratorVisitor extends CScopeVisitor {
  private branchesBuilder = new CIRBranchesBuilder;
  private nameGenerator = new CIRNameGenerator;

  constructor(
    readonly config: CIRGeneratorConfig,
  ) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  enter(scope: CScopeTree<ASTCCompilerNode<any>>): void {
  }
}
