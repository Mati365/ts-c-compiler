import {IsOutputInstruction} from '../interfaces';
import {CIROpcode} from '../constants';
import {CIRInstruction} from './CIRInstruction';

/**
 * PHI instruction
 *
 * @export
 * @class CIRPhiInstruction
 * @extends {CIRInstruction}
 * @implements {IsOutputInstruction}
 */
export class CIRPhiInstruction extends CIRInstruction implements IsOutputInstruction {
  constructor(
    readonly vars: string[],
    readonly outputVar: string,
  ) {
    super(CIROpcode.PHI);
  }

  override getDisplayName(): string {
    const {outputVar, vars} = this;

    return `${outputVar} = φ(${vars.join(', ')})`;
  }
}
