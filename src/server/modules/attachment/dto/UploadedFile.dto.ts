import {IsNumber, IsString} from 'class-validator';

export class UploadedFileDto {
  @IsString()
  mimetype: string;

  @IsString()
  file: string;

  @IsNumber()
  size: number;

  constructor(partial: Partial<UploadedFileDto>) {
    Object.assign(this, partial);
  }
}
