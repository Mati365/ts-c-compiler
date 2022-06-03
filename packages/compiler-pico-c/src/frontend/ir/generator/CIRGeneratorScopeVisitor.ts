import {isFuncDeclLikeType} from '../../analyze';

import {CScopeVisitor, CScopeTree} from '../../analyze/scope';
import {ASTCFunctionDefinition} from '../../parser';
import {
  IREmitterContext,
  emitFunctionIR,
  emitExpressionIR,
  emitLvalueExpression,
  emitAssignmentIR,
  emitPointerExpression,
  emitPointerAddressExpression,
} from './emitters';

import {CIRGeneratorConfig} from '../constants';
import {CIRBranchesBuilder, CIRBranchesBuilderResult} from './CIRBranchesBuilder';
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

  get emitterContext(): IREmitterContext {
    const {allocator, config} = this;

    return {
      config,
      allocator,
      emit: {
        expression: emitExpressionIR,
        lvalueExpression: emitLvalueExpression,
        pointerExpression: emitPointerExpression,
        pointerAddressExpression: emitPointerAddressExpression,
        assignment: emitAssignmentIR,
      },
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
    const {branchesBuilder} = this;
    const {parentAST} = scope;

    if (isFuncDeclLikeType(parentAST?.type)) {
      const {instructions} = emitFunctionIR(
        {
          node: <ASTCFunctionDefinition> parentAST,
          context: this.emitterContext,
          scope,
        },
      );

      branchesBuilder.emitBulk(instructions);
      return false;
    }
  }
}
