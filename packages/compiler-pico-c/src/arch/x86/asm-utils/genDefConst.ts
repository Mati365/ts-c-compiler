type DefConstType = 'db' | 'dw' | 'dd' | 'dq' | 'dt';

export function genDefConst(type: DefConstType, values: number[]): string {
  return `${type} ${values.join(', ')}`;
}
