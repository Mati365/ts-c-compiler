import {ASTCEnumSpecifier} from '@compiler/x86-nano-c/frontend/parser';
import {CEnumType} from '../../types';
import {CTypeTreeVisitor} from './CTypeTreeVisitor';

/**
 * Enters enum and analyzes its content
 *
 * @export
 * @class CTypeEnumVisitor
 * @extends {CTypeTreeVisitor}
 */
export class CTypeEnumVisitor extends CTypeTreeVisitor {
  initForRootNode(node: ASTCEnumSpecifier): this {
    const enumType = this.extractEnumTypeFromNode(node);
    if (enumType)
      this.scope.defineType(enumType.name, enumType);

    return this;
  }

  /**
   * Walks over enum tree node and constructs type
   *
   * @param {ASTCEnumSpecifier} enumSpecifier
   * @return {CEnumType}
   * @memberof CTypeStructVisitor
   */
  extractEnumTypeFromNode(enumSpecifier: ASTCEnumSpecifier): CEnumType {
    const {arch} = this;
    const blankEnum = CEnumType.ofBlank(arch, enumSpecifier.name.text);

    return enumSpecifier.enumerations.reduce(
      (acc, enumeration) => (
        acc
          .ofAppendedField(enumeration.name.text, 2)
          .unwrapOrThrow()
      ),
      blankEnum,
    );
  }
}
