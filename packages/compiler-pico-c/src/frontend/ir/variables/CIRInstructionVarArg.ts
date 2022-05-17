import {IsPrintable} from '@compiler/core/interfaces';
import {CPrimitiveType} from '../../analyze';

/**
 * Just wrapper for scalar or variable name
 *
 * @export
 * @class CIRInstructionVarArg
 * @implements {IsPrintable}
 */
export class CIRInstructionVarArg implements IsPrintable {
  /**
   * Create literal constant value arg
   *
   * @static
   * @param {CPrimitiveType} type
   * @param {number} constant
   * @return {CIRInstructionVarArg}
   * @memberof CIRInstructionVarArg
   */
  static ofConstant(type: CPrimitiveType, constant: number): CIRInstructionVarArg {
    return new CIRInstructionVarArg(null, type, constant);
  }

  constructor(
    readonly name: string,
    readonly type?: CPrimitiveType,
    readonly constant?: number,
  ) {}

  getDisplayName(): string {
    return this.name ?? this.constant.toString();
  }

  isConstant() {
    return !this.name;
  }
}
