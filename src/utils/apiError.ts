// O HttpExceptionFilter do backend aninha a mensagem em { error: { message } },
// não em { message } diretamente — por isso não dá pra ler err.response.data.message.
export const TOO_MANY_REQUESTS_MESSAGE =
  'Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.';

export const getApiErrorMessage = (err: any, fallback: string): string => {
  const error = err?.response?.data?.error;
  if (typeof error === 'string' && error.trim()) return error;
  const message = error?.message;
  if (Array.isArray(message)) return message[0];
  if (message) return message;
  if (err?.response?.status === 429) return TOO_MANY_REQUESTS_MESSAGE;
  return fallback;
};
