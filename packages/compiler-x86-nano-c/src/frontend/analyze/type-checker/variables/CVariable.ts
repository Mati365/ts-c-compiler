import {CNamedTypedEntry, CNamedTypedEntryDescriptor} from '../types/parts';

export type CVariableDescriptor = CNamedTypedEntryDescriptor & {
  global?: boolean,
};

/**
 * Pair name and type with additional global flag
 *
 * @export
 * @class CVariable
 * @extends {CNamedTypedEntry<CVariableDescriptor>}
 */
export class CVariable extends CNamedTypedEntry<CVariableDescriptor> {
  /**
   * Sets global flag and return new instance
   *
   * @param {boolean} [global=true]
   * @return {CVariable}
   * @memberof CVariable
   */
  ofGlobalScope(global: boolean = true): CVariable {
    return this.map((value) => ({
      ...value,
      global,
    }));
  }

  isGlobal() {
    return this.value.global;
  }
}
