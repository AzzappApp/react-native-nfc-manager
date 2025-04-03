const minute = 60;
const hour = minute * 60;
const day = hour * 24;

export const getYearsDifference = (sinceTimestamp: number) => {
  return Math.abs(
    new Date(Date.now() - sinceTimestamp).getUTCFullYear() - 1970,
  );
};

export const getMonthsDifference = (sinceTimestamp: number) => {
  const fromMonth = new Date(sinceTimestamp);
  const toMonth = new Date();

  let months = (toMonth.getFullYear() - fromMonth.getFullYear()) * 12;
  months -= fromMonth.getMonth();
  months += toMonth.getMonth();
  return months <= 0 ? 0 : months;
};

/**
 * A helper function to get the elapsed time since a given timestamp.
 * @param sinceTimestamp The timestamp to compare against.
 * @returns An object with the elapsed time and the unit of time.
 */
const getElapsedTime = (sinceTimestamp: number) => {
  const elapsedYears = getYearsDifference(sinceTimestamp);
  if (elapsedYears > 0) return { kind: 'year', value: elapsedYears };

  const elapsedMonths = getMonthsDifference(sinceTimestamp);
  if (elapsedMonths > 0) return { kind: 'month', value: elapsedMonths };

  const elapsedSeconds = (Date.now() - sinceTimestamp) / 1000;

  if (elapsedSeconds > day)
    return { kind: 'day', value: Math.floor(elapsedSeconds / day) };
  if (elapsedSeconds > hour)
    return { kind: 'hour', value: Math.floor(elapsedSeconds / hour) };
  return { kind: 'minute', value: Math.floor(elapsedSeconds / minute) };
};

/**
 * A helper function to get the elapsed time since a given timestamp.
 * @param sinceTimestamp The timestamp to compare against.
 * @returns An object with the elapsed time and the unit of time.
 */
export const getFormatedElapsedTime = (sinceTimestamp: number) => {
  const elapsed = getElapsedTime(sinceTimestamp);
  if (elapsed.kind === 'minute' && elapsed.value === 0) return 'seconds ago';
  if (elapsed.kind === 'year' && elapsed.value > 1)
    return 'more than a year ago';

  if (elapsed.value > 1) elapsed.kind += 's';
  return `${elapsed.value} ${elapsed.kind} ago`;
};

export const formatBirthday = (year: number, month: number, day: number) => {
  const formattedDay = `${day < 10 ? 0 : ''}${day}`;
  const formattedMonth = `${month < 9 ? 0 : ''}${month + 1}`;

  return `${year}-${formattedMonth}-${formattedDay}`;
};

export const dateDiffInMonths = (startDate: Date, endDate: Date) =>
  Math.max(
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      endDate.getMonth() -
      startDate.getMonth(),
    0,
  );

export const dateDiffInMinutes = (startDate: Date, endDate: Date) =>
  Math.round((endDate.getTime() - startDate.getTime()) / 1000 / 60);

export const formatDateToYYYYMMDD = (date: Date) => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
};
