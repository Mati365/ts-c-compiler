export class IRGotoLabelsFactory {
  private functionID: number = 0;

  enterFunction() {
    this.functionID++;
  }

  prefixLabel(label: string) {
    return `F${this.functionID}_${label}`;
  }
}
