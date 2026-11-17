import { IsBigintId } from '../../../../../../../common/http/bigint-id.validator.js';

export class AppointmentIdDto {
  @IsBigintId()
  appointmentId!: string;
}
