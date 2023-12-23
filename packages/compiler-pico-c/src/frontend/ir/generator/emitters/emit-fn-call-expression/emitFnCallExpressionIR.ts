import { isBuiltinFnDeclType } from 'builtins/CBuiltinFnDeclType';
import {
  CArrayType,
  CPrimitiveType,
  isFuncDeclLikeType,
  isPointerLikeType,
} from 'frontend/analyze';

import { ASTCPostfixExpression } from 'frontend/parser';
import { TokenType } from '@ts-c-compiler/lexer';

import { IRError, IRErrorCode } from '../../../errors/IRError';
import {
  IRAllocInstruction,
  IRCallInstruction,
  IRLeaInstruction,
  IRMathInstruction,
} from '../../../instructions';
import { IRConstant, IRVariable, isIRVariable } from '../../../variables';

import { emitFnArgsLoadIR } from './emitFnArgsLoadIR';
import {
  appendStmtResults,
  createBlankExprResult,
  IREmitterContextAttrs,
  IREmitterExpressionResult,
} from '../types';

type FnCallExpressionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCPostfixExpression;
};

export function emitFnCallExpressionIR({
  initializerMeta,
  context,
  scope,
  node,
}: FnCallExpressionIREmitAttrs): IREmitterExpressionResult {
  const { emit, allocator, config } = context;

  const result = createBlankExprResult();
  const { output: fnPtrOutput, ...fnPtrResult } = emit.expression({
    node: node.postfixExpression,
    scope,
    context,
  });

  if (
    !isIRVariable(fnPtrOutput) ||
    !isPointerLikeType(fnPtrOutput.type) ||
    !isFuncDeclLikeType(fnPtrOutput.type.baseType)
  ) {
    throw new IRError(IRErrorCode.PROVIDED_TYPE_IS_NOT_CALLABLE, {
      typeName: fnPtrOutput?.type?.getDisplayName() ?? '<unknown>',
    });
  }

  const { baseType: fnType } = fnPtrOutput.type;
  const { returnType } = fnType;

  if (fnType.isNoIREmit()) {
    return result;
  }

  const fnArgsExprResult = emitFnArgsLoadIR({
    node: node.fnExpression || node.primaryExpression,
    context,
    scope,
  });

  appendStmtResults(fnPtrResult, result);
  appendStmtResults(fnArgsExprResult, result);

  let output: IRVariable = null;

  if (isBuiltinFnDeclType(fnType)) {
    const outputSize = fnType.getAllocOutputVarSize(fnArgsExprResult.args);

    if (outputSize) {
      const bufferType = CArrayType.ofFlattenDescriptor({
        type: CPrimitiveType.char(config.arch),
        dimensions: [outputSize],
      });

      output = allocator.allocTmpPointer(bufferType);
      const outputPtr = allocator.allocTmpPointer(bufferType);

      result.instructions.push(
        new IRAllocInstruction(bufferType, output),
        new IRLeaInstruction(output, outputPtr),
        new IRCallInstruction(fnPtrOutput, [
          ...fnArgsExprResult.args,
          outputPtr,
        ]),
      );
    } else {
      result.instructions.push(
        new IRCallInstruction(fnPtrOutput, fnArgsExprResult.args),
      );
    }
  } else if (returnType.isVoid()) {
    // do not emit output for void functions
    result.instructions.push(
      new IRCallInstruction(fnPtrOutput, fnArgsExprResult.args),
    );
  } else if (returnType.canBeStoredInReg()) {
    // emit return into tmp function if can fit into register
    result.instructions.push(
      new IRCallInstruction(
        fnPtrOutput,
        fnArgsExprResult.args,
        (output = allocator.allocTmpVariable(fnType.returnType)),
      ),
    );
  } else if (initializerMeta) {
    // handle direct assign to initializer
    const { offset, destVar } = initializerMeta;
    output = destVar;

    if (offset) {
      // array initializer
      const outputSrcAddrVar = allocator.allocPlainAddressVariable();
      const outputOffsetAddrVar = allocator.allocPlainAddressVariable();

      result.instructions.push(
        new IRLeaInstruction(output, outputSrcAddrVar),
        new IRMathInstruction(
          TokenType.PLUS,
          outputSrcAddrVar,
          IRConstant.ofConstant(CPrimitiveType.int(config.arch), offset),
          outputOffsetAddrVar,
        ),
        new IRCallInstruction(fnPtrOutput, [
          ...fnArgsExprResult.args,
          outputOffsetAddrVar,
        ]),
      );
    } else {
      const outputPtr = allocator.allocTmpPointer(output.type);

      // non array or index = 0 initializer
      result.instructions.push(
        new IRLeaInstruction(output, outputPtr),
        new IRCallInstruction(fnPtrOutput, [
          ...fnArgsExprResult.args,
          outputPtr,
        ]),
      );
    }
  } else {
    output = allocator.allocTmpPointer(fnType.returnType);
    const outputPtr = allocator.allocTmpPointer(fnType.returnType);

    result.instructions.push(
      new IRAllocInstruction(fnType.returnType, output),
      new IRLeaInstruction(output, outputPtr),
      new IRCallInstruction(fnPtrOutput, [...fnArgsExprResult.args, outputPtr]),
    );
  }

  return {
    ...result,
    output,
  };
}
