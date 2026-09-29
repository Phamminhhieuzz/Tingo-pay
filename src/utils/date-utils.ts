export const getGMT7Date = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};
