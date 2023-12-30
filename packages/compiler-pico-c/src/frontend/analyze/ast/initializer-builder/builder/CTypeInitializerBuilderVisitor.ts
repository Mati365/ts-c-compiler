import * as R from 'ramda';
import * as E from 'fp-ts/Either';

import {
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCDesignatorList,
  ASTCInitializer,
  isCompilerTreeNode,
} from '../../../../parser/ast';

import { CInnerTypeTreeVisitor } from '../../type-builder/CInnerTypeTreeVisitor';
import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../../../errors/CTypeCheckError';

import {
  CArrayType,
  CType,
  isArrayLikeType,
  isStructLikeType,
  isPointerLikeType,
  typeofValueOrNode,
  CPrimitiveType,
  isPrimitiveLikeType,
  isUnionLikeType,
} from '../../../types';

import {
  CVariableInitializerTree,
  CVariableInitializePair,
} from '../../../scope/variables';

import {
  ConstantOperationResult,
  evalConstantExpression,
} from '../../expression-eval';

import { checkLeftTypeOverlapping } from '../../../checker';

/**
 * Visitor that walks over initializer and creates hash map of values
 */
export class CTypeInitializerBuilderVisitor extends CInnerTypeTreeVisitor {
  private tree: CVariableInitializerTree;
  private currentOffset: number = 0;
  private maxSize: number = null;

  constructor(private readonly baseType: CType) {
    super({
      [ASTCCompilerKind.Initializer]: {
        enter: (node: ASTCInitializer) => {
          this.extractInitializer(node);
          return false;
        },
      },
    });
  }

  getBuiltTree() {
    return this.tree;
  }

  private getNextOffset(delta: number = 1) {
    return R.isNil(this.currentOffset) ? 0 : this.currentOffset + delta;
  }

  /**
   *Returns type at specified offset
   */
  private getIndexExpectedType(offset: number = this.currentOffset): CType {
    return this.tree.getIndexExpectedType(offset);
  }

  /**
   * Handles nesting of initializer
   *
   * int b = 2;
   *         ^
   *
   * int a[][] = { ... }
   *                ^
   */
  private extractInitializer(node: ASTCInitializer) {
    const { baseType } = this;

    if (!this.tree) {
      this.tree = new CVariableInitializerTree(baseType, node);
      this.maxSize = this.tree.c89initializerFieldsCount;
    }

    const arrayType = isArrayLikeType(baseType);

    if (
      arrayType &&
      !node.hasInitializerList() &&
      !checkLeftTypeOverlapping(node.type, baseType, {
        implicitCast: false,
      })
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
      const { itemScalarValuesCount: itemSize } = baseType;

      this.tree.ensureSize(
        Math.ceil(this.tree.fields.length / itemSize) * itemSize,
      );
    }
  }

  /**
   * Appends values for nested arrays
   */
  private extractInitializerList(node: ASTCInitializer) {
    const { context, tree } = this;
    const nestedGroupType = tree.getNestedInitializerGroupType();

    node.initializers.forEach(initializer => {
      if (initializer.hasAssignment()) {
        this.extractInitializerListValue(initializer);
      } else {
        let nestedBaseType = nestedGroupType;
        let newOffset = this.currentOffset;

        if (initializer.hasDesignation()) {
          const { type, offset } = this.extractDesignationType(
            initializer.designation,
          );

          if (type) {
            nestedBaseType = type;
            newOffset = offset;
          }
        }

        const entryValue = new CTypeInitializerBuilderVisitor(nestedBaseType)
          .setContext(context)
          .visit(initializer)
          .getBuiltTree();

        this.currentOffset = newOffset;
        this.appendNextSubtree(entryValue);
      }
    });
  }

  /**
   * Extracts single initializer item
   *
   * int a[][] = { { 1 }, { 2 } }
   */
  private extractInitializerListValue(
    node: ASTCInitializer,
    arrayItem: boolean = true,
  ) {
    const { context, baseType, tree } = this;
    const exprResult = evalConstantExpression({
      expression: node.assignmentExpression,
      context,
    });

    let exprValue = E.isRight(exprResult)
      ? exprResult.right
      : node.assignmentExpression;

    let expectedType: CType;

    if (!arrayItem) {
      expectedType = baseType;
    } else if (node.hasDesignation()) {
      const { type, offset } = this.extractDesignationType(node.designation);

      expectedType = type;
      this.currentOffset = offset;
    } else {
      if (R.is(String, exprValue)) {
        expectedType = tree.getNestedInitializerGroupType();
      } else if (isPrimitiveLikeType(node.type)) {
        expectedType = this.getIndexExpectedType();
      } else {
        expectedType = node.type;
      }

      if (!expectedType) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.UNKNOWN_INITIALIZER_VALUE_TYPE,
          node.loc.start,
        );
      }
    }

    if (R.is(String, exprValue)) {
      const noSizeCheck = !isPointerLikeType(baseType) || !arrayItem;

      this.checkStringValueTypeOrThrow(node, expectedType, exprValue);

      /**
       * Handle cases:
       *
       *  char str[4] = "ABCD";
       *
       * There should not be \null terminator appended
       */
      if (isArrayLikeType(expectedType)) {
        const expectedLength = expectedType.getFlattenSize();

        if (expectedLength > 0) {
          exprValue = exprValue.substring(0, expectedLength);
        }
      }

      this.appendNextOffsetValue(
        { type: expectedType, value: exprValue },
        noSizeCheck,
      );
    } else if (isCompilerTreeNode(exprValue)) {
      this.appendNextOffsetValue({
        type: expectedType,
        value: this.parseTreeNodeExpressionValue(node, expectedType, exprValue),
      });
    } else {
      this.appendNextOffsetValue({
        type: expectedType,
        value: this.parseScalarValue(node, expectedType, exprValue),
      });
    }
  }

  /**
   * Handle { [3] = 1, [5] = 2 } in initializers
   */
  private extractDesignationType(designation: ASTCDesignatorList) {
    const { context } = this;
    const { children } = designation;

    let { baseType } = this;
    let offset = 0;

    for (let i = 0; i < children.length; ++i) {
      const { identifier, constantExpression } = children[i];

      // .x = 1
      if (identifier) {
        if (!isStructLikeType(baseType) && !isUnionLikeType(baseType)) {
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

        baseType = field.type;

        if ('index' in field) {
          offset += field.index;
        }
      }

      // [10] = x
      if (constantExpression) {
        if (!isArrayLikeType(baseType)) {
          throw new CTypeCheckError(
            CTypeCheckErrorCode.INCORRECT_INDEX_INITIALIZER_USAGE,
            designation.loc.start,
          );
        }

        const { dimensions, type } = baseType.getFlattenInfo();
        const constExprResult = evalConstantExpression({
          expression: constantExpression,
          context,
        });

        if (E.isLeft(constExprResult)) {
          throw new CTypeCheckError(
            CTypeCheckErrorCode.UNABLE_EVAL_CONST_EXPRESSION,
            designation.loc.start,
          );
        }

        if (
          !baseType.isUnknownSize() &&
          +constExprResult.right >= dimensions[0]
        ) {
          throw new CTypeCheckError(
            CTypeCheckErrorCode.INDEX_INITIALIZER_ARRAY_OVERFLOW,
            designation.loc.start,
          );
        }

        baseType = baseType.ofTailDimensions();
        offset +=
          +constExprResult.right *
          dimensions.reduce((acc, num, index) => (index ? acc * num : 1), 1) *
          type.c89initializerFieldsCount;
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
   */
  private parseTreeNodeExpressionValue(
    node: ASTCCompilerNode,
    expectedType: CType,
    result: ASTCCompilerNode,
  ): ASTCCompilerNode {
    const { arch } = this;
    const initializedType = typeofValueOrNode(arch, result);

    if (!checkLeftTypeOverlapping(expectedType, initializedType)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.INCORRECT_INITIALIZED_VARIABLE_TYPE,
        node.loc.start,
        {
          sourceType: initializedType.getShortestDisplayName(),
          destinationType:
            expectedType?.getShortestDisplayName() ?? '<unknown-dest-type>',
        },
      );
    }

    return result;
  }

  /**
   * Appends to initializer tree values such as 1, 2, 3 from { 1, 2, 3 }
   */
  private parseScalarValue(
    node: ASTCCompilerNode,
    expectedType: CType,
    evalResult: ConstantOperationResult,
  ): number {
    const { arch } = this;
    const initializedType =
      node.type ?? CPrimitiveType.typeofValue(arch, evalResult);

    if (!checkLeftTypeOverlapping(expectedType, initializedType)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.INCORRECT_INITIALIZED_VARIABLE_TYPE,
        node.loc.start,
        {
          sourceType: initializedType.getShortestDisplayName(),
          destinationType:
            expectedType?.getShortestDisplayName() ?? '<unknown-dest-type>',
        },
      );
    }

    return +evalResult;
  }

  /**
   * Appends to initializer values such as { "Hello", "World" }
   */
  private checkStringValueTypeOrThrow(
    node: ASTCCompilerNode,
    expectedType: CType,
    text: string,
  ) {
    // handle "Hello world" initializers
    const initializedTextType = CArrayType.ofStringLiteral(
      this.arch,
      text.length,
    );

    if (
      !checkLeftTypeOverlapping(expectedType, initializedTextType, {
        ignoreArrayLength: true,
      })
    ) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.INCORRECT_INITIALIZED_VARIABLE_TYPE,
        node.loc.start,
        {
          sourceType: initializedTextType.getShortestDisplayName(),
          destinationType:
            expectedType?.getShortestDisplayName() ?? '<unknown-dest-type>',
        },
      );
    }
  }

  /**
   * Appends whole tree of values into current tree
   */
  private appendNextSubtree(
    entryValue: CVariableInitializerTree,
    noSizeCheck?: boolean,
  ) {
    [...entryValue.fields.values()].forEach(value => {
      this.appendNextOffsetValue(value, noSizeCheck);
    });
  }

  /**
   * Appends next value to tree and increments currentKey if number
   */
  private appendNextOffsetValue(
    entryValue: CVariableInitializePair,
    noSizeCheck?: boolean,
  ) {
    const { tree, maxSize, baseType } = this;
    // handle struct Vec2 vec[] = { of_vector(), of_vector() }; initializers
    const delta = isCompilerTreeNode(entryValue)
      ? entryValue.type.c89initializerFieldsCount
      : 1;

    if (isStructLikeType(baseType) || isUnionLikeType(baseType)) {
      // increments offets, determine which field is initialized in struct and sets value
      // used here: struct Vec2 vec = { 1, 2 };
      tree.setAndExpand(this.currentOffset, entryValue);
      this.currentOffset = this.getNextOffset(delta);
    } else if (isArrayLikeType(baseType) || isPointerLikeType(baseType)) {
      // increments offsets and append next value to list, used in arrays
      // used here: int abc[] = { 1, 2, 3 }
      if (
        !noSizeCheck &&
        !R.isNil(this.maxSize) &&
        this.currentOffset + 1 > maxSize
      ) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.EXCESS_ELEMENTS_IN_ARRAY_INITIALIZER,
          tree.parentAST.loc.start,
        );
      }

      tree.setAndExpand(this.currentOffset, entryValue);
      this.currentOffset = this.getNextOffset(delta);
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
