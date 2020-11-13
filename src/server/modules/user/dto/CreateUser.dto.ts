import {IsEnum, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';
import {IsUniqueValue} from '@server/validators/IsUniqueValue';
import {UserScope} from '@server/constants/shared';

export class CreateUserDto {
  @IsUniqueValue(
    {
      repository: 'UserEntity',
      message: 'User with provided name already exists!',
    },
  )
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  readonly name: string;

  @IsString()
  @MinLength(5)
  readonly password: string;

  @IsOptional()
  @IsEnum(UserScope, {each: true})
  readonly scopes?: UserScope[];

  constructor(partial: Partial<CreateUserDto>) {
    Object.assign(this, partial);
  }
}
