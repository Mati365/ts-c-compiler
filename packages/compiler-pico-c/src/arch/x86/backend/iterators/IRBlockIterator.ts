import {IRInstruction, isIRFnEndDeclInstruction} from '@compiler/pico-c/frontend/ir/instructions';

export class IRBlockIterator {
  private _offset: number = 0;

  constructor(
    readonly instructions: IRInstruction[],
  ) {}

  static of(instructions: IRInstruction[]) {
    return new IRBlockIterator(instructions);
  }

  get offset() { return this._offset; }
  get nextInstruction() {
    return this.instructions[this._offset + 1];
  }

  next() {
    ++this._offset;
  }

  walk(
    fn: (instruction: IRInstruction, iterator: IRBlockIterator) => void,
    startOffset: number = this._offset,
  ) {
    const {instructions} = this;

    this._offset = startOffset;
    for (
      ; this._offset < instructions.length && !isIRFnEndDeclInstruction(this.instructions[this._offset])
      ; ++this._offset
    ) {
      fn(instructions[this._offset], this);
    }
  }
}
