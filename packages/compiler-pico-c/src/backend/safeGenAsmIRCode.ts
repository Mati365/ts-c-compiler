import {Result, err, ok} from '@compiler/core/monads';
import {X86ArchBackend} from '../arch/x86';

import {CCompilerArch, CCompilerConfig} from '../constants';
import {IRScopeGeneratorResult} from '../frontend/ir/generator';
import {CAbstractArchBackend} from './abstract/CAbstractArchBackend';
import {CBackendCompilerResult} from './constants/types';
import {CBackendError, CBackendErrorCode} from './errors/CBackendError';

type CAbstractBackendConstructor = {
  new (config: CCompilerConfig): CAbstractArchBackend,
};

const CCOMPILER_ARCH_BACKENDS: Record<CCompilerArch, CAbstractBackendConstructor> = {
  [CCompilerArch.X86_16]: X86ArchBackend,
};

export function genASMIRCode(
  config: CCompilerConfig,
  ir: IRScopeGeneratorResult,
): Result<CBackendCompilerResult, CBackendError[]> {
  try {
    const CompilerBackend = CCOMPILER_ARCH_BACKENDS[config.arch];

    return ok(
      (new CompilerBackend(config)).compileIR(ir),
    );
  } catch (e) {
    e.code = e.code ?? CBackendErrorCode.UNKNOWN_BACKEND_ERROR;

    return err(
      [
        e,
      ],
    );
  }
}
