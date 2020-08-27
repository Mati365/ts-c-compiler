import {EntityManager} from 'typeorm';
import {Injectable} from '@nestjs/common';
import {
  registerDecorator, ValidationArguments,
  ValidationOptions, ValidatorConstraint,
} from 'class-validator';

@Injectable()
@ValidatorConstraint(
  {
    async: true,
  },
)
export class IsUniqueValueConstraint {
  constructor(
    private entityManager: EntityManager,
  ) {}

  async validate(value: number|string, args: ValidationArguments) {
    const [repository, column] = args.constraints;
    const record = await (
      this
        .entityManager
        .getRepository(repository)
        .findOne(
          {
            where: {
              [column]: value,
            },
          },
        )
    );

    return !record;
  }

  defaultMessage() {
    return 'record already exists';
  }
}

export function IsUniqueValue(
  {repository, column, ...options}: ValidationOptions & {
    repository: string,
    column?: string,
  },
) {
  return (object: Object, propertyName: string) => {
    registerDecorator(
      {
        ...options,
        name: 'isUniqueValue',
        target: object.constructor,
        constraints: [repository, column ?? propertyName],
        propertyName,
        validator: IsUniqueValueConstraint,
      },
    );
  };
}
