import {getIRTypeDisplayName} from '../dump';

import {IsPrintable} from '@compiler/core/interfaces';
import {Identity} from '@compiler/core/monads';
import {CType} from '../../analyze';

export type CIRConstantDescriptor = {
  constant: number,
  type: CType,
};

/**
 * Constant literal used in expressions generators
 *
 * @export
 * @class CIRConstantDescriptor
 * @implements {IsPrintable}
 */
export class CIRConstant
  extends Identity<CIRConstantDescriptor>
  implements IsPrintable {

  static ofConstant(type: CType, constant: number) {
    return new CIRConstant(
      {
        type,
        constant,
      },
    );
  }

  get type() { return this.value.type; }
  get constant() { return this.value.constant; }

  getDisplayName(): string {
    const {constant, type} = this.value;

    return `%${constant}${getIRTypeDisplayName(type)}`;
  }
}
