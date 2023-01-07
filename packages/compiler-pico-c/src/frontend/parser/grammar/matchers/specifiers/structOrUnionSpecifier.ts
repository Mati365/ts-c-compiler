import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';

import {
  CCOMPILER_STRUCT_LIKE_SPECIFIERS,
  CStructLikeSpecifiers,
} from '@compiler/pico-c/constants';

import {
  ASTCStructDeclarationList,
  ASTCStructSpecifier,
  ASTCUnionSpecifier,
} from '../../../ast';

import { CGrammar } from '../shared';
import { structDeclarationList } from '../declarations/structDeclarationList';

function structOrUnionConstructor({ g }: CGrammar) {
  const typeToken = g.identifier(CCOMPILER_STRUCT_LIKE_SPECIFIERS);

  return {
    typeToken,
    constructor:
      typeToken.value === CStructLikeSpecifiers.STRUCT
        ? ASTCStructSpecifier
        : ASTCUnionSpecifier,
  };
}

/**
 * struct_or_union_specifier
 *  : struct_or_union '{' struct_declaration_list '}'
 *  | struct_or_union IDENTIFIER '{' struct_declaration_list '}'
 *  | struct_or_union IDENTIFIER
 *  ;
 */
export function structOrUnionSpecifier(grammar: CGrammar): ASTCStructSpecifier {
  const { g } = grammar;
  const { typeToken, constructor: StructLikeConstructor } =
    structOrUnionConstructor(grammar);

  const name = g.try(() => g.nonIdentifierKeyword());
  let list: ASTCStructDeclarationList = null;

  if (g.currentToken.text === '{') {
    g.terminal('{');
    list = structDeclarationList(grammar);
    g.terminal('}');
  }

  return new StructLikeConstructor(
    NodeLocation.fromTokenLoc(typeToken.loc),
    list,
    name,
  );
}
