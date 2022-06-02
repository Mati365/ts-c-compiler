import {CIRInstruction} from '../../instructions';
import {emitVariableInitializerIR, InitializerIREmitResult} from './emitVariableInitializerIR';
import {IREmitterContextAttrs, IREmitterStmtResult} from './types';

export function emitScopeInitIR(
  {
    context,
    scope,
  }: IREmitterContextAttrs,
): IREmitterStmtResult {
  const instructions: CIRInstruction[] = [];
  const {variables} = scope.dump();

  const results: InitializerIREmitResult[] = [];
  for (const [, variable] of Object.entries(variables)) {
    results.push(
      emitVariableInitializerIR(
        {
          context,
          scope,
          variable,
        },
      ),
    );
  }

  for (const {alloc} of results)
    instructions.push(alloc);

  for (const {initializers} of results) {
    initializers.forEach((initializer) => {
      instructions.push(initializer);
    });
  }

  return {
    instructions,
  };
}
