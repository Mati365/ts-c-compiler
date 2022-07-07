import {CCompilerConfig} from '../../constants';
import {IRScopeGeneratorResult} from '../../frontend/ir/generator';
import {CBackendCompilerResult} from '../constants/types';

export abstract class CAbstractArchBackend {
  constructor(
    readonly config: CCompilerConfig,
  ) {}

  abstract compileIR(ir: IRScopeGeneratorResult): CBackendCompilerResult;
}
