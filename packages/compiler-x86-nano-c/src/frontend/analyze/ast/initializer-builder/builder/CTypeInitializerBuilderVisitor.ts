import * as R from 'ramda';

import {ASTCCompilerKind, ASTCInitializer} from '../../../../parser/ast';
import {CInnerTypeTreeVisitor} from '../../CInnerTypeTreeVisitor';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../../errors/CTypeCheckError';

import {
  CArrayType,
  CType,
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
        ? baseType.ofTailDimensions()
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
    let entryValue = evalConstantExpression(
      {
        expression: node.assignmentExpression,
        context,
      },
    ).unwrapOrThrow();

    // handle "Hello world" initializers
    if (R.is(String, entryValue))
      this.extractStringEntry(entryValue);
    else
      this.appendNextValue(+entryValue);
  }

  /**
   * Force cast whole tree to string and set type to char*
   *
   * @private
   * @param {string} entryValue
   * @memberof CTypeInitializerBuilderVisitor
   */
  private extractStringEntry(entryValue: string) {
    const {arch, tree, baseType} = this;
    const charArray = CArrayType.ofStringLength(arch, entryValue.length);

    if (!checkLeftTypeOverlapping(baseType, charArray)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.INCORRECT_STRING_INITIALIZED_VARIABLE_TYPE,
        tree.parentAST.loc.start,
        {
          sourceType: charArray.getShortestDisplayName(),
          destinationType: baseType?.getShortestDisplayName() ?? '<unknown-dest-type>',
        },
      );
    }

    if (R.isNil(this.maxSize))
      this.maxSize = entryValue.length;

    for (let i = 0; i < entryValue.length; ++i)
      this.appendNextValue(entryValue.charCodeAt(i));
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
