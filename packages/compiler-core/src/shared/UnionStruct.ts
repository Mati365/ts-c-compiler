import 'reflect-metadata';

const unionStructMetaField = Symbol('bitFields');

export type BitFieldMetaInfo = {
  name: string,
  lowBitNth: number,
  highBitNth: number,
};

/**
 * Simple structure that holds bitfiels
 *
 * @export
 * @class UnionStruct
 */
export class UnionStruct {
  constructor(
    public number: number = 0x0,
  ) {}

  toString(radix?: number): string {
    return this.number.toString(radix);
  }

  /**
   * Unpack struct union into plain object (non UnionStruct)
   *
   * @template T
   * @returns
   * @memberof UnionStruct
   */
  unpack<T extends typeof UnionStruct>() {
    const output: {
      [key in keyof Omit<InstanceType<T>, 'number'|'toString'>]?: number
    } = {};

    const bitFields: BitFieldMetaInfo[] = Reflect.getOwnMetadata(unionStructMetaField, this.constructor);
    if (bitFields) {
      bitFields.forEach(({name}) => {
        output[name] = this[name];
      });
    }

    return output;
  }

  /**
   * Create instance of structure from number
   *
   * @static
   * @param {number} number
   * @returns {UnionStruct}
   * @memberof UnionStruct
   */
  static from(number: number): UnionStruct {
    return new UnionStruct(number);
  }

  /**
   * Converts plain object with fields from UnionStruct to UnionStruct
   *
   * @static
   * @template T
   * @param {T} this
   * @returns {InstanceType<T>}
   * @memberof UnionStruct
   */
  static pack<T extends typeof UnionStruct>(
    this: T,
    obj: {[key in keyof Omit<InstanceType<T>, 'number'|'toString'>]?: number},
  ): InstanceType<T> {
    const struct = (new this()) as InstanceType<T>;

    for (const key in obj)
      struct[key] = obj[key];

    return struct;
  }

  /**
   * Marks class property as bit field
   *
   * @static
   * @param {number} lowBitNth Least significant bit of field
   * @param {number} [highBitNth=lowBitNth] Most significant bit of field
   * @returns
   * @memberof UnionStruct
   */
  static bits(lowBitNth: number, highBitNth: number = lowBitNth) {
    const mask = (1 << (highBitNth - lowBitNth + 1)) - 1;
    const shiftedNegatedMask = ~(mask << lowBitNth);

    return function decorator(target: UnionStruct, propertyKey: string) {
      const existingBitFields: BitFieldMetaInfo[] = (
        Reflect.getOwnMetadata(unionStructMetaField, target.constructor) || []
      );

      if (existingBitFields.find((item) => item.name === propertyKey))
        throw new Error('Redefined bit field!');

      existingBitFields.push(
        {
          name: propertyKey,
          lowBitNth,
          highBitNth,
        },
      );

      Reflect.defineMetadata(unionStructMetaField, existingBitFields, target.constructor);
      Object.defineProperty(
        target,
        propertyKey,
        {
          set(value: number) {
            this.number = (this.number & shiftedNegatedMask) | ((value & mask) << lowBitNth);
          },

          get() {
            return (this.number >> lowBitNth) & mask;
          },
        },
      );
    };
  }
}

export const {bits} = UnionStruct;
