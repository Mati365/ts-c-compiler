import {
  CPrimitiveType,
  CVariableInitializerTree,
} from '@compiler/pico-c/frontend/analyze';

import { IRDefDataInstruction, type IRInstruction } from '../../instructions';
import type { IREmitterContextAttrs } from './types';

type GlobalDeclarationIREmitAttrs = Omit<IREmitterContextAttrs, 'scope'>;

export function emitGlobalDeclarationsIR({
  context,
}: GlobalDeclarationIREmitAttrs): IRInstruction[] {
  const { globalScope, config, allocator } = context;
  const { arch } = config;

  const instructions: IRInstruction[] = [];
  const globals = globalScope.getGlobalVariables();

  for (const [, variable] of Object.entries(globals)) {
    const tmpOutputVar = allocator.allocDataVariable(variable.type);
    const initializer =
      variable.initializer ??
      CVariableInitializerTree.ofByteArray({
        baseType: CPrimitiveType.char(arch),
        length: variable.type.getByteSize(),
      });

    instructions.push(new IRDefDataInstruction(initializer, tmpOutputVar));
  }

  return instructions;
}
