export interface X86Port {
  set(bits: Number): Number;
  get(bits: Number): Number;
}

export type X86PortsSet = {
  [key: number]: X86Port,
};
