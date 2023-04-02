import { CVariableInitializerTree } from './CVariableInitializerTree';
import {
  CNamedTypedEntry,
  CNamedTypedEntryDescriptor,
} from './CNamedTypedEntry';
import { CVariableInitializerPrintVisitor } from '../../ast/initializer-builder/CVariableInitializerPrintVisitor';
import { CType } from '../../types';

export type CVariableDescriptor = CNamedTypedEntryDescriptor & {
  global?: boolean;
  fnArg?: boolean;
  initializer?: CVariableInitializerTree;
};

/**
 * Pair name and type with additional global flag
 */
export class CVariable extends CNamedTypedEntry<CVariableDescriptor> {
  static ofFunctionArg(entry: CNamedTypedEntry) {
    return new CVariable({
      ...entry.unwrap(),
      fnArg: true,
    });
  }

  static ofInitializedEntry(
    entry: CNamedTypedEntry,
    initializer?: CVariableInitializerTree,
  ) {
    const { name, type } = entry;

    return new CVariable({
      type: initializer?.getFixedSizeBaseType() ?? type,
      name,
      initializer,
    });
  }

  static ofAnonymousInitializer(initializer: CVariableInitializerTree) {
    return new CVariable({
      type: initializer.getFixedSizeBaseType(),
      name: null,
      initializer,
    });
  }

  get initializer() {
    return this.value.initializer;
  }

  isGlobal() {
    return this.value.global;
  }

  isLocal() {
    return !this.isGlobal();
  }

  isInitialized() {
    return !!this.initializer;
  }

  /**
   * Maps provided type
   */
  ofMappedType(fn: (type: CType) => CType): CVariable {
    return this.map(({ type, ...attrs }) => ({
      ...attrs,
      type: fn(type),
    }));
  }

  /**
   * Sets global flag and return new instance
   */
  ofGlobalScope(global: boolean = true): CVariable {
    return this.map(value => ({
      ...value,
      global,
    }));
  }

  /**
   * Sets initializer and returns new instance
   */
  ofInitializer(initializer: CVariableInitializerTree): CVariable {
    return this.map(value => ({
      ...value,
      initializer,
    }));
  }

  override getDisplayName() {
    let str = super.getDisplayName();

    if (this.isInitialized()) {
      str += ` = ${CVariableInitializerPrintVisitor.serializeToString(
        this.initializer,
      )}`;
    }

    return str;
  }
}
