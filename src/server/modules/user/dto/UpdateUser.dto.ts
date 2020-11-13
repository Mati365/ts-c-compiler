import {UserScope} from '@server/constants/shared';
import {IsUniqueValue} from '@server/validators/IsUniqueValue';
import {IsEnum, IsOptional, IsString, MinLength} from 'class-validator';

export class UpdateUserDto {
  readonly id: number;

  @IsString()
  @IsOptional()
  @IsUniqueValue(
    {
      repository: 'UserEntity',
      message: 'User with provided login already exists!',
      queryBuilderMapper({query, obj}) {
        return query.andWhere(
          'id != :id',
          {
            id: (<UpdateUserDto> obj).id,
          },
        );
      },
    },
  )
  readonly name?: string;

  @IsString()
  @MinLength(5)
  @IsOptional()
  readonly password?: string;

  @IsOptional()
  @IsString()
  readonly refreshToken?: string;

  @IsOptional()
  @IsEnum(UserScope, {each: true})
  readonly scopes?: UserScope[];

  constructor(partial: Partial<UpdateUserDto>) {
    Object.assign(this, partial);
  }
}
