import * as R from 'ramda';

import {isCompilerTreeNode} from '@compiler/pico-c/frontend/parser';
import {CPointerType, CVariable, isInitializerTreeValue} from '@compiler/pico-c/frontend/analyze';

import {IREmitterContextAttrs} from './types';
import {CIRError, CIRErrorCode} from '../../errors/CIRError';
import {CIRAllocInstruction, CIRInstruction, CIRLeaInstruction, CIRStoreInstruction} from '../../instructions';
import {CIRConstant} from '../../variables';

import {emitExpressionIR} from './emitExpressionIR';

export type InitializerIREmitResult = {
  instructions: CIRInstruction[];
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
  const {allocator, config} = context;
  const instructions: CIRInstruction[] = [];
  const rootIRVar = allocator.allocVariable(variable);

  instructions.push(
    CIRAllocInstruction.ofIRVariable(rootIRVar),
  );

  if (variable.isInitialized()) {
    let offset: number = 0;
    const outputVarAddress = allocator.allocTmpVariable(
      CPointerType.ofType(config.arch, rootIRVar.type),
    );

    instructions.push(
      new CIRLeaInstruction(
        outputVarAddress.name,
        rootIRVar,
      ),
    );

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
            outputVarAddress.name,
            offset,
          ),
        );
      } else if (R.is(String, initializer)) {
        const argVar = allocator.getVariable(initializer);

        instructions.push(
          new CIRStoreInstruction(
            argVar,
            outputVarAddress.name,
            offset,
          ),
        );
      } else if (!R.isNil(initializer)) {
        // int abc[3] = { 1, 2, 3}
        // constant literals are of type 1
        instructions.push(
          new CIRStoreInstruction(
            CIRConstant.ofConstant(initializerType, initializer),
            outputVarAddress.name,
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
