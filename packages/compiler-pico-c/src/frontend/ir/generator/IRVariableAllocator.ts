import {
  CFlag,
  CFlagType,
  CFunctionDeclType,
  CPointerType,
  CPrimitiveType,
  CType,
  CVariable,
} from '../../analyze';

import {
  IRVariable,
  COMPILER_GEN_PREFIX,
  CONST_VAR_PREFIX,
  TMP_FN_RETURN_VAR_PREFIX,
  TMP_VAR_PREFIX,
  isIRVariable,
} from '../variables';

import { IRGeneratorConfig } from '../constants';
import { IRFnDeclInstruction } from '../instructions';
import { getSourceNonPtrType } from '../../analyze/types/utils';

type IRAllocatorConfig = IRGeneratorConfig & {
  parent?: IRVariableAllocator;
  prefix?: number;
};

type IRVariableInitializerFn = (variable: IRVariable) => IRVariable | void;

/**
 * Registers symbols table
 */
export class IRVariableAllocator {
  private readonly variables: Record<string, IRVariable> = {};
  private readonly functions: Record<string, IRFnDeclInstruction> = {};

  constructor(readonly config: IRAllocatorConfig) {}

  get parent() {
    return this.config.parent;
  }

  get prefix() {
    return this.config.prefix || '';
  }

  ofNestedScopePrefix(config?: Partial<IRAllocatorConfig>) {
    return new IRVariableAllocator({
      ...this.config,
      ...config,
      parent: this,
      prefix: (this.prefix || 0) + 1,
    });
  }

  assignIRAllocatorData(allocator: IRVariableAllocator): this {
    Object.assign(this.variables, allocator.variables);
    Object.assign(this.functions, allocator.functions);
    return this;
  }

  isAllocated(variable: string): boolean {
    return !!this.variables[variable];
  }

  getVariable(name: string): IRVariable {
    return this.variables[name] || this.parent?.getVariable(name);
  }

  getFunction(name: string): IRFnDeclInstruction {
    return this.functions[name] || this.parent?.getFunction(name);
  }

  /**
   * Just assigns variable by its name to map
   */
  allocVariable(
    variable: IRVariable | CVariable,
    initializer?: IRVariableInitializerFn,
  ): IRVariable {
    if (variable instanceof CVariable) {
      variable = IRVariable.ofScopeVariable(variable);
    }

    const { prefix, parent } = this;

    const oldPrefix = variable.prefix;
    let mappedVariable = parent?.isAllocated(oldPrefix)
      ? variable.ofPrefix(`${COMPILER_GEN_PREFIX}${prefix}_${oldPrefix}`)
      : variable;

    // it happens if we merge together two scopes
    // with the same variable name
    if (
      this.isAllocated(mappedVariable.prefix) &&
      !mappedVariable.isTemporary()
    ) {
      mappedVariable = mappedVariable.ofIncrementedSuffix();
    }

    this.variables[oldPrefix] = initializer?.(mappedVariable) || mappedVariable;
    return mappedVariable;
  }

  /**
   * Allocates pointer to variable
   */
  allocAsPointer(
    variable: IRVariable | CVariable,
    initializer?: IRVariableInitializerFn,
  ): IRVariable {
    if (variable instanceof CVariable) {
      variable = IRVariable.ofScopeVariable(variable);
    }

    if (variable.isAnonymous()) {
      return this.allocTmpVariable(
        variable.ofPointerType().type,
        TMP_VAR_PREFIX,
        initializer,
      );
    }

    return this.allocVariable(variable.ofPointerType(), initializer);
  }

  /**
   * Alloc variable used to calculate ptr address
   */
  allocTmpPointer(type: CType): IRVariable {
    const { parent } = this;
    if (parent) {
      return parent.allocTmpPointer(type);
    }

    return this.allocTmpVariable(CPointerType.ofType(type));
  }

  /**
   * Generate fake variable for CPU flags result
   */
  allocFlagResult(flag: CFlag = CFlag.ZF): IRVariable {
    return this.allocTmpVariable(CFlagType.ofBlank(this.config.arch, flag));
  }

  /**
   * Alloc variable used for example for ptr compute
   */
  allocTmpVariable(
    typeOrVar: CType | IRVariable,
    prefix: string = TMP_VAR_PREFIX,
    initializer?: IRVariableInitializerFn,
  ): IRVariable {
    const { parent } = this;
    if (parent) {
      return parent.allocTmpVariable(typeOrVar, prefix);
    }

    const extractedType = isIRVariable(typeOrVar) ? typeOrVar.type : typeOrVar;
    const tmpVar =
      this.getVariable(prefix) ??
      new IRVariable({
        temp: true,
        suffix: -1,
        prefix,
        type: extractedType,
      });

    let generatedVar = tmpVar.ofType(extractedType).ofIncrementedSuffix();
    if (isIRVariable(typeOrVar) && typeOrVar.virtualArrayPtr) {
      generatedVar = generatedVar.ofVirtualArrayPtr();
    }

    return this.allocVariable(generatedVar, initializer);
  }

  /**
   * Define variable to LEA output
   */
  allocAddressVariable(
    baseType: CType = CPrimitiveType.int(this.config.arch),
    prefix: string = TMP_VAR_PREFIX,
  ): IRVariable {
    return this.allocTmpVariable(
      CPointerType.ofType(getSourceNonPtrType(baseType)),
      prefix,
    );
  }

  /**
   * Alloc variable for data segment
   */
  allocDataVariable(type: CType): IRVariable {
    return this.allocTmpVariable(
      CPointerType.ofType(type),
      CONST_VAR_PREFIX,
    ).ofConstInitialized();
  }

  /**
   * Allocates arg temp variables for function
   */
  allocFunctionType(fn: CFunctionDeclType): IRFnDeclInstruction {
    const { name, returnType, args } = fn;
    const irDefArgs = args.map(arg =>
      this.allocAsPointer(IRVariable.ofScopeVariable(arg)),
    );

    const irFn = (() => {
      if (returnType.isVoid()) {
        return new IRFnDeclInstruction(fn, name, irDefArgs);
      }

      if (returnType.canBeStoredInReg()) {
        return new IRFnDeclInstruction(fn, name, irDefArgs, returnType);
      }

      return new IRFnDeclInstruction(
        fn,
        name,
        irDefArgs,
        null,
        this.allocTmpVariable(
          CPointerType.ofType(returnType),
          TMP_FN_RETURN_VAR_PREFIX,
        ),
      );
    })();

    this.functions[`${this.prefix}${fn.name}`] = irFn;
    return irFn;
  }
}
