import * as R from 'ramda';

import {ASTCCompilerKind, ASTCInitializer} from '../../../../parser/ast';
import {CInnerTypeTreeVisitor} from '../../CInnerTypeTreeVisitor';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../../errors/CTypeCheckError';

import {
  CArrayType,
  CType,
  CPrimitiveType,
  isArrayLikeType,
} from '../../../types';

import {
  CInitializerMapKey,
  CVariableInitializerTree,
  CVariableInitializeValue,
} from '../../../scope/variables';

import {evalConstantExpression} from '../../eval';
import {checkLeftTypeOverlapping} from '../../../checker';

/**
 * Visitor that walks over initializer and creates hash map of values
 *
 * @export
 * @class CTypeInitializerBuilderVisitor
 * @extends {CInnerTypeTreeVisitor}
 */
export class CTypeInitializerBuilderVisitor extends CInnerTypeTreeVisitor {
  private tree: CVariableInitializerTree;
  private maxSize: number = null;
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

    if (!this.tree) {
      this.tree = new CVariableInitializerTree(baseType, node);
      this.maxSize = this.tree.getMaximumFlattenItemsCount();
    }

    if (node.hasInitializerList())
      this.extractInitializerList(node);
    else
      this.extractAssignmentEntry(node);
  }

  /**
   * Returns type of first nested group
   *
   * @example
   *  int a[2][] = { { 1 } }
   *                   ^
   *              Array<int, 2>
   *
   * @private
   * @return {CType}
   * @memberof CTypeInitializerBuilderVisitor
   */
  private getNestedElementType(): CType {
    const {baseType} = this;

    return (
      isArrayLikeType(baseType)
        ? baseType.ofTailDimensions()
        : baseType
    );
  }

  /**
   * Appends values for nested arrays
   *
   * @private
   * @param {ASTCInitializer} node
   * @memberof CTypeInitializerBuilderVisitor
   */
  private extractInitializerList(node: ASTCInitializer) {
    const {context} = this;
    const nestedBaseType = this.getNestedElementType();

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
    const {context, arch, tree, baseType} = this;

    let expectedItemType: CType = null;
    let constExprResult = evalConstantExpression(
      {
        expression: node.assignmentExpression,
        context,
      },
    ).unwrapOrThrow();

    let initializedValue: CVariableInitializeValue = null;
    let initializedType: CType = null;

    if (R.is(String, constExprResult)) {
      // "Hello world" expression
      expectedItemType = this.getNestedElementType();

      // handle "Hello world" initializers
      const nestedTree = new CVariableInitializerTree(expectedItemType, node.assignmentExpression);
      for (let i = 0; i < constExprResult.length; ++i)
        nestedTree.fields.set(i, constExprResult.charCodeAt(i));

      initializedType = CArrayType.ofStringLength(arch, constExprResult.length);
      initializedValue = nestedTree;
    } else {
      // 1, 2, 3, 4 expression
      expectedItemType = (
        isArrayLikeType(baseType)
          ? baseType.getFlattenInfo().type
          : baseType
      );

      initializedType = CPrimitiveType.typeofValue(arch, constExprResult);
      initializedValue = +constExprResult;
    }

    // compare types
    if (!checkLeftTypeOverlapping(expectedItemType, initializedType)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.INCORRECT_INITIALIZED_VARIABLE_TYPE,
        tree.parentAST.loc.start,
        {
          sourceType: initializedType.getShortestDisplayName(),
          destinationType: expectedItemType?.getShortestDisplayName() ?? '<unknown-dest-type>',
        },
      );
    }

    this.appendNextValue(initializedValue);
  }

  /**
   * Appends next value to tree and increments currentKey if number
   *
   * @param {CVariableInitializeValue} entryValue
   * @memberof CTypeInitializerBuilderVisitor
   */
  private appendNextValue(entryValue: CVariableInitializeValue) {
    const {tree, maxSize} = this;

    // handles  { 1, 2, 3 } like entries without designations
    if (Number.isInteger(this.currentKey) || R.isNil(this.currentKey)) {
      this.currentKey = (
        R.isNil(this.currentKey)
          ? 0
          : (<number> this.currentKey) + 1
      );
    }

    if (R.isNil(entryValue)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.UNKNOWN_INITIALIZER_TYPE,
        tree.parentAST.loc.start,
      );
    }

    if (!R.isNil(this.maxSize)) {
      const currentSize = tree.getCurrentTypeFlattenSize();
      if (currentSize >= maxSize) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.INITIALIZER_ARRAY_OVERFLOW,
          tree.parentAST.loc.start,
        );
      }
    }

    tree.fields.set(this.currentKey, entryValue);
  }
}
