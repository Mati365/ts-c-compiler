import { IRLabelInstruction } from '../instructions';

export class IRInstructionFactory {
  readonly counters = {
    labels: 0,
  };

  genTmpLabelName() {
    return `L${++this.counters.labels}`;
  }

  genTmpLabelInstruction() {
    return new IRLabelInstruction(this.genTmpLabelName());
  }
}
