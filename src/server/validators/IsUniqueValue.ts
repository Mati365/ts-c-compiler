import {EntityManager, SelectQueryBuilder} from 'typeorm';
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
    const [repository, column, queryBuilderMapper] = args.constraints;
    const record = await (() => {
      let queryBuilder = this
        .entityManager
        .getRepository(repository)
        .createQueryBuilder()
        .where(`${column} = :value`, {value});

      queryBuilder = queryBuilderMapper?.(
        {
          query: queryBuilder,
          obj: args.object,
          value,
        },
      ) ?? queryBuilder;

      return queryBuilder.getOne();
    })();

    return !record;
  }

  defaultMessage() {
    return 'Record already exists';
  }
}

export function IsUniqueValue(
  {repository, column, message, queryBuilderMapper, ...attrs}: ValidationOptions & {
    repository: string,
    column?: string,
    queryBuilderMapper?(
      attrs: {
        query: SelectQueryBuilder<any>,
        obj: Object,
        value: any,
      }
    ): SelectQueryBuilder<any>,
  },
) {
  return (object: Object, propertyName: string) => {
    registerDecorator(
      {
        name: 'isUniqueValue',
        target: object.constructor,
        constraints: [
          repository,
          column ?? propertyName,
          queryBuilderMapper,
        ],
        propertyName,
        validator: IsUniqueValueConstraint,
        options: {
          message,
        },
        ...attrs,
      },
    );
  };
}
