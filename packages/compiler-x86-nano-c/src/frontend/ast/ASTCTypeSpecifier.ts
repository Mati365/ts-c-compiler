import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';
import {CCompilerTypeIdentifier} from '../../constants';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export class ASTCTypeSpecifier extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly identifier?: CCompilerTypeIdentifier,
    public readonly typeName?: Token,
  ) {
    super(ASTCCompilerKind.TypeSpecifier, loc);
  }

  get displayName() {
    const {identifier, typeName} = this;

    return (identifier || typeName?.text).trim();
  }

  /**
   * @todo
   *   Add pointers support
   *
   * @returns
   * @memberof ASTCType
   */
  toString() {
    const {displayName} = this;

    return `name="${displayName}"`.trim();
  }
}
