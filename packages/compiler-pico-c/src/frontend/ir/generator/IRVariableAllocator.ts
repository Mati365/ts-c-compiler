import {CFunctionDeclType, CPointerType, CPrimitiveType, CType, CVariable} from '../../analyze';
import {IRGeneratorConfig} from '../constants';
import {IRFnDeclInstruction} from '../instructions';
import {IRVariable} from '../variables';

const TMP_VAR_PREFIX = '%t';
const TMP_FN_RETURN_VAR_PREFIX = '%out';
const CONST_VAR_PREFIX = 'c';

/**
 * Registers symbols table
 *
 * @export
 * @class IRVariableAllocator
 */
export class IRVariableAllocator {
  private readonly variables: Record<string, IRVariable> = {};
  private readonly functions: Record<string, IRFnDeclInstruction> = {};

  private readonly counters = {
    labels: 0,
    tmpVars: 0,
  };

  constructor(
    readonly config: IRGeneratorConfig,
  ) {}

  isAllocated(variable: string): boolean {
    return !!this.variables[variable];
  }

  genLabelName(suffix: string) {
    return `L${this.counters.labels++}-${suffix}`;
  }

  getVariable(name: string): IRVariable {
    return this.variables[name];
  }

  getFunction(name: string): IRFnDeclInstruction {
    return this.functions[name];
  }

  /**
   * Just assigns variable by its name to map
   *
   * @param {IRVariable} variable
   * @return {IRVariable}
   * @memberof IRVariableAllocator
   */
  allocVariable(variable: IRVariable | CVariable): IRVariable {
    if (variable instanceof CVariable)
      variable = IRVariable.ofScopeVariable(variable);

    this.variables[variable.prefix] = variable;
    return variable;
  }

  /**
   * Allocates pointer to variable
   *
   * @param {IRVariable} variable
   * @return {IRVariable}
   * @memberof IRVariableAllocator
   */
  allocAsPointer(variable: IRVariable | CVariable): IRVariable {
    if (variable instanceof CVariable)
      variable = IRVariable.ofScopeVariable(variable);

    const mappedVariable = variable.map(
      (value) => ({
        ...value,
        type: CPointerType.ofType(value.type),
      }),
    );

    return this.allocVariable(mappedVariable);
  }

  allocTmpPointer(type: CType) {
    return this.allocTmpVariable(
      CPointerType.ofType(type),
    );
  }

  /**
   * Decrenebt syffix and return var
   *
   * @return {IRVariable}
   * @memberof IRVariableAllocator
   */
  deallocTmpVariable(): IRVariable {
    return this.allocVariable(
      this
        .getVariable(TMP_VAR_PREFIX)
        .ofDecrementedSuffix(),
    );
  }

  /**
   * Alloc variable used for example for ptr compute
   *
   * @param {CType} type
   * @param {string} [prefix=TMP_VAR_PREFIX]
   * @return {IRVariable}
   * @memberof IRVariableAllocator
   */
  allocTmpVariable(type: CType, prefix: string = TMP_VAR_PREFIX): IRVariable {
    const tmpVar = this.getVariable(prefix) ?? new IRVariable(
      {
        volatile: true,
        suffix: -1,
        prefix,
        type,
      },
    );

    return this.allocVariable(
      tmpVar
        .ofType(type)
        .ofIncrementedSuffix(),
    );
  }

  /**
   * Define variable to LEA output
   *
   * @param {string} [prefix=TMP_VAR_PREFIX]
   * @return {IRVariable}
   * @memberof IRVariableAllocator
   */
  allocAddressVariable(prefix: string = TMP_VAR_PREFIX): IRVariable {
    const {arch} = this.config;

    return this.allocTmpVariable(
      CPointerType.ofType(
        CPrimitiveType.address(arch),
      ),
      prefix,
    );
  }

  /**
   * Alloc variable for data segment
   *
   * @param {CType} type
   * @return {IRVariable}
   * @memberof IRVariableAllocator
   */
  allocConstDataVariable(type: CType): IRVariable {
    return this.allocTmpVariable(type, CONST_VAR_PREFIX);
  }

  /**
   * Allocates arg temp variables for function
   *
   * @param {CFunctionDeclType} fn
   * @return {IRFnDeclInstruction}
   * @memberof IRVariableAllocator
   */
  allocFunctionType(fn: CFunctionDeclType): IRFnDeclInstruction {
    const {name, returnType, args} = fn;
    const irDefArgs = args.map(
      (arg) => this.allocAsPointer(IRVariable.ofScopeVariable(arg)),
    );

    const irFn = (() => {
      if (returnType.isVoid())
        return new IRFnDeclInstruction(fn, name, irDefArgs);

      if (returnType.canBeStoredInReg())
        return new IRFnDeclInstruction(fn, name, irDefArgs, returnType);

      return new IRFnDeclInstruction(
        fn,
        name,
        irDefArgs,
        null,
        this.allocTmpVariable(
          CPointerType.ofType(
            CPointerType.ofType(returnType),
          ),
          TMP_FN_RETURN_VAR_PREFIX,
        ),
      );
    })();

    this.functions[fn.name] = irFn;
    return irFn;
  }
}
