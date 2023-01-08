import { isFuncDeclLikeType } from '../../analyze';

import { CScopeVisitor, CScopeTree } from '../../analyze/scope';
import { ASTCFunctionDefinition } from '../../parser';
import {
  IREmitterContext,
  IRGeneratorSegments,
  IRScopeGeneratorResult,
  emitUnaryLoadPtrValueIR,
  emitFunctionIR,
  emitLogicExpressionIR,
  emitExpressionIR,
  emitIdentifierGetterIR,
  emitAssignmentIR,
  emitPointerAddressExpression,
  emitBlockItemIR,
  emitVariableInitializerIR,
} from './emitters';

import { IRGeneratorConfig } from '../constants';
import { IRVariableAllocator } from './IRVariableAllocator';
import { IRInstructionFactory } from './IRInstructionFactory';
import { IRCodeSegmentBuilder, IRDataSegmentBuilder } from './segments';

/**
 * Root IR generator visitor
 */
export class IRGeneratorGlobalVisitor extends CScopeVisitor {
  readonly segments: IRGeneratorSegments = {
    code: new IRCodeSegmentBuilder(),
    data: new IRDataSegmentBuilder(),
  };

  readonly allocator: IRVariableAllocator;
  readonly context: IREmitterContext;

  constructor(readonly config: IRGeneratorConfig) {
    super();

    this.allocator = new IRVariableAllocator(config);
    this.context = {
      config,
      segments: this.segments,
      allocator: this.allocator,
      factory: new IRInstructionFactory(),
      emit: {
        expression: emitExpressionIR,
        logicExpression: emitLogicExpressionIR,
        identifierGetter: emitIdentifierGetterIR,
        pointerAddressExpression: emitPointerAddressExpression,
        assignment: emitAssignmentIR,
        unaryLoadPtrValueIR: emitUnaryLoadPtrValueIR,
        block: emitBlockItemIR,
        initializer: emitVariableInitializerIR,
      },
    };
  }

  /**
   * Returns output of IR generator
   */
  flush(): IRScopeGeneratorResult {
    const {
      allocator,
      segments: { code, data },
    } = this;

    return {
      allocator,
      segments: {
        code: code.flush(),
        data: data.flush(),
      },
    };
  }

  /**
   * Iterates over scope and emits IR
   */
  enter(scope: CScopeTree): void | boolean {
    const { segments, context } = this;
    const { parentAST } = scope;

    if (isFuncDeclLikeType(parentAST?.type)) {
      const { instructions, data } = emitFunctionIR({
        node: <ASTCFunctionDefinition>parentAST,
        context,
        scope,
      });

      segments.code.emitBulk(instructions);

      if (data) {
        segments.data.emitBulk(data);
      }

      return false;
    }
  }
}
