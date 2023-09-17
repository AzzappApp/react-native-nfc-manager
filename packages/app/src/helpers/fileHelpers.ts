/**
 * Get file name from path
 * @param path - file path
 * @returns file name
 */
export const getFileName = (path: string) => {
  const arr = path.split('/');
  return arr[arr.length - 1];
};

/**
 * return true if url is file url
 * @param url - url
 * @returns true if url is file url
 */
export const isFileURL = (url: string) => {
  return url.startsWith('file://');
};
