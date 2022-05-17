import {CFunctionDeclType, CPrimitiveType} from '../../analyze';
import {CScopeVisitor, CScopeTree} from '../../analyze/scope';

import {CIRGeneratorConfig} from '../constants';
import {CIRInitInstruction, CIRRetInstruction} from '../instructions';
import {CIRInstructionVarArg, CIRVariable} from '../variables';
import {CIRBranchesBuilder, CIRBranchesBuilderResult} from './CIRBranchesBuilder';
import {CIRGeneratorASTVisitor} from './CIRGeneratorASTVisitor';
import {CIRVariableAllocator} from './CIRVariableAllocator';

/**
 * Root IR generator visitor
 *
 * @export
 * @class CIRGeneratorScopeVisitor
 * @extends {CScopeVisitor}
 */
export class CIRGeneratorScopeVisitor extends CScopeVisitor {
  readonly branchesBuilder = new CIRBranchesBuilder;
  readonly allocator = new CIRVariableAllocator;

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
   * @param {CScopeTree} scope
   * @memberof CIRGeneratorScopeVisitor
   */
  enter(scope: CScopeTree): void | boolean {
    const {parentAST} = scope;

    if (parentAST?.type?.isFunction()) {
      this.emitFunctionIR(scope, <CFunctionDeclType> parentAST.type);
      return false;
    }
  }

  /**
   * Enters and compiles whole function (emits also instructions for scope)
   *
   * @todo
   *  - Extract all variables from nested scopes!
   *
   * @private
   * @param {CScopeTree} scope
   * @param {CFunctionDeclType} fnType
   * @memberof CIRGeneratorScopeVisitor
   */
  private emitFunctionIR(scope: CScopeTree, fnType: CFunctionDeclType) {
    const {allocator, branchesBuilder} = this;
    const instruction = allocator.allocFunctionType(fnType);

    branchesBuilder.emit(instruction);
    this.emitScopeVariablesIR(scope);

    new CIRGeneratorASTVisitor(scope)
      .setContext(
        {
          generator: this,
          fnType,
        },
      )
      .visit(fnType.definition);

    branchesBuilder.emit(
      new CIRRetInstruction,
    );
  }

  /**
   * Emits all local scope instructions
   *
   * @private
   * @param {CScopeTree} scope
   * @memberof CIRGeneratorScopeVisitor
   */
  private emitScopeVariablesIR(scope: CScopeTree) {
    const {config, allocator, branchesBuilder} = this;
    const {variables} = scope.dump();

    for (const [, variable] of Object.entries(variables)) {
      const instruction = new CIRInitInstruction(
        CIRInstructionVarArg.ofConstant(CPrimitiveType.int(config.arch), 2),
        allocator
          .allocVariable(CIRVariable.ofScopeVariable(variable))
          .name,
      );

      branchesBuilder.emit(instruction);
    }
  }
}
