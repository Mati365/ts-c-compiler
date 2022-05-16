import {CFunctionDeclType} from '../../analyze';
import {CScopeVisitor, CScopeTree} from '../../analyze/scope';
import {ASTCCompilerNode} from '../../parser';

import {CIRGeneratorConfig} from '../constants';
import {CIRLabelInstruction} from '../instructions';
import {CIRBranchesBuilder, CIRBranchesBuilderResult} from './CIRBranchesBuilder';
import {CIRGeneratorASTVisitor} from './CIRGeneratorASTVisitor';
import {CIRNameGenerator} from './CIRNameGenerator';

/**
 * Root IR generator visitor
 *
 * @export
 * @class CIRGeneratorScopeVisitor
 * @extends {CScopeVisitor}
 */
export class CIRGeneratorScopeVisitor extends CScopeVisitor {
  private branchesBuilder = new CIRBranchesBuilder;
  private nameGenerator = new CIRNameGenerator;

  constructor(
    readonly config: CIRGeneratorConfig,
  ) {
    super();
  }

  /**
   * Returns output of IR generator
   *
   * @return {CIRBranchesBuilderResult}
   * @memberof CIRGeneratorScopeVisitor
   */
  flush(): CIRBranchesBuilderResult {
    return this.branchesBuilder.flush();
  }

  /**
   * Iterates over scope and emits IR
   *
   * @param {CScopeTree<ASTCCompilerNode<any>>} scope
   * @memberof CIRGeneratorScopeVisitor
   */
  enter(scope: CScopeTree<ASTCCompilerNode<any>>): void {
    const {
      branchesBuilder,
      nameGenerator,
    } = this;

    const {parentAST} = scope;
    if (parentAST?.type?.isFunction()) {
      const fnType = parentAST.type as CFunctionDeclType;
      const instruction = new CIRLabelInstruction(
        nameGenerator.genLabelName(fnType.name),
      );

      branchesBuilder.emit(instruction);
      new CIRGeneratorASTVisitor(scope)
        .setContext(
          {
            generator: this,
            fnType,
          },
        )
        .visit(fnType.definition);
    }
  }
}
