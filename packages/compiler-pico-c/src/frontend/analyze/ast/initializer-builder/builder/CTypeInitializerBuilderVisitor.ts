import * as R from 'ramda';

import {
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCDesignatorList,
  ASTCInitializer,
  isCompilerTreeNode,
} from '../../../../parser/ast';

import {CInnerTypeTreeVisitor} from '../../CInnerTypeTreeVisitor';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../../errors/CTypeCheckError';

import {
  CArrayType,
  CType,
  isArrayLikeType,
  isStructLikeType,
  isPointerLikeType,
  typeofValueOrNode,
  CPrimitiveType,
} from '../../../types';

import {
  CVariableInitializerTree,
  CVariableInitializeValue,
} from '../../../scope/variables';

import {ConstantOperationResult, evalConstantExpression} from '../../expression-analyze';
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
  private currentOffset: number = 0;
  private maxSize: number = null;

  constructor(
    private readonly baseType: CType,
  ) {
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

  getBuiltTree() {
    return this.tree;
  }

  private getNextOffset() {
    return (
      R.isNil(this.currentOffset)
        ? 0
        : this.currentOffset + 1
    );
  }

  /**
   *Returns type at specified offset
   *
   * @param {number} [offset=this.currentOffset]
   * @return {CType}
   * @memberof CTypeInitializerBuilderVisitor
   */
  private getOffsetExpectedType(offset: number = this.currentOffset): CType {
    return this.tree.getOffsetExpectedType(offset);
  }

  /**
   * Handles nesting of initializer
   *
   * int b = 2;
   *         ^
   *
   * int a[][] = { ... }
   *                ^
   *
   * @private
   * @param {ASTCInitializer} node
   * @memberof CTypeInitializerBuilderVisitor
   */
  private extractInitializer(node: ASTCInitializer) {
    const {baseType, arch} = this;

    if (!this.tree) {
      this.tree = new CVariableInitializerTree(baseType, node);
      this.maxSize = this.tree.scalarValuesCount;
    }

    const arrayType = isArrayLikeType(baseType);
    if (arrayType
        && !node.hasInitializerList()
        && !checkLeftTypeOverlapping(CArrayType.ofStringLiteral(arch), baseType, false)
    ) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.INVALID_INITIALIZER,
        this.tree.parentAST.loc.start,
      );
    }

    if (node.hasInitializerList()) {
      // handle int a[] = { ... }
      this.extractInitializerList(node);
    } else {
      // handle int a = 2
      this.extractInitializerListValue(node, false);
    }

    if (arrayType) {
      const {itemScalarValuesCount: itemSize} = baseType;

      this.tree.ensureSize(
        Math.ceil(this.tree.fields.length / itemSize) * itemSize,
      );
    }
  }

  /**
   * Appends values for nested arrays
   *
   * @private
   * @param {ASTCInitializer} node
   * @memberof CTypeInitializerBuilderVisitor
   */
  private extractInitializerList(node: ASTCInitializer) {
    const {context, tree} = this;
    const nestedGroupType = tree.getNestedInitializerGroupType();

    node.initializers.forEach((initializer) => {
      if (initializer.hasAssignment())
        this.extractInitializerListValue(initializer);
      else {
        let nestedBaseType = nestedGroupType;
        let newOffset = this.currentOffset;

        if (initializer.hasDesignation()) {
          const {type, offset} = this.extractDesignationType(initializer.designation);

          if (type) {
            nestedBaseType = type;
            newOffset = offset;
          }
        }

        const entryValue = (
          new CTypeInitializerBuilderVisitor(nestedBaseType)
            .setContext(context)
            .visit(initializer)
            .getBuiltTree()
        );

        this.currentOffset = newOffset;
        this.appendNextSubtree(entryValue);
      }
    });
  }

  /**
   * Extracts single initializer item
   *
   * int a[][] = { { 1 }, { 2 } }
   *
   * @private
   * @param {ASTCInitializer} node
   * @param {boolean} [arrayItem=true]
   * @memberof CTypeInitializerBuilderVisitor
   */
  private extractInitializerListValue(node: ASTCInitializer, arrayItem: boolean = true) {
    const {context, baseType, tree} = this;
    const exprResult = evalConstantExpression(
      {
        expression: node.assignmentExpression,
        context,
      },
    );

    const exprValue = (
      exprResult.isOk()
        ? exprResult.unwrap()
        : node.assignmentExpression
    );

    const stringLiteral = R.is(String, exprValue);
    let expectedType: CType;

    if (!arrayItem) {
      expectedType = baseType;
    } else if (node.hasDesignation()) {
      const {type, offset} = this.extractDesignationType(node.designation);

      expectedType = type;
      this.currentOffset = offset;
    } else {
      if (stringLiteral)
        expectedType = tree.getNestedInitializerGroupType();
      else
        expectedType = this.getOffsetExpectedType();

      if (!expectedType) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.UNKNOWN_INITIALIZER_VALUE_TYPE,
          node.loc.start,
        );
      }
    }

    if (stringLiteral) {
      const noSizeCheck = !isPointerLikeType(baseType) || !arrayItem;

      this.appendNextSubtree(
        this.parseStringValue(node, expectedType, exprValue),
        noSizeCheck,
      );
    } else if (isCompilerTreeNode(exprValue)) {
      this.appendNextOffsetValue(
        this.parseTreeNodeExpressionValue(node, expectedType, exprValue),
      );
    } else {
      this.appendNextOffsetValue(
        this.parseScalarValue(node, expectedType, exprValue),
      );
    }
  }

  /**
   * Handle { [3] = 1, [5] = 2 } in initializers
   *
   * @private
   * @param {ASTCDesignatorList} designation
   * @memberof CTypeInitializerBuilderVisitor
   */
  private extractDesignationType(designation: ASTCDesignatorList) {
    const {context} = this;
    const {children} = designation;

    let {baseType} = this;
    let offset = 0;

    for (let i = 0; i < children.length; ++i) {
      const {identifier, constantExpression} = children[i];

      // .x = 1
      if (identifier) {
        if (!isStructLikeType(baseType)) {
          throw new CTypeCheckError(
            CTypeCheckErrorCode.INCORRECT_NAMED_STRUCTURE_INITIALIZER_USAGE,
            designation.loc.start,
          );
        }

        const field = baseType.getField(identifier.text);
        if (R.isNil(field)) {
          throw new CTypeCheckError(
            CTypeCheckErrorCode.UNKNOWN_NAMED_STRUCTURE_INITIALIZER,
            designation.loc.start,
            {
              name: identifier.text,
            },
          );
        }

        offset += field.getIndex();
        baseType = field.type;
      }

      // [10] = x
      if (constantExpression) {
        if (!isArrayLikeType(baseType)) {
          throw new CTypeCheckError(
            CTypeCheckErrorCode.INCORRECT_INDEX_INITIALIZER_USAGE,
            designation.loc.start,
          );
        }

        const {dimensions} = baseType.getFlattenInfo();
        const constExprResult = evalConstantExpression(
          {
            expression: constantExpression,
            context,
          },
        ).unwrapOrThrow();

        if (!baseType.isUnknownSize() && constExprResult >= dimensions[0]) {
          throw new CTypeCheckError(
            CTypeCheckErrorCode.INDEX_INITIALIZER_ARRAY_OVERFLOW,
            designation.loc.start,
          );
        }

        const itemScalarSize = baseType.getFlattenInfo().type.scalarValuesCount;
        baseType = baseType.ofTailDimensions();
        offset += (
          +constExprResult
            * dimensions.reduce((acc, num, index) => index ? acc * num : 1, 1)
            * itemScalarSize
        );
      }
    }

    return {
      type: baseType,
      offset,
    };
  }

  /**
   * Parses initializer dynamic expression with variables such as:
   *
   * @example
   *  b * 4;
   *
   * @private
   * @param {ASTCCompilerNode} node
   * @param {CType} expectedType
   * @param {ASTCCompilerNode} result
   * @return {ASTCCompilerNode}
   * @memberof CTypeInitializerBuilderVisitor
   */
  private parseTreeNodeExpressionValue(
    node: ASTCCompilerNode,
    expectedType: CType,
    result: ASTCCompilerNode,
  ): ASTCCompilerNode {
    const {arch} = this;
    const initializedType = typeofValueOrNode(arch, result);

    if (!checkLeftTypeOverlapping(expectedType, initializedType)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.INCORRECT_INITIALIZED_VARIABLE_TYPE,
        node.loc.start,
        {
          sourceType: initializedType.getShortestDisplayName(),
          destinationType: expectedType?.getShortestDisplayName() ?? '<unknown-dest-type>',
        },
      );
    }

    return result;
  }

  /**
   * Appends to initializer tree values such as 1, 2, 3 from { 1, 2, 3 }
   *
   * @private
   * @param {ASTCCompilerNode} node
   * @param {CType} expectedType
   * @param {ConstantOperationResult} evalResult
   * @returns {number}
   * @memberof CTypeInitializerBuilderVisitor
   */
  private parseScalarValue(
    node: ASTCCompilerNode,
    expectedType: CType,
    evalResult: ConstantOperationResult,
  ): number  {
    const {arch} = this;
    const initializedType = node.type ?? CPrimitiveType.typeofValue(arch, evalResult);

    if (!checkLeftTypeOverlapping(expectedType, initializedType)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.INCORRECT_INITIALIZED_VARIABLE_TYPE,
        node.loc.start,
        {
          sourceType: initializedType.getShortestDisplayName(),
          destinationType: expectedType?.getShortestDisplayName() ?? '<unknown-dest-type>',
        },
      );
    }

    return +evalResult;
  }

  /**
   * Appends to initializer values such as { "Hello", "World" }
   *
   * @private
   * @param {ASTCCompilerNode} node
   * @param {CType} expectedType
   * @param {string} text
   * @returns {CVariableInitializerTree}
   * @memberof CTypeInitializerBuilderVisitor
   */
  private parseStringValue(
    node: ASTCCompilerNode,
    expectedType: CType,
    text: string,
  ): CVariableInitializerTree {
    // handle "Hello world" initializers
    const initializedTextType = CArrayType.ofStringLiteral(this.arch, text.length);

    if (!checkLeftTypeOverlapping(expectedType, initializedTextType)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.INCORRECT_INITIALIZED_VARIABLE_TYPE,
        node.loc.start,
        {
          sourceType: initializedTextType.getShortestDisplayName(),
          destinationType: expectedType?.getShortestDisplayName() ?? '<unknown-dest-type>',
        },
      );
    }

    // appending to initializer list
    const nestedTree = new CVariableInitializerTree(expectedType,  node);
    for (let i = 0; i < text.length; ++i)
      nestedTree.fields[i] = text.charCodeAt(i);

    return nestedTree;
  }

  /**
   * Appends whole tree of values into current tree
   *
   * @private
   * @param {CVariableInitializerTree} entryValue
   * @param {boolean} [noSizeCheck]
   * @memberof CTypeInitializerBuilderVisitor
   */
  private appendNextSubtree(entryValue: CVariableInitializerTree, noSizeCheck?: boolean) {
    [...entryValue.fields.values()].forEach((value) => {
      this.appendNextOffsetValue(value, noSizeCheck);
    });
  }

  /**
   * Appends next value to tree and increments currentKey if number
   *
   * @private
   * @param {CVariableInitializeValue} entryValue
   * @param {boolean} [noSizeCheck]
   * @memberof CTypeInitializerBuilderVisitor
   */
  private appendNextOffsetValue(entryValue: CVariableInitializeValue, noSizeCheck?: boolean) {
    const {tree, maxSize, baseType} = this;

    if (isStructLikeType(baseType)) {
      // increments offets, determine which field is initialized in struct and sets value
      // used here: struct Vec2 vec = { 1, 2 };
      tree.setAndExpand(this.currentOffset, entryValue);
      this.currentOffset = this.getNextOffset();
    } else if (isArrayLikeType(baseType) || isPointerLikeType(baseType)) {
      // increments offsets and append next value to list, used in arrays
      // used here: int abc[] = { 1, 2, 3 }
      if (!noSizeCheck && !R.isNil(this.maxSize) && this.currentOffset + 1 > maxSize) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.EXCESS_ELEMENTS_IN_ARRAY_INITIALIZER,
          tree.parentAST.loc.start,
        );
      }

      tree.setAndExpand(this.currentOffset, entryValue);
      this.currentOffset = this.getNextOffset();
    } else {
      // used in single value assign mode
      // used here: int abc = 3;
      if (!noSizeCheck && !R.isNil(tree.getFirstValue())) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.EXCESS_ELEMENTS_IN_SCALAR_INITIALIZER,
          tree.parentAST.loc.start,
        );
      }

      tree.setAndExpand(0, entryValue);
      this.currentOffset = 0;
    }
  }
}
