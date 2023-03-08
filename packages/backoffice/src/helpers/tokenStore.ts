type Tokens = {
  token: string;
  refreshToken: string;
};

export const getTokens = (): Tokens | null => {
  const tokens = localStorage.getItem('tokens');
  if (tokens) {
    return JSON.parse(tokens);
  }
  return null;
};

export const setTokens = (tokens: Tokens) => {
  localStorage.setItem('tokens', JSON.stringify(tokens));
};

export const removeTokens = () => {
  localStorage.removeItem('tokens');
};
