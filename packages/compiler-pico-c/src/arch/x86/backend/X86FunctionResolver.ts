import type { IRCodeFunctionBlock } from '@compiler/pico-c/frontend/ir/generator';

export type BackendCompiledFunctions = Record<
  string,
  IRCodeFunctionBlock & {
    asm: {
      code: string[];
      label: string;
    };
  }
>;

export class X86FunctionResolver {
  constructor(private readonly compiled: BackendCompiledFunctions) {}

  tryResolveFnLabel(name: string) {
    return this.compiled[name].asm.label;
  }
}
