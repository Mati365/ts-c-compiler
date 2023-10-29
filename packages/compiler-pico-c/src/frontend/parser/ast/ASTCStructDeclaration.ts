import { walkOverFields } from '@ts-c-compiler/grammar';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCSpecifiersQualifiersList } from './ASTCSpecifiersQualifiersList';
import { ASTCStaticAssertDeclaration } from './ASTCStaticAssertDeclaration';
import { ASTCStructDeclaratorList } from './ASTCStructDeclaratorList';

@walkOverFields({
  fields: ['specifierList', 'declaratorList', 'assertDeclaration'],
})
export class ASTCStructDeclaration extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly specifierList?: ASTCSpecifiersQualifiersList,
    readonly declaratorList?: ASTCStructDeclaratorList,
    readonly assertDeclaration?: ASTCStaticAssertDeclaration,
  ) {
    super(ASTCCompilerKind.StructDeclaration, loc);
  }
}
