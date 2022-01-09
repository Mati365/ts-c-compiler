import * as R from 'ramda';

import {ASTCCompilerKind, ASTCCompilerNode, ASTCInitializer} from '../../../../parser/ast';
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

import {ConstantOperationResult, evalConstantExpression} from '../../eval';
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
    const {context} = this;
    const constExprResult = evalConstantExpression(
      {
        expression: node.assignmentExpression,
        context,
      },
    ).unwrapOrThrow();

    if (R.is(String, constExprResult))
      this.extractAssignedStringEntry(node, constExprResult);
    else
      this.extractScalarEntry(node, constExprResult);
  }

  /**
   * Appends to initializer tree values such as 1, 2, 3 from { 1, 2, 3 }
   *
   * @private
   * @param {ASTCCompilerNode} node
   * @param {ConstantOperationResult} evalResult
   * @memberof CTypeInitializerBuilderVisitor
   */
  private extractScalarEntry(node: ASTCCompilerNode, evalResult: ConstantOperationResult) {
    const {baseType, arch} = this;

    const initializedType = CPrimitiveType.typeofValue(arch, evalResult);
    const expectedInitializerItemType = (
      isArrayLikeType(baseType)
        ? baseType.getFlattenInfo().type
        : baseType
    );

    if (!checkLeftTypeOverlapping(expectedInitializerItemType, initializedType)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.INCORRECT_INITIALIZED_VARIABLE_TYPE,
        node.loc.start,
        {
          sourceType: initializedType.getShortestDisplayName(),
          destinationType: expectedInitializerItemType?.getShortestDisplayName() ?? '<unknown-dest-type>',
        },
      );
    }

    this.appendNextValue(+evalResult);
  }

  /**
   * Appends to initializer values such as { "Hello", "World" }
   *
   * @private
   * @param {ASTCCompilerNode} node
   * @param {string} text
   * @memberof CTypeInitializerBuilderVisitor
   */
  private extractAssignedStringEntry(node: ASTCCompilerNode, text: string) {
    // handle "Hello world" initializers
    const expectedInitializerItemType = this.getNestedElementType();
    const initializedTextType = CArrayType.ofStringLength(this.arch, text.length);

    if (!checkLeftTypeOverlapping(expectedInitializerItemType, initializedTextType)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.INCORRECT_INITIALIZED_VARIABLE_TYPE,
        node.loc.start,
        {
          sourceType: initializedTextType.getShortestDisplayName(),
          destinationType: expectedInitializerItemType?.getShortestDisplayName() ?? '<unknown-dest-type>',
        },
      );
    }

    // appending to initializer list
    const nestedTree = new CVariableInitializerTree(expectedInitializerItemType,  node);
    for (let i = 0; i < text.length; ++i)
      nestedTree.fields.set(i, text.charCodeAt(i));

    this.appendNextValue(nestedTree);
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
