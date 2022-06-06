import {IRInstruction} from '../../instructions';

export abstract class IRSegmentBuilder<T> {
  /**
   * Emits multiple instructions at once
   *
   * @param {IRInstruction[]} instructions
   * @memberof IRSegmentBuilder<T>
   */
  emitBulk(instructions: IRInstruction[]): this {
    instructions.forEach(this.emit.bind(this));
    return this;
  }

  abstract emit(instruction: IRInstruction): this;
  abstract flush(): T;
}
