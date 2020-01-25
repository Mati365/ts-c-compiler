export default kind => class ASTNode {
  constructor(loc, children) {
    this.kind = kind;
    this.loc = loc;
    this.children = children || [];
  }

  static parse() {
    return null;
  }
};
