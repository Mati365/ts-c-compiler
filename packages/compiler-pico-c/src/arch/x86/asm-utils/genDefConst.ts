export const DefConstType = {
  1: 'db',
  2: 'dw',
  4: 'dd',
  6: 'dq',
  8: 'dt',
};

export function genDefConst(size: number, values: number[]): string {
  return `${DefConstType[size]} ${values.map(val => val ?? 0x0).join(', ')}`;
}
