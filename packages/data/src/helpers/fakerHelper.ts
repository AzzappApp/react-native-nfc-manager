export const generateFakeInsightsData = (numberOfDays: number) => {
  //@ts-expect-error fake data , quick n dirty
  const data: [
    { date: string; scans: number; webcardViews: number; totalLikes: number },
  ] = [];

  for (let i = 0; i < numberOfDays; i++) {
    const date = new Date(2022, 0, i + 1).toISOString().slice(0, 10);
    const scans = Math.floor(Math.random() * 100);
    const webcardViews = Math.floor(Math.random() * 100);
    const totalLikes = Math.floor(Math.random() * 100);
    data.push({ date, scans, webcardViews, totalLikes });
  }

  return data;
};
