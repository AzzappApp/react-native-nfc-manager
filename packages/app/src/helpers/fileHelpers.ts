export const getFileName = (path: string) => {
  const arr = path.split('/');
  return arr[arr.length - 1];
};

export const isFileURL = (url: string) => {
  return url.startsWith('file://');
};
