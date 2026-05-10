import { ZodError } from "zod";

export const formatZodError = (error: ZodError) => {
  const formattedErrors: Record<string, string> = {};

  error.issues.forEach((err) => {
    const field = err.path[err.path.length - 1] as string;
    formattedErrors[field] = err.message;
  });

  return formattedErrors;
};
