import * as R from 'ramda';

import {ASTCCompilerKind, ASTCInitializer} from '../../../../parser/ast';
import {CType, isArrayLikeType} from '../../../types';
import {CInnerTypeTreeVisitor} from '../../CInnerTypeTreeVisitor';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../../errors/CTypeCheckError';
import {
  CInitializerMapKey,
  CVariableInitializerTree,
  CVariableInitializeValue,
} from '../../../scope/variables';

import {evalConstantExpression} from '../../eval';

/**
 * Visitor that walks over initializer and creates hash map of values
 *
 * @export
 * @class CTypeInitializerBuilderVisitor
 * @extends {CInnerTypeTreeVisitor}
 */
export class CTypeInitializerBuilderVisitor extends CInnerTypeTreeVisitor {
  private tree: CVariableInitializerTree;
  private currentKey: CInitializerMapKey = null;

  constructor(private baseType: CType) {
    super(
      {
        [ASTCCompilerKind.Initializer]: {
          enter: (node: ASTCInitializer) => {
            this.extractInitializer(node);
            return false;
          },
        },
      },
    );
  }

  getBuiltTree() { return this.tree; }

  /**
   * Handles nesting of initializer
   *
   * int a[][] = { ... }
   *                ^
   *
   * @private
   * @param {ASTCInitializer} node
   * @memberof CTypeInitializerBuilderVisitor
   */
  private extractInitializer(node: ASTCInitializer) {
    const {baseType} = this;

    this.tree ||= new CVariableInitializerTree(baseType, node);
    if (node.hasInitializerList())
      this.extractInitializerList(node);
    else
      this.extractAssignmentEntry(node);
  }

  /**
   * Appends values for nested arrays
   *
   * @private
   * @param {ASTCInitializer} node
   * @memberof CTypeInitializerBuilderVisitor
   */
  private extractInitializerList(node: ASTCInitializer) {
    const {context, baseType} = this;
    const nestedBaseType = (
      isArrayLikeType(baseType)
        ? baseType.baseType
        : baseType
    );

    node.initializers.forEach((initializer) => {
      if (initializer.hasAssignment())
        this.extractAssignmentEntry(initializer);
      else {
        const entryValue = (
          new CTypeInitializerBuilderVisitor(nestedBaseType)
            .setContext(context)
            .visit(initializer)
            .getBuiltTree()
        );

        this.appendNextValue(entryValue);
      }
    });
  }

  /**
   * Extracts single initializer item
   *
   * int a[][] = { { 1 }, { 2 } }
   *                 ^      ^
   *
   * @private
   * @param {ASTCInitializer} node
   * @memberof CTypeInitializerBuilderVisitor
   */
  private extractAssignmentEntry(node: ASTCInitializer) {
    const {context} = this;
    const entryValue: CVariableInitializeValue = evalConstantExpression(
      {
        expression: node.assignmentExpression,
        context,
      },
    ).unwrapOrThrow();

    this.appendNextValue(entryValue);
  }

  /**
   * Appends next value to tree and increments currentKey if number
   *
   * @param {CVariableInitializeValue} entryValue
   * @memberof CTypeInitializerBuilderVisitor
   */
  appendNextValue(entryValue: CVariableInitializeValue) {
    const {tree, baseType} = this;
    const maxSize: number = (
      isArrayLikeType(baseType)
        ? baseType.getFlattenSize()
        : 1
    );

    // handles  { 1, 2, 3 } like entries without designations
    if (Number.isInteger(this.currentKey) || R.isNil(this.currentKey)) {
      this.currentKey = (
        R.isNil(this.currentKey)
          ? 0
          : (<number> this.currentKey) + 1
      );

      if (!R.isNil(maxSize) && this.currentKey >= maxSize) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.INITIALIZER_ARRAY_OVERFLOW,
          tree.parentAST.loc.start,
        );
      }
    }

    if (R.isNil(entryValue)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.UNKNOWN_INITIALIZER_TYPE,
        tree.parentAST.loc.start,
      );
    }

    tree.fields.set(this.currentKey, entryValue);
  }
}
