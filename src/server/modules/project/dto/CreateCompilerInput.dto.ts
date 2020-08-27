import {IsDefined, IsEnum} from 'class-validator';
import {EmulatorLanguage} from '@client/context/emulator-state/state';

export class CreateCompilerInputDto {
  @IsEnum(EmulatorLanguage)
  readonly language: EmulatorLanguage;

  @IsDefined()
  readonly code: string;
}
