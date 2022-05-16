import {CVariableInitializerTree} from './CVariableInitializerTree';
import {CNamedTypedEntry, CNamedTypedEntryDescriptor} from './CNamedTypedEntry';
import {CVariableInitializerPrintVisitor} from '../../ast/initializer-builder/CVariableInitializerPrintVisitor';

export type CVariableDescriptor = CNamedTypedEntryDescriptor & {
  global?: boolean,
  fnArg?: boolean,
  initializer?: CVariableInitializerTree,
};

/**
 * Pair name and type with additional global flag
 *
 * @export
 * @class CVariable
 * @extends {CNamedTypedEntry<CVariableDescriptor>}
 */
export class CVariable extends CNamedTypedEntry<CVariableDescriptor> {
  static ofFunctionArg(entry: CNamedTypedEntry) {
    return new CVariable(
      {
        ...entry.unwrap(),
        fnArg: true,
      },
    );
  }

  static ofInitializedEntry(entry: CNamedTypedEntry, initializer?: CVariableInitializerTree) {
    return new CVariable(
      {
        ...entry.unwrap(),
        initializer,
      },
    );
  }

  get initializer() { return this.value.initializer; }

  isGlobal() { return this.value.global; }
  isInitialized() { return !!this.initializer; }

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

  /**
   * Sets initializer and returns new instance
   *
   * @param {CVariableInitializerTree} initializer
   * @return {CVariable}
   * @memberof CVariable
   */
  ofInitializer(initializer: CVariableInitializerTree): CVariable {
    return this.map((value) => ({
      ...value,
      initializer,
    }));
  }

  override getDisplayName() {
    let str = super.getDisplayName();

    if (this.isInitialized())
      str += ` = ${CVariableInitializerPrintVisitor.serializeToString(this.initializer)}`;

    return str;
  }
}
