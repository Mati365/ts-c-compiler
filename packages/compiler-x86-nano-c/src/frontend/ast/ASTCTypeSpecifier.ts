import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';
import {CTypeSpecifier} from '../../constants';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCEnumSpecifier} from './ASTCEnumSpecifier';

@walkOverFields(
  {
    fields: [
      'specifier',
      'typeName',
      'enumSpecifier',
    ],
  },
)
export class ASTCTypeSpecifier extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly specifier?: CTypeSpecifier,
    public readonly typeName?: Token,
    public readonly enumSpecifier?: ASTCEnumSpecifier,
  ) {
    super(ASTCCompilerKind.TypeSpecifier, loc);
  }

  get displayName() {
    const {specifier, typeName} = this;

    return (specifier || typeName?.text)?.trim();
  }

  /**
   * @returns
   * @memberof ASTCTypeSpecifier
   */
  toString() {
    const {kind, displayName} = this;

    return ASTCCompilerNode.dumpAttributesToString(
      kind,
      {
        displayName,
      },
    );
  }
}
