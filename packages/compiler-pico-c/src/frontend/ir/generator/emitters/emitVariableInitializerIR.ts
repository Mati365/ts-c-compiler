import * as R from 'ramda';

import {isCompilerTreeNode} from '@compiler/pico-c/frontend/parser';

import {CVariable, isInitializerTreeValue} from '@compiler/pico-c/frontend/analyze';
import {IREmitterContextAttrs} from './types';

import {CIRError, CIRErrorCode} from '../../errors/CIRError';
import {CIRAllocInstruction, CIRInstruction, CIRStoreInstruction} from '../../instructions';
import {CIRConstant} from '../../variables';

import {emitExpressionIR} from './emitExpressionIR';

export type InitializerIREmitResult = {
  alloc: CIRAllocInstruction;
  initializers: CIRInstruction[];
};

type InitializerIREmitAttrs = IREmitterContextAttrs & {
  variable: CVariable;
};

export function emitVariableInitializerIR(
  {
    scope,
    context,
    variable,
  }: InitializerIREmitAttrs,
): InitializerIREmitResult {
  const {allocator} = context;

  const rootIRVar = allocator.allocVariable(variable);
  const instructions: CIRInstruction[] = [];

  if (variable.isInitialized()) {
    variable.initializer.fields.forEach((initializer, offset) => {
      if (isInitializerTreeValue(initializer)) {
        throw new CIRError(CIRErrorCode.INCORRECT_INITIALIZER_BLOCK);
      }

      if (isCompilerTreeNode(initializer)) {
        const exprResult = emitExpressionIR(
          {
            parentVar: rootIRVar,
            node: initializer,
            scope,
            context,
          },
        );

        instructions.push(
          ...exprResult.instructions,
          new CIRStoreInstruction(
            exprResult.outputVar,
            rootIRVar.name,
            offset,
          ),
        );
      } else if (R.is(String, initializer)) {
        const argVar = allocator.getVariable(initializer);

        instructions.push(
          new CIRStoreInstruction(
            argVar,
            rootIRVar.name,
            offset,
          ),
        );
      } else if (!R.isNil(initializer)) {
        // int abc[3] = { 1, 2, 3}
        // constant literals are of type 1
        const type = variable.initializer.getOffsetExpectedType(offset);

        instructions.push(
          new CIRStoreInstruction(
            CIRConstant.ofConstant(type, initializer),
            rootIRVar.name,
            offset,
          ),
        );
      }
    });
  }

  return {
    alloc: CIRAllocInstruction.ofIRVariable(rootIRVar),
    initializers: instructions,
  };
}
