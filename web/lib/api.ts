import "server-only";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const base = (
    process.env.API_BASE_URL || "http://127.0.0.1:8000/api"
  ).replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ApiError(
      503,
      "The workshop service is unavailable. Please try again.",
    );
  }
  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const errors: Record<string, string[]> = {};
    if (
      body &&
      typeof body === "object" &&
      "errors" in body &&
      body.errors &&
      typeof body.errors === "object"
    ) {
      for (const [key, value] of Object.entries(body.errors)) {
        if (
          Array.isArray(value) &&
          value.every((item) => typeof item === "string")
        )
          errors[key] = value;
      }
    }
    const message =
      response.status === 422
        ? "Check the highlighted fields and try again."
        : response.status === 404
          ? "This booking could not be found."
          : "The workshop service could not complete the request. Please try again.";
    throw new ApiError(response.status, message, errors);
  }
  if (body === null)
    throw new ApiError(
      502,
      "The workshop service returned an invalid response. Please try again.",
    );
  return body as T;
}
