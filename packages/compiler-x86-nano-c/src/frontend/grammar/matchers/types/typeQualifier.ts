import {CTypeQualifier} from '@compiler/x86-nano-c/constants';
import {CGrammar} from '../shared';

/**
 * Matches const/volatile
 *
 * type_qualifier: CONST | VOLATILE;
 *
 * @param {CGrammar} grammar
 * @param {boolean} optional
 */
export function typeQualifier({g}: CGrammar, opitonal?: boolean) {
  const token = g.identifier(
    [
      CTypeQualifier.CONST,
      CTypeQualifier.VOLATILE,
    ],
    opitonal,
  );

  return token && CTypeQualifier[token.upperText];
}
