import {IRError, IRErrorCode} from '../errors/IRError';
import {
  IRIfInstruction, IRInstruction,
  isIRIfInstruction, isIRRetInstruction,
} from '../instructions';

import {IRInstructionsBlock} from '../instructions/IRInstructionsBlock';
import {isIRLabeledInstruction} from '../guards';

export type IRBlockLabelsMap = Record<string, IRInstructionsBlock>;
export type IRBranchesBuilderResult = {
  blocks: IRBlockLabelsMap,
};

/**
 * Constructs graph of connected by jumps code blocks
 *
 * @export
 * @class IRBranchesBuilder
 */
export class IRBranchesBuilder {
  private blocks: IRBlockLabelsMap = {};
  private unresolvedBlockBranches: VoidFunction[] = [];
  private tmpBlock = IRInstructionsBlock.ofInstructions([]);

  get lastInstruction() {
    return this.tmpBlock.lastInstruction;
  }

  /**
   * Removes last instruction from stack
   *
   * @return {IRInstruction}
   * @memberof IRBranchesBuilder
   */
  pop(): IRInstruction {
    return this.tmpBlock.instructions.pop();
  }

  /**
   * If instruction is branch - flush instruction stack and add new block
   *
   * @param {IRInstruction} instruction
   * @memberof IRBranchesBuilder
   */
  emit(instruction: IRInstruction): this {
    const {tmpBlock} = this;
    const {instructions} = tmpBlock;

    instructions.push(instruction);

    if (isIRLabeledInstruction(instruction))
      this.tmpBlock = tmpBlock.ofName(instruction.name);
    else if (isIRIfInstruction(instruction))
      this.appendIfBranch(instruction);
    else if (isIRRetInstruction(instruction))
      this.flush();

    return this;
  }

  /**
   * Emits multiple instructions at once
   *
   * @param {IRInstruction[]} instructions
   * @memberof IRBranchesBuilder
   */
  emitBulk(instructions: IRInstruction[]): this {
    instructions.forEach(this.emit.bind(this));
    return this;
  }

  /**
   * Cleanups temp instructions stack and returns graph
   *
   * @return {IRBranchesBuilderResult}
   * @memberof IRBranchesBuilder
   */
  flush(): IRBranchesBuilderResult {
    this.setBlock(this.tmpBlock);
    this.tmpBlock = IRInstructionsBlock.ofInstructions([]);

    return {
      blocks: this.blocks,
    };
  }

  /**
   * Creates new code block of tmp and resets actual tmpBlock
   *
   * @private
   * @param {IRIfInstruction} instruction
   * @memberof IRBranchesBuilder
   */
  private appendIfBranch(instruction: IRIfInstruction) {
    const {tmpBlock, unresolvedBlockBranches} = this;
    const {ifTrue, ifFalse} = instruction;

    if (!tmpBlock.name)
      throw new IRError(IRErrorCode.MISSING_BLOCK_NAME);

    const tryResolveJmps = () => ({
      ifTrue: this.blocks[ifTrue.name],
      ifFalse: this.blocks[ifFalse?.name],
    });

    const newBlock = tmpBlock.ofJmps(tryResolveJmps());
    if (newBlock.hasSatisfiedRelations(instruction)) {
      unresolvedBlockBranches.push(() => {
        this.setBlock(newBlock.ofJmps(tryResolveJmps()));
      });
    }

    this.setBlock(newBlock);
    this.tmpBlock = IRInstructionsBlock.ofInstructions([]);
  }

  /**
   * Appends new block to blocks map, raises errors if fails
   *
   * @private
   * @param {IRInstructionsBlock} block
   * @return  {this}
   * @memberof IRBranchesBuilder
   */
  private setBlock(block: IRInstructionsBlock): this {
    if (block.isEmpty())
      return this;

    if (!block.name)
      throw new IRError(IRErrorCode.MISSING_BLOCK_NAME);

    this.blocks[block.name] = block;
    return this;
  }
}
