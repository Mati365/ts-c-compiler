import {isFuncDeclLikeType} from '../../analyze';
import {optimizeInstructionsList} from './optimization';

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

import {IRGeneratorConfig} from '../constants';
import {IRBranchesBuilder, IRBranchesBuilderResult} from './IRBranchesBuilder';
import {IRVariableAllocator} from './IRVariableAllocator';

/**
 * Root IR generator visitor
 *
 * @export
 * @class IRGeneratorScopeVisitor
 * @extends {CScopeVisitor}
 */
export class IRGeneratorScopeVisitor extends CScopeVisitor {
  readonly branchesBuilder = new IRBranchesBuilder;
  readonly allocator = new IRVariableAllocator;
  readonly context: IREmitterContext;

  constructor(
    readonly config: IRGeneratorConfig,
  ) {
    super();

    this.context = {
      config,
      allocator: this.allocator,
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
   * @return {IRBranchesBuilderResult}
   * @memberof IRGeneratorScopeVisitor
   */
  flush(): IRBranchesBuilderResult {
    return this.branchesBuilder.flush();
  }

  /**
   * Iterates over scope and emits IR
   *
   * @param {CScopeTree} scope
   * @memberof IRGeneratorScopeVisitor
   */
  enter(scope: CScopeTree): void | boolean {
    const {branchesBuilder, context} = this;
    const {parentAST} = scope;

    if (isFuncDeclLikeType(parentAST?.type)) {
      const {instructions} = emitFunctionIR(
        {
          node: <ASTCFunctionDefinition> parentAST,
          context,
          scope,
        },
      );

      branchesBuilder.emitBulk(
        optimizeInstructionsList({}, instructions),
      );

      return false;
    }
  }
}
