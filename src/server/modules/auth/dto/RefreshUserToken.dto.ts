import {IsString} from 'class-validator';

export class RefreshUserTokenDto {
  @IsString()
  readonly refreshToken: string;
}
