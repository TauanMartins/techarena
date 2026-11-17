import { assertGeo } from '../../../common/domain/geo.js';
import { assertPageRequest } from '../../../common/domain/pagination.js';
import type { ProfileAccess } from '../../users/profile/application/ports/profile-access.port.js';
import type { AppointmentsRepository } from './ports/appointments.port.js';
import type {
  AppointmentQuery,
  CreateAppointment,
} from '../domain/appointment.js';
import { assertCalendarDate, planBooking } from '../domain/booking-policy.js';

export class AppointmentsApplication {
  constructor(
    private readonly repository: AppointmentsRepository,
    private readonly profiles: ProfileAccess,
    private readonly now: () => Date = () => new Date(),
  ) {}
  async list(actor: string, query: AppointmentQuery, mine = false) {
    await this.profiles.ensureExists(actor);
    assertPageRequest(query);
    assertGeo(query);
    return this.repository.list(actor, query, mine);
  }
  async create(actor: string, input: CreateAppointment) {
    await this.profiles.ensureAdult(actor);
    assertCalendarDate(input.date);
    return this.repository.transaction(async (store) => {
      const context = await store.context(input, input.scheduleId);
      const draft = planBooking(actor, input, context, this.now());
      return store.insert(draft);
    });
  }
}
