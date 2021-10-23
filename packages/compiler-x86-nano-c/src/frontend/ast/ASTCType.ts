import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {CTypeQualifiers, CTypeSpecifiers} from '../../constants';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

/**
 * C type AST representation
 *
 * @todo
 *  Add pointer support
 *
 * @export
 * @class ASTCType
 * @extends {ASTCCompilerNode}
 */
export class ASTCIdentifierType extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly name: string,
    public readonly qualifier?: CTypeQualifiers,
    public readonly specifiers?: CTypeSpecifiers[],
  ) {
    super(ASTCCompilerKind.Type, loc);
  }

  /**
   * @todo
   *   Add pointers support
   *
   * @returns
   * @memberof ASTCType
   */
  toString() {
    const {name, qualifier} = this;

    return `${qualifier || ''} ${name}`.trim();
  }
}

/**
 * Wraps normal type with pointer
 *
 * @export
 * @class ACTCPtrType
 * @extends {ASTCCompilerNode}
 */
export class ACTCPtrType extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly type: ASTCCompilerNode,
    public readonly qualifier?: CTypeQualifiers,
    kind: ASTCCompilerKind = ASTCCompilerKind.PtrType,
  ) {
    super(kind, loc);
  }

  toString() {
    const {qualifier, type} = this;

    return `${type}* ${qualifier || ''}`.trim();
  }
}

/**
 * Type that initializes array
 *
 * @export
 * @class ACTCPtrArrayType
 * @extends {ACTCPtrType}
 */
export class ACTCPtrArrayType extends ACTCPtrType {
  constructor(
    loc: NodeLocation,
    type: ASTCCompilerNode,
    qualifier: CTypeQualifiers,
    public readonly lengthExpression: string,
  ) {
    super(loc, type, qualifier, ASTCCompilerKind.PtrArrayType);
  }

  toString() {
    const {type, lengthExpression} = this;

    return `(${type.toString()})[${lengthExpression || ''}]`;
  }
}

export type ASTCType = ASTCIdentifierType | ACTCPtrType | ACTCPtrArrayType;
