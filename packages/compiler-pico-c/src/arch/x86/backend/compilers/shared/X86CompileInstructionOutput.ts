export class X86CompileInstructionOutput {
  constructor(readonly asm: string[] = [], readonly data: string[] = []) {}

  appendGroup(output: X86CompileInstructionOutput) {
    const { asm, data } = this;

    asm.push(...output.asm);
    data.push(...output.data);
    return this;
  }

  appendInstructions(...asm: string[]) {
    this.asm.push(...asm);
    return this;
  }

  isEmpty() {
    return !this.asm.length && !this.data.length;
  }

  static ofBlank() {
    return new X86CompileInstructionOutput();
  }

  static ofInstructions(asm: (string | X86CompileInstructionOutput)[]) {
    return asm.reduce<X86CompileInstructionOutput>((acc, item) => {
      if (typeof item === 'string') {
        acc.asm.push(item);
      } else {
        acc.appendGroup(item);
      }

      return acc;
    }, new X86CompileInstructionOutput());
  }
}
