import {CFunctionDeclType} from '../../analyze';

import {CIROpcode} from '../constants';
import {CIRVariable} from '../variables';
import {CIRInstruction} from './CIRInstruction';
import {CIRNameGenerator} from '../generator/CIRNameGenerator';
import {IsLabeledInstruction} from '../interfaces/IsLabeledInstruction';

export function isIRFnDefInstruction(instruction: CIRInstruction): instruction is CIRFnDefInstruction {
  return instruction.opcode === CIROpcode.DEF;
}

/**
 * Definition of function
 *
 * @export
 * @class CIRFnDefInstruction
 * @extends {CIRInstruction}
 * @implements {IsLabeledInstruction}
 */
export class CIRFnDefInstruction extends CIRInstruction implements IsLabeledInstruction {
  constructor(
    readonly name: string,
    readonly args: CIRVariable[] = [],
    readonly retByteSize: number = null,
    readonly variadic: boolean = false,
  ) {
    super(CIROpcode.DEF);
  }

  override getDisplayName(): string {
    const {name, args} = this;

    return `def ${name}(${args.map((arg) => arg.getDisplayName()).join(', ')})`;
  }

  static ofFunctionDeclType(fn: CFunctionDeclType) {
    const irDefArgs = fn.args.map(arg => new CIRVariable(
      CIRNameGenerator.the.genVariableName(),
      arg.type.getByteSize(),
    ));

    return new CIRFnDefInstruction(
      fn.name,
      irDefArgs,
    );
  }
}
