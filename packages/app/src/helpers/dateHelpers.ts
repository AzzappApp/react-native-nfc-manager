export const relativeDateMinute = (fromDate: Date | number | string) => {
  const epoch = new Date(fromDate).getTime() - Date.now();
  return Math.floor(epoch / 1000);
};

/**
 * Converts an ISO 8601 duration to days.
 * @param isoDuration - The ISO 8601 duration string.
 * @returns The total number of days.
 */
export function iso8601DurationToDays(isoDuration: string): number {
  const regex = /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?/;
  const matches = isoDuration.match(regex);

  if (!matches) {
    throw new Error('Invalid ISO 8601 duration format');
  }

  const years = parseInt(matches[1] || '0', 10);
  const months = parseInt(matches[2] || '0', 10);
  const weeks = parseInt(matches[3] || '0', 10);
  const days = parseInt(matches[4] || '0', 10);

  // Assuming 1 year = 365 days and 1 month = 30 days for simplicity
  return years * 365 + months * 30 + weeks * 7 + days;
}
