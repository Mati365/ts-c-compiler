import {CIROpcode} from '../constants';
import {CIRInstruction, CIRVarName} from './CIRInstruction';

/**
 * PHI instruction
 *
 * @export
 * @class CIRPhiInstruction
 * @extends {CIRInstruction}
 */
export class CIRPhiInstruction extends CIRInstruction {
  constructor(
    readonly output: CIRVarName,
    readonly vars: CIRVarName[],
  ) {
    super(CIROpcode.PHI);
  }

  override getDisplayName(): string {
    const {output, vars} = this;

    return `${output} = φ(${vars.join(', ')})`;
  }
}
