import { assertPageRequest } from '../../../common/domain/pagination.js';
import { assertGeo } from '../../../common/domain/geo.js';
import type { ProfileAccess } from '../../users/profile/application/profile-access.port.js';
import type {
  AppointmentQuery,
  AppointmentsRepository,
  AvailabilityQuery,
  CreateAppointment,
} from '../domain/appointments.port.js';
import { assertCalendarDate } from '../domain/booking-policy.js';
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
    return this.repository.create(actor, input, this.now);
  }
}
export class AvailabilityApplication {
  constructor(
    private readonly repository: AppointmentsRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}
  async available(query: AvailabilityQuery) {
    assertCalendarDate(query.date);
    return { items: await this.repository.available(query, this.now()) };
  }
}
