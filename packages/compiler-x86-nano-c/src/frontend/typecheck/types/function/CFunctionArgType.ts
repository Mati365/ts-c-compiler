import {Identity} from '@compiler/core/monads';
import {CNamedTypedEntry} from '../CNamedTypedEntry';
import {CType} from '../CType';

/**
 * Function arg that can contain name
 *
 * @export
 * @class CFunctionArgType
 * @extends {CType<CNamedTypedEntry>}
 */
export class CFunctionArgType extends CType<CNamedTypedEntry> {
  get name() { return this.value.name; }
  get type() { return this.value.type; }

  isCallable(): boolean { return true; }

  isEqual(value: Identity<CNamedTypedEntry>): boolean {
    if (!(value instanceof CFunctionArgType))
      return false;

    return this.type.isEqual(value.type);
  }

  getByteSize(): number {
    return null;
  }

  getDisplayName(): string {
    const {type, name} = this;

    return `${type.getDisplayName()} ${name || ''}`.trim();
  }
}
