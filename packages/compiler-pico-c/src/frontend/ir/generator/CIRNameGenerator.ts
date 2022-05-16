/**
 * Quite dump data structure that generates names
 *
 * @export
 * @class CIRNameGenerator
 */
export class CIRNameGenerator {
  private readonly counters = {
    labels: 0,
    variables: 0,
  };

  genVariableName() {
    return `t${this.counters.variables++}`;
  }

  genLabelName(suffix: string) {
    return `L${this.counters.labels++}-${suffix}`;
  }
}
