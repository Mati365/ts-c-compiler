import { CGrammar } from '../../shared';

/**
 * [asmSymbolicName]
 */
export function asmSymbolicName(grammar: CGrammar): string {
  const { g } = grammar;

  g.terminal('[');

  const symbolicName = g.match();

  g.terminal(']');

  return symbolicName.text;
}
