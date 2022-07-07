import {CCompilerConfig} from '../../constants';
import {IRScopeGeneratorResult} from '../../frontend/ir/generator';
import {CBackendCompileResult} from '../constants/types';

export abstract class CAbstractArchBackend {
  constructor(
    readonly config: CCompilerConfig,
  ) {}

  abstract compileIR(ir: IRScopeGeneratorResult): CBackendCompileResult;
}
