// Compatibility barrel. Feature schemas are the source of truth.
export {
  profileFormSchema,
  type ProfileFormInput,
  type ProfileFormValues,
} from "../features/settings/schemas/profile.schema";
export {
  teamFormSchema,
  type TeamFormInput,
  type TeamFormValues,
} from "../features/teams/schemas/team.schema";
export {
  bookingFormSchema,
  type BookingFormInput,
  type BookingFormValues,
} from "../features/appointments/schemas/booking.schema";
export {
  leagueCreateFormSchema,
  leagueUpdateFormSchema,
  leagueScoreSchema,
  type LeagueCreateFormInput,
  type LeagueCreateFormValues,
  type LeagueUpdateFormInput,
  type LeagueUpdateFormValues,
  type LeagueScoreInput,
  type LeagueScoreValues,
} from "../features/leagues/schemas/league.schema";
