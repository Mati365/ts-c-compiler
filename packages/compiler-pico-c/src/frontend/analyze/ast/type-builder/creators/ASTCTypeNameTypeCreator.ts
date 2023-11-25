import { ASTCCompilerKind, ASTCTypeName } from 'frontend/parser/ast';
import { ASTCTypeCreator } from './ASTCTypeCreator';
import { extractNamedEntryFromDeclaration } from '../extractor';

export class ASTCTypeNameTypeCreator extends ASTCTypeCreator<ASTCTypeName> {
  kind = ASTCCompilerKind.TypeName;

  override enter(node: ASTCTypeName): boolean {
    const extracted = extractNamedEntryFromDeclaration({
      context: this.context,
      canBeAnonymous: true,
      declaration: {
        specifier: node.specifierList,
        declarator: node.abstractDeclarator,
      },
    });

    node.type = extracted.type;
    return false;
  }
}
