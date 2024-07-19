const lottieLoadingTasks: {
  [key: string]: Promise<JSON>;
} = {};

const lotties: {
  [key: string]: JSON;
} = {};

const lottieRetries: {
  [key: string]: number;
} = {};

const fetchLottie = (lottieUrl: string): Promise<JSON> => {
  if (!lottieLoadingTasks[lottieUrl]) {
    lottieLoadingTasks[lottieUrl] = fetch(lottieUrl)
      .then(response => response.json())
      .then(lottie => {
        lotties[lottieUrl] = lottie;
        delete lottieRetries[lottieUrl];
        delete lottieLoadingTasks[lottieUrl];
        return lottie;
      })
      .catch(error => {
        delete lottieLoadingTasks[lottieUrl];
        lottieRetries[lottieUrl] = (lottieRetries[lottieUrl] || 0) + 1;
        throw error;
      });
  }
  return lottieLoadingTasks[lottieUrl];
};

const useLottie = (lottieUrl: string | null | undefined) => {
  if (!lottieUrl) {
    return null;
  }
  if (lotties[lottieUrl]) {
    return lotties[lottieUrl];
  }
  if (lottieRetries[lottieUrl] && lottieRetries[lottieUrl] > 3) {
    throw new Error('Failed to fetch lottie');
  }
  throw fetchLottie(lottieUrl);
};

export default useLottie;
