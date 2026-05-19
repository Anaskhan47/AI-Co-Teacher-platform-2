export const ok = (data: unknown) => ({
  success: true,
  data,
  error: null
});

export const fail = (message: string) => ({
  success: false,
  data: null,
  error: {
    message
  }
});
