/** Venue wall-clock times use Brasília; timestamps remain UTC in storage. */
export function venueTime(date: string, time: string): Date {
  const wall = new Date(`${date}T${time}Z`).getTime();
  let instant = wall;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  for (let i = 0; i < 2; i++) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(instant))
        .map(({ type, value }) => [type, value]),
    );
    const displayed = Date.parse(
      `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`,
    );
    instant += wall - displayed;
  }
  return new Date(instant);
}
