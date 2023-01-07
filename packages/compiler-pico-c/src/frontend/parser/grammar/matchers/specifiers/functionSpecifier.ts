import {
  CCOMPILER_FUNCTION_SPECIFIERS,
  CFunctionSpecifier,
} from '@compiler/pico-c/constants';

import { CGrammar } from '../shared';

/**
 * function_specifier
 *  : INLINE
 *  | NORETURN
 *  ;
 */
export function matchFunctionSpecifier({ g }: CGrammar): CFunctionSpecifier {
  const specifier = g.identifier(CCOMPILER_FUNCTION_SPECIFIERS);

  return specifier.text as CFunctionSpecifier;
}
