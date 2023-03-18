import {
  createBlankStmtResult,
  type IREmitterContextAttrs,
  type IREmitterStmtResult,
} from './types';

type GlobalDeclarationIREmitAttrs = Omit<IREmitterContextAttrs, 'scope'>;

export function emitGlobalDeclarationsIR({
  context,
}: GlobalDeclarationIREmitAttrs): IREmitterStmtResult {
  const { globalScope } = context;

  const result = createBlankStmtResult();
  const globals = globalScope.getGlobalVariables();

  setTimeout(() => {
    console.info(globals);
  });

  return result;
}
