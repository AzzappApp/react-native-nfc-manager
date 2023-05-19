export const relativeDateMinute = (fromDate: Date | number | string) => {
  const epoch = new Date(fromDate).getTime() - Date.now();
  return Math.floor(epoch / 1000);
};
