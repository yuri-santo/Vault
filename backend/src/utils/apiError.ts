import type { Response } from 'express';

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    hint?: string;
    detail?: any;
  };
};

export function sendApiError(
  res: Response,
  status: number,
  code: string,
  message: string,
  opts?: { hint?: string; detail?: any }
) {
  return res.status(status).json({
    error: {
      code,
      message,
      hint: opts?.hint,
      detail: opts?.detail,
    },
  } satisfies ApiErrorPayload);
}
