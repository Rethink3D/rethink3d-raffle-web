// O HttpExceptionFilter do backend aninha a mensagem em { error: { message } },
// não em { message } diretamente — por isso não dá pra ler err.response.data.message.
export const getApiErrorMessage = (err: any, fallback: string): string => {
  const message = err?.response?.data?.error?.message;
  if (Array.isArray(message)) return message[0];
  return message || fallback;
};
