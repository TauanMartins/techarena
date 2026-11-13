import { describe, expect, it } from 'vitest';
import { bookingFormSchema } from './booking.schema';

const future = `${new Date().getFullYear() + 1}-01-01`;
const validBooking = {
  sportId: 'sport-1',
  arenaId: 'arena-1',
  scheduleId: 'schedule-1',
  date: future,
  title: ' Jogo de sábado ',
  description: ' Amigos ',
  maxPlayers: '12',
};

describe('bookingFormSchema', () => {
  it('trims text and parses the optional player limit', () => {
    expect(bookingFormSchema.parse(validBooking)).toMatchObject({
      title: 'Jogo de sábado',
      description: 'Amigos',
      maxPlayers: 12,
    });
  });

  it('accepts empty optional fields and an empty player limit', () => {
    expect(
      bookingFormSchema.parse({
        ...validBooking,
        title: '',
        description: '',
        maxPlayers: '',
      }),
    ).toMatchObject({ title: '', description: '', maxPlayers: undefined });
  });

  it('rejects missing selections, malformed or past dates, oversized text, and invalid limits', () => {
    for (const data of [
      { ...validBooking, sportId: '' },
      { ...validBooking, arenaId: '' },
      { ...validBooking, scheduleId: '' },
      { ...validBooking, date: 'not-a-date' },
      { ...validBooking, date: '2000-01-01' },
      { ...validBooking, title: 'x'.repeat(101) },
      { ...validBooking, description: 'x'.repeat(2001) },
      { ...validBooking, maxPlayers: 'abc' },
      { ...validBooking, maxPlayers: '0' },
      { ...validBooking, maxPlayers: '1001' },
    ])
      expect(bookingFormSchema.safeParse(data).success).toBe(false);
  });
});
