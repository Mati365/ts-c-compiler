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

export function genDefConst(size: number, values: (number | string)[]): string {
  return `${getDefConstSizeLabel(size)} ${values
    .map(val => {
      if (typeof val === 'string') {
        return `"${val}"`;
      }

      return val ?? 0x0;
    })
    .join(', ')}`;
}
