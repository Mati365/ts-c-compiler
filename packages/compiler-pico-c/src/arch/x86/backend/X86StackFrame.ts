export class X86StackFrame {
  private allocated: number = 0;

  genAllocBytesInstruction(nth: number) {
    this.allocated += nth;
  }
}
