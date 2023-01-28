import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';
import { IRPhiInstruction } from '@compiler/pico-c/frontend/ir/instructions';

import { CompilerInstructionFnAttrs } from '../../constants/types';
import { IRRegOwnership, isRegOwnership } from '../reg-allocator/utils';

type PhiInstructionCompilerAttrs = CompilerInstructionFnAttrs<IRPhiInstruction>;

export function compilePhiInstruction({
  instruction,
  context,
}: PhiInstructionCompilerAttrs) {
  const { vars, outputVar } = instruction;
  const {
    allocator: { regs },
  } = context;

  const inputOwnership = vars.reduce((acc, argVar) => {
    const argOwnership = regs.ownership.getVarOwnership(argVar.name);

    if (
      !isRegOwnership(argOwnership) ||
      (acc && acc.reg !== argOwnership.reg)
    ) {
      throw new CBackendError(CBackendErrorCode.INCORRECT_PHI_NODE);
    }

    return argOwnership;
  }, null as IRRegOwnership);

  regs.ownership.setOwnership(outputVar.name, { reg: inputOwnership.reg });
}
