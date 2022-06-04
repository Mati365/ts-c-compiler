import * as R from 'ramda';

import {isCompilerTreeNode} from '@compiler/pico-c/frontend/parser';
import {CVariable, isInitializerTreeValue} from '@compiler/pico-c/frontend/analyze';

import {IREmitterContextAttrs} from './types';
import {CIRError, CIRErrorCode} from '../../errors/CIRError';
import {CIRAllocInstruction, CIRInstruction, CIRStoreInstruction} from '../../instructions';
import {CIRConstant} from '../../variables';

import {emitExpressionIR} from './emitExpressionIR';

export type InitializerIREmitResult = {
  instructions: CIRInstruction[];
};

type InitializerIREmitAttrs = IREmitterContextAttrs & {
  variable: CVariable;
};

/**
 * Emit initializers for arrays with <= 3 directly.
 * If there is >= 3 emit only pointer to labeled value such as:
 *
 * array = &(label)
 * label:
 *  db 5
 *  db 8
 *  db 9
 */
export function emitVariableInitializerIR(
  {
    scope,
    context,
    variable,
  }: InitializerIREmitAttrs,
): InitializerIREmitResult {
  const {allocator} = context;
  const instructions: CIRInstruction[] = [];
  const rootIRVar = allocator.allocVariable(variable);

  instructions.push(
    new CIRAllocInstruction(rootIRVar),
  );

  if (variable.isInitialized()) {
    let offset: number = 0;

    variable.initializer.fields.forEach((initializer, index) => {
      if (isInitializerTreeValue(initializer))
        throw new CIRError(CIRErrorCode.INCORRECT_INITIALIZER_BLOCK);

      const initializerType = variable.initializer.getIndexExpectedType(index);
      if (isCompilerTreeNode(initializer)) {
        const exprResult = emitExpressionIR(
          {
            type: rootIRVar.type,
            node: initializer,
            scope,
            context,
          },
        );

        instructions.push(
          ...exprResult.instructions,
          new CIRStoreInstruction(
            exprResult.output,
            rootIRVar,
            offset,
          ),
        );
      } else if (R.is(String, initializer)) {
        const argVar = allocator.getVariable(initializer);

        instructions.push(
          new CIRStoreInstruction(
            argVar,
            rootIRVar,
            offset,
          ),
        );
      } else if (!R.isNil(initializer)) {
        // int abc[3] = { 1, 2, 3}
        // constant literals are of type 1
        instructions.push(
          new CIRStoreInstruction(
            CIRConstant.ofConstant(initializerType, initializer),
            rootIRVar,
            offset,
          ),
        );
      }

      offset += initializerType.getByteSize();
    });
  }

  return {
    instructions,
  };
}
