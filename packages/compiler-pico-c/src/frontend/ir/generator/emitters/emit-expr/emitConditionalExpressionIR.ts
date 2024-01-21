import type { ASTCConditionalExpression } from 'frontend';
import {
  IREmitterContextAttrs,
  IREmitterExpressionResult,
  appendStmtResults,
  createBlankExprResult,
} from '../types';

import {
  IRAllocInstruction,
  IRAssignInstruction,
  IRBrInstruction,
  IRICmpInstruction,
  IRJmpInstruction,
  IRLeaInstruction,
  IRPhiInstruction,
} from '../../../instructions';
import { LogicBinaryExpressionLabels } from './emitLogicBinaryJmpExpressionIR';
import { TokenType } from '@ts-c-compiler/lexer';
import { IRConstant } from '../../../variables';
import { CPrimitiveType } from 'frontend/analyze';

type LogicExpressionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCConditionalExpression;
  asIdentifierGetter?: boolean;
};

export function emitConditionalExpressionIR({
  context,
  node,
  scope,
  asIdentifierGetter,
}: LogicExpressionIREmitAttrs): IREmitterExpressionResult {
  const { allocator, emit, factory, config } = context;
  const { arch } = config;

  const outputVar = allocator.allocTmpVariable(node.type);
  const result = createBlankExprResult([], outputVar);
  const { instructions } = result;

  instructions.push(new IRAllocInstruction(node.type, outputVar));

  const finallyLabel = factory.labels.genTmpLabelInstruction();
  const labels: LogicBinaryExpressionLabels = {
    ifTrueLabel: factory.labels.genTmpLabelInstruction(),
    ifFalseLabel: factory.labels.genTmpLabelInstruction(),
  };

  const logicResult = emit.expression({
    scope,
    node: node.logicalExpression,
    context: {
      ...context,
      conditionStmt: {
        labels,
      },
    },
  });

  const { output } = logicResult;
  appendStmtResults(logicResult, result);

  if (output) {
    // if (a > 2)
    if (output?.type.isFlag()) {
      instructions.push(new IRBrInstruction(output, null, labels.ifFalseLabel));
    } else {
      // if (a)
      const tmpFlagResult = allocator.allocFlagResult();

      instructions.push(
        new IRICmpInstruction(
          TokenType.DIFFERS,
          output,
          IRConstant.ofConstant(CPrimitiveType.int(arch), 0x0),
          tmpFlagResult,
        ),
        new IRBrInstruction(tmpFlagResult, null, labels.ifFalseLabel),
      );
    }
  }

  const outputs = {
    true: allocator.allocTmpVariable(node.type),
    false: allocator.allocTmpVariable(node.type),
  };

  if (asIdentifierGetter) {
    const exprResults = {
      true: emit.identifierGetter({
        emitValueAtAddress: false,
        node: node.trueExpression,
        scope,
        context,
      }),
      false: emit.identifierGetter({
        emitValueAtAddress: false,
        node: node.falseExpression,
        scope,
        context,
      }),
    };

    const phi = new IRPhiInstruction(
      [outputs.true.ofPointerType(), outputs.false.ofPointerType()],
      outputVar,
    );

    instructions.push(labels.ifTrueLabel.ofPhi(phi));

    appendStmtResults(exprResults.true, result);

    instructions.push(
      new IRLeaInstruction(
        exprResults.true.output,
        outputs.true.ofPointerType(),
        { phi },
      ),
      new IRJmpInstruction(finallyLabel.ofPhi(phi)),
      labels.ifFalseLabel.ofPhi(phi),
    );

    appendStmtResults(exprResults.false, result);

    instructions.push(
      new IRLeaInstruction(
        exprResults.false.output,
        outputs.false.ofPointerType(),
        { phi },
      ),
      finallyLabel.ofPhi(phi),
      phi,
    );

    return result;
  } else {
    const exprResults = {
      true: emit.expression({
        node: node.trueExpression,
        scope,
        context,
      }),
      false: emit.expression({
        node: node.falseExpression,
        scope,
        context,
      }),
    };

    const phi = new IRPhiInstruction([outputs.true, outputs.false], outputVar);

    instructions.push(labels.ifTrueLabel.ofPhi(phi));

    appendStmtResults(exprResults.true, result);

    instructions.push(
      new IRAssignInstruction(exprResults.true.output, outputs.true, { phi }),
      new IRJmpInstruction(finallyLabel.ofPhi(phi)),
      labels.ifFalseLabel.ofPhi(phi),
    );

    appendStmtResults(exprResults.false, result);

    instructions.push(
      new IRAssignInstruction(exprResults.false.output, outputs.false, { phi }),
      finallyLabel.ofPhi(phi),
      phi,
    );

    return result;
  }
}
