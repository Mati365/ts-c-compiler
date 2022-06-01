import {CFunctionDeclType} from '../../analyze';
import {CScopeVisitor, CScopeTree} from '../../analyze/scope';

import {CIRGeneratorConfig} from '../constants';
import {CIRRetInstruction} from '../instructions';
import {CIRBranchesBuilder, CIRBranchesBuilderResult} from './CIRBranchesBuilder';
import {CIRVariableAllocator} from './CIRVariableAllocator';
import {IREmitterContext} from './emitters/types';
import {InitializerIREmitResult, emitVariableInitializerIR} from './emitters';

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

  get emitterContext(): IREmitterContext {
    const {allocator, config} = this;

    return {
      config,
      allocator,
    };
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

    branchesBuilder.emit(
      allocator.allocFunctionType(fnType),
    );

    this.emitScopeVariablesIR(scope);

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
    const {variables} = scope.dump();
    const {emitterContext, branchesBuilder} = this;

    const results: InitializerIREmitResult[] = [];
    for (const [, variable] of Object.entries(variables)) {
      results.push(
        emitVariableInitializerIR(
          {
            context: emitterContext,
            scope,
            variable,
          },
        ),
      );
    }

    for (const {alloc} of results)
      branchesBuilder.emit(alloc);

    for (const {initializers} of results)
      initializers.forEach(branchesBuilder.emit.bind(branchesBuilder));
  }
}
