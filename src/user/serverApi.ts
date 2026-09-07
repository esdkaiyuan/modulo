export interface PublicUser {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  createdAt: number;
}

export class ServerApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'ServerApiError';
  }
}

export type ResponseValidator<T> = (value: unknown) => value is T;

export interface RequestOptions<T> extends Omit<RequestInit, 'body' | 'credentials' | 'headers'> {
  body?: unknown;
  headers?: HeadersInit;
  validate?: ResponseValidator<T>;
}

interface ErrorEnvelope {
  error?: {
    code?: unknown;
    message?: unknown;
    field?: unknown;
  };
}

function errorFromResponse(status: number, payload: unknown): ServerApiError {
  const error = (payload as ErrorEnvelope | null)?.error;
  const code = typeof error?.code === 'string' ? error.code : `HTTP_${status}`;
  const message = typeof error?.message === 'string' ? error.message : 'Request failed';
  const field = typeof error?.field === 'string' ? error.field : undefined;
  return new ServerApiError(code, status, message, field);
}

async function parseJson(response: Response): Promise<unknown> {
  return response.json().catch(() => undefined);
}

function invalidResponse(): ServerApiError {
  return new ServerApiError('INVALID_RESPONSE', 502, 'Invalid server response');
}

async function parseSuccess<T>(response: Response, validate: ResponseValidator<T> | undefined): Promise<T> {
  if (!response.headers.get('Content-Type')?.toLowerCase().includes('application/json')) throw invalidResponse();
  const payload = await parseJson(response);
  if (!payload || typeof payload !== 'object' || (validate && !validate(payload))) throw invalidResponse();
  return payload as T;
}

export async function request<T>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const { body, headers: optionHeaders, validate, ...init } = options;
  const headers = new Headers(optionHeaders);
  if (body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (error) {
    if (error instanceof ServerApiError) throw error;
    throw new ServerApiError('NETWORK_ERROR', 0, 'Network request failed');
  }

  if (!response.ok) throw errorFromResponse(response.status, await parseJson(response));
  if (response.status === 204) return undefined as T;
  return parseSuccess(response, validate);
}
