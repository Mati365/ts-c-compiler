import {IRScopeGeneratorResult} from '@compiler/pico-c/frontend/ir/generator';
import {CAbstractArchBackend} from '@compiler/pico-c/backend/abstract/CAbstractArchBackend';
import {CBackendCompilerResult} from '@compiler/pico-c/backend/constants/types';

export class X86ArchBackend extends CAbstractArchBackend {
  compileIR(ir: IRScopeGeneratorResult): CBackendCompilerResult {
    console.info(ir);
    return null;
  }
}
