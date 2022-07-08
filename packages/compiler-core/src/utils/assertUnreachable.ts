// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertUnreachable(x: never): never {
  throw new Error('Did not expect to get here');
}
