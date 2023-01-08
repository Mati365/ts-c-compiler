import { IRError, IRErrorCode } from '../../errors/IRError';
import {
  IRFnDeclInstruction,
  IRInstruction,
  isIRFnDeclInstruction,
  isIRFnEndDeclInstruction,
} from '../../instructions';

import { IRInstructionsBlock } from '../../instructions/IRInstructionsBlock';
import { IRSegmentBuilder } from './IRSegmentBuilder';

export type IRCodeFunctionBlock = {
  declaration: IRFnDeclInstruction;
  block: IRInstructionsBlock;
};

export type IRFunctionsMap = Record<string, IRCodeFunctionBlock>;

export type IRCodeSegmentBuilderResult = {
  functions: IRFunctionsMap;
};

/**
 * Constructs map of functions that will be later passed to optimizer
 */
export class IRCodeSegmentBuilder extends IRSegmentBuilder<IRCodeSegmentBuilderResult> {
  private functions: IRFunctionsMap = {};
  private tmpFunction: IRCodeFunctionBlock = null;

  private get instructions() {
    return this.tmpFunction.block.instructions;
  }

  /**
   * Removes last instruction from stack
   */
  pop(): IRInstruction {
    return this.instructions.pop();
  }

  /**
   * If instruction is function - add new block
   */
  emit(instruction: IRInstruction): this {
    // create new block, `def` has been spotted
    if (isIRFnDeclInstruction(instruction)) {
      if (this.tmpFunction) {
        throw new IRError(IRErrorCode.MISSING_END_FUNCTION_DECLARATION);
      }

      this.tmpFunction = {
        declaration: instruction,
        block: new IRInstructionsBlock({
          name: instruction.name,
          instructions: [instruction],
          jmps: {},
        }),
      };

      return this;
    }

    this.instructions.push(instruction);

    // flush current block, `end-def` has been spotted
    if (isIRFnEndDeclInstruction(instruction)) {
      this.functions[this.tmpFunction.block.name] = this.tmpFunction;
      this.tmpFunction = null;
    }

    return this;
  }

  /**
   * Cleanups temp instructions stack and returns graph
   */
  flush(): IRCodeSegmentBuilderResult {
    return {
      functions: this.functions,
    };
  }
}
