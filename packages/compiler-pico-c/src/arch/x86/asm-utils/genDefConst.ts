export type DefConstType = 'db' | 'dw' | 'dd' | 'dq' | 'dt';

export function genDefConst(type: DefConstType, values: number[]): string {
  return `${type} ${values.map(val => val ?? 0x0).join(', ')}`;
}
