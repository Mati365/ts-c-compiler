import {isFuncDeclLikeType} from '../../analyze';
import {optimizeInstructionsList} from './optimization';

import {CScopeVisitor, CScopeTree} from '../../analyze/scope';
import {ASTCFunctionDefinition} from '../../parser';
import {
  IREmitterContext,
  IRGeneratorSegments,
  emitFunctionIR,
  emitExpressionIR,
  emitLvalueExpression,
  emitAssignmentIR,
  emitPointerExpression,
  emitPointerAddressExpression,
  IRScopeGeneratorResult,
} from './emitters';

import {IRGeneratorConfig} from '../constants';
import {IRVariableAllocator} from './IRVariableAllocator';
import {
  IRCodeSegmentBuilder,
  IRDataSegmentBuilder,
} from './segments';

/**
 * Root IR generator visitor
 *
 * @export
 * @class IRGeneratorScopeVisitor
 * @extends {CScopeVisitor}
 */
export class IRGeneratorScopeVisitor extends CScopeVisitor {
  readonly segments: IRGeneratorSegments = {
    code: new IRCodeSegmentBuilder,
    data: new IRDataSegmentBuilder,
  };

  readonly allocator: IRVariableAllocator;
  readonly context: IREmitterContext;

  constructor(
    readonly config: IRGeneratorConfig,
  ) {
    super();

    this.allocator = new IRVariableAllocator(config);
    this.context = {
      config,
      segments: this.segments,
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
   * @return {IRScopeGeneratorResult}
   * @memberof IRGeneratorScopeVisitor
   */
  flush(): IRScopeGeneratorResult {
    const {
      segments: {
        code,
        data,
      },
    } = this;

    return {
      segments: {
        code: code.flush(),
        data: data.flush(),
      },
    };
  }

  /**
   * Iterates over scope and emits IR
   *
   * @param {CScopeTree} scope
   * @memberof IRGeneratorScopeVisitor
   */
  enter(scope: CScopeTree): void | boolean {
    const {segments, context} = this;
    const {parentAST} = scope;

    if (isFuncDeclLikeType(parentAST?.type)) {
      const {
        instructions,
        data,
      } = emitFunctionIR(
        {
          node: <ASTCFunctionDefinition> parentAST,
          context,
          scope,
        },
      );

      segments.code.emitBulk(
        optimizeInstructionsList(instructions),
      );

      if (data)
        segments.data.emitBulk(data);

      return false;
    }
  }
}
