export const DefConstType = {
  1: 'db',
  2: 'dw',
  4: 'dd',
  6: 'dq',
  8: 'dt',
};

export function getDefConstSizeLabel(size: number) {
  return DefConstType[size];
}

type DefConstAttrs = {
  size: number;
  values: (number | string)[];
  float?: boolean;
};

export function genDefConst({ size, values, float }: DefConstAttrs): string {
  return `${getDefConstSizeLabel(size)} ${values
    .map(val => {
      if (typeof val === 'string') {
        return `"${val}", 0x0`;
      }

      if (float) {
        let strVal = val.toString();

        if (!strVal.includes('.')) {
          strVal += '.0';
        }

        return strVal;
      }

      return val ?? 0x0;
    })
    .join(', ')}`;
}
