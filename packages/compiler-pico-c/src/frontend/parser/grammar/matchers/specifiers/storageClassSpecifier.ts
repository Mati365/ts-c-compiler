import {
  CCOMPILER_STORAGE_CLASS_SPECIFIERS,
  CStorageClassSpecifier,
} from '@compiler/pico-c/constants';

import { CGrammar } from '../shared';

export function matchStorageClassSpecifier({
  g,
}: CGrammar): CStorageClassSpecifier {
  const specifier = g.identifier(CCOMPILER_STORAGE_CLASS_SPECIFIERS);

  return specifier.text as CStorageClassSpecifier;
}
