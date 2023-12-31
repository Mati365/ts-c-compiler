import { withBuiltinPrefix } from 'builtins';

import { X86CompilerInstructionFnAttrs } from 'arch/x86/constants/types';
import { IRCallInstruction } from 'frontend/ir/instructions';
import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import { compileBuiltinVaArg, compileBuiltinVaStart } from './va';
import { compileBuiltinAlloca } from './compileBuiltinAlloca';
import { X86CompileInstructionOutput } from '../shared';

type BuiltinFnCallAttrs = X86CompilerInstructionFnAttrs<IRCallInstruction>;

export const compileBuiltinCallFn = (attrs: BuiltinFnCallAttrs) => {
  const { fnPtr } = attrs.instruction;

  switch (fnPtr.name) {
    case withBuiltinPrefix('alloca'):
      return compileBuiltinAlloca(attrs);

    case withBuiltinPrefix('va_start'):
      return compileBuiltinVaStart(attrs);

    case withBuiltinPrefix('va_arg'):
      return compileBuiltinVaArg(attrs);

    case withBuiltinPrefix('va_end'):
      return X86CompileInstructionOutput.ofInstructions([]);

    default:
      throw new CBackendError(CBackendErrorCode.UNKNOWN_BUILTIN_FUNCTION, {
        name: fnPtr.name,
      });
  }
};
