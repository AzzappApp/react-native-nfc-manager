export const getFileName = (path: string) => {
  const arr = path.split('/');
  return arr[arr.length - 1];
};
