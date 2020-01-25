export interface X86Port {
  set?(bits?: number): void;
  get?(bits?: number): number;
}

export type X86PortsSet = {
  [key: number]: X86Port,
};
