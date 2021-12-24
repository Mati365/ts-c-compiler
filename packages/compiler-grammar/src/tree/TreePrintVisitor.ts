import {TreeNode} from './TreeNode';
import {TreeVisitor} from './TreeVisitor';

export type TreePrintConfig<T extends TreeNode<any>> = {
  formatterFn?: (node: T) => string,
};

/**
 * Default visitor that prints tree like HTML
 *
 * @export
 * @class TreePrintVisitor
 * @extends {TreeVisitor<T>}
 * @template T
 */
export class TreePrintVisitor<T extends TreeNode<any>> extends TreeVisitor<T> {
  private _reduced: string = '';

  constructor(
    private readonly config: TreePrintConfig<T>,
  ) {
    super();
  }

  get reduced() { return this._reduced; }

  enter(node: T) {
    const {nesting, config} = this;

    if (nesting === 1)
      this._reduced = '';

    const name = config.formatterFn?.(node) ?? node.toString();
    this._reduced += `${''.padStart((this.nesting - 1) * 3, ' ')}<${name} />\n`;
  }

  /**
   * Converts node to string
   *
   * @static
   * @template T
   * @param {T} node
   * @param {TreePrintConfig<T>} [config={}]
   * @return {string}
   * @memberof TreePrintVisitor
   */
  static serializeToString<T extends TreeNode<any>>(node: T, config: TreePrintConfig<T> = {}): string {
    return (new TreePrintVisitor(config)).visit(node).reduced;
  }
}
