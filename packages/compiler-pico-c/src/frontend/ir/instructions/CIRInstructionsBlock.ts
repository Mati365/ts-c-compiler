import * as R from 'ramda';

import {Identity} from '@compiler/core/monads';
import {CIRInstruction} from './CIRInstruction';
import {CIRBranchRelations} from './CIRIfInstruction';

export type CIRBlockJmps = Partial<CIRBranchRelations<CIRInstructionsBlock>> & {
  always?: CIRInstructionsBlock;
};

type CIRInstructionsBlockDescriptor = {
  name?: string;
  instructions: CIRInstruction[],
  jmps?: CIRBlockJmps,
};

/**
 * See it as a block of instructions that are not separated
 * by any jmp or label. Something like IDA "instructions block"
 *
 * @export
 * @class CIRInstructionsBlock
 * @extends {Identity<CIRInstructionsBlockDescriptor>}
 */
export class CIRInstructionsBlock extends Identity<CIRInstructionsBlockDescriptor> {
  /**
   * Creates branchless block monad
   *
   * @static
   * @param {CIRInstruction[]} instructions
   * @return {CIRInstructionsBlock}
   * @memberof CIRInstructionsBlock
   */
  static ofInstructions(instructions: CIRInstruction[]): CIRInstructionsBlock {
    return new CIRInstructionsBlock(
      {
        instructions,
      },
    );
  }

  get name() { return this.value.name; }
  get jmps() { return this.value.jmps; }
  get instructions() { return this.value.instructions; }

  isEmpty() {
    return R.isEmpty(this.instructions);
  }

  hasSatisfiedRelations(relations: CIRBranchRelations<unknown>) {
    const {jmps} = this;

    return (
      !jmps.ifFalse === !relations.ifFalse
        && !!jmps.ifTrue === !relations.ifTrue
    );
  }

  /**
   * Appends jmps map to instructions block
   *
   * @param {CIRBlockJmps} jmps
   * @return {this}
   * @memberof CIRInstructionsBlock
   */
  ofJmps(jmps: CIRBlockJmps): this {
    return this.map((value) => ({
      ...value,
      jmps,
    }));
  }

  /**
   * Construct specific instructions block of specific name
   *
   * @param {string} name
   * @return {this}
   * @memberof CIRInstructionsBlock
   */
  ofName(name: string): this {
    return this.map((value) => ({
      ...value,
      name,
    }));
  }
}
