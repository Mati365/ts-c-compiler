import {
  CCOMPILER_FUNCTION_SPECIFIERS,
  CFunctionSpecifier,
} from '@compiler/x86-nano-c/constants';

import {CGrammar} from '../shared';

/**
 * function_specifier
 *  : INLINE
 *  | NORETURN
 *  ;
 *
 * @export
 * @param {CGrammar} {g}
 * @return {CFunctionSpecifier}
 */
export function matchFunctionSpecifier({g}: CGrammar): CFunctionSpecifier {
  const specifier = g.identifier(CCOMPILER_FUNCTION_SPECIFIERS);

  return specifier.text as CFunctionSpecifier;
}
