import type { IRCodeFunctionBlock } from '@compiler/pico-c/frontend/ir/generator';

export type X86BackendCompiledFunction = IRCodeFunctionBlock & {
  asm: {
    code: string[];
    label: string;
  };
};

export type X86BackendCompiledFunctions = Record<
  string,
  X86BackendCompiledFunction
>;

export class X86FunctionResolver {
  constructor(private readonly compiled: X86BackendCompiledFunctions) {}

  tryResolveFnBlock(name: string): X86BackendCompiledFunction {
    return this.compiled[name];
  }

  tryResolveFnLabel(name: string): string {
    return this.tryResolveFnBlock(name).asm.label;
  }
}
