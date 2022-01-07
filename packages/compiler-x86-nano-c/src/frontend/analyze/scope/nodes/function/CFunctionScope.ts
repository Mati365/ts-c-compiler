import {CScopeTree} from '../../CScopeTree';
import {CVariable} from '../../variables/CVariable';
import {CFunctionNode} from './CFunctionNode';

/**
 * Special type of C-Scope that also lookups over function args
 *
 * @export
 * @class CFunctionScope
 * @extends {CScopeTree}
 */
export class CFunctionScope extends CScopeTree {
  constructor(
    protected fnNode: CFunctionNode,
  ) {
    super(null);
  }

  get innerScope() {
    return this.fnNode.innerScope;
  }

  setFunctionNode(fnNode: CFunctionNode) {
    this.fnNode = fnNode;
  }

  override findVariable(name: string): CVariable {
    const fnArg = this.fnNode.getArgByName(name);
    if (fnArg)
      return fnArg;

    return super.findVariable(name);
  }
}
