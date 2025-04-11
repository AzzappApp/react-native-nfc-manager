/**
 * Multi purpose CORS lib.
 * Note: Based on the `cors` package in npm but using only
 * web APIs. Feel free to use it in your own projects.
 */

import type { AxiomRequest } from 'next-axiom';

type StaticOrigin =
  | Array<RegExp | boolean | string>
  | RegExp
  | boolean
  | string;

type OriginFn = (
  origin: string | undefined,
  req: Request,
) => Promise<StaticOrigin> | StaticOrigin;

type CorsOptions = {
  origin?: OriginFn | StaticOrigin;
  methods?: string[] | string;
  allowedHeaders?: string[] | string;
  exposedHeaders?: string[] | string;
  credentials?: boolean;
  maxAge?: number;
  optionsSuccessStatus?: number;
};

const defaultOptions: CorsOptions = {
  origin: '*',
  optionsSuccessStatus: 204,
};

function isOriginAllowed(origin: string, allowed: StaticOrigin): boolean {
  return Array.isArray(allowed)
    ? allowed.some(o => isOriginAllowed(origin, o))
    : typeof allowed === 'string'
      ? origin === allowed
      : allowed instanceof RegExp
        ? allowed.test(origin)
        : !!allowed;
}

function getOriginHeaders(reqOrigin: string | undefined, origin: StaticOrigin) {
  const headers = new Headers();

  if (origin === '*') {
    // Allow any origin
    headers.set('Access-Control-Allow-Origin', '*');
  } else if (typeof origin === 'string') {
    // Fixed origin
    headers.set('Access-Control-Allow-Origin', origin);
    headers.append('Vary', 'Origin');
  } else {
    const allowed = isOriginAllowed(reqOrigin ?? '', origin);

    if (allowed && reqOrigin) {
      headers.set('Access-Control-Allow-Origin', reqOrigin);
    }
    headers.append('Vary', 'Origin');
  }

  return headers;
}

// originHeadersFromReq

async function originHeadersFromReq(
  req: Request,
  origin: OriginFn | StaticOrigin,
) {
  const reqOrigin = req.headers.get('Origin') ?? undefined;
  const value =
    typeof origin === 'function' ? await origin(reqOrigin, req) : origin;

  if (!value) return;
  return getOriginHeaders(reqOrigin, value);
}

function getAllowedHeaders(req: Request, allowed?: string[] | string) {
  const headers = new Headers();

  if (!allowed) {
    allowed = req.headers.get('Access-Control-Request-Headers')!;
    headers.append('Vary', 'Access-Control-Request-Headers');
  } else if (Array.isArray(allowed)) {
    // If the allowed headers is an array, turn it into a string
    allowed = allowed.join(',');
  }
  if (allowed) {
    headers.set('Access-Control-Allow-Headers', allowed);
  }

  return headers;
}

type HTTPMethod =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT';

type RequestHandler = (req: AxiomRequest) => Promise<Response> | Response;

type CorsMethodMap = Partial<
  Record<Exclude<HTTPMethod, 'OPTIONS'>, RequestHandler>
>;

type CorsResult<T extends CorsMethodMap> = Record<keyof T, RequestHandler> & {
  OPTIONS: RequestHandler;
};

const mergeHeaders = (headers: Headers, v: string, k: string) => {
  if (k === 'Vary') headers.append(k, v);
  else headers.set(k, v);
};

const setOriginHeaders = async (
  req: AxiomRequest,
  headers: Headers,
  opts: CorsOptions,
) => {
  const originHeaders = await originHeadersFromReq(req, opts.origin ?? false);
  // If there's no origin we won't touch the response
  if (!originHeaders) return false;

  originHeaders.forEach((v: string, k: string) => mergeHeaders(headers, v, k));

  if (opts.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  const exposed = Array.isArray(opts.exposedHeaders)
    ? opts.exposedHeaders.join(',')
    : opts.exposedHeaders;

  if (exposed) {
    headers.set('Access-Control-Expose-Headers', exposed);
  }
  return true;
};

const cors = <T extends CorsMethodMap>(
  methodsMap: T,
  options?: CorsOptions,
): CorsResult<T> => {
  const opts = { ...defaultOptions, ...options };

  const optionsRequestHandler: RequestHandler = async req => {
    const headers = new Headers();
    const updated = await setOriginHeaders(req, headers, opts);
    if (!updated) {
      return new Response(null, { status: 204 });
    }
    const methods = opts.methods
      ? Array.isArray(opts.methods)
        ? opts.methods
        : [opts.methods]
      : [...Object.keys(methodsMap), 'OPTIONS'];

    headers.set('Access-Control-Allow-Methods', methods.join(','));

    getAllowedHeaders(req, opts.allowedHeaders).forEach(
      (v: string, k: string) => mergeHeaders(headers, v, k),
    );
    if (typeof opts.maxAge === 'number') {
      headers.set('Access-Control-Max-Age', String(opts.maxAge));
    }
    headers.set('Content-Length', '0');
    return new Response(null, { status: opts.optionsSuccessStatus, headers });
  };

  const results: CorsResult<T> = {} as CorsResult<T>;

  const corsWrapper =
    (handler: RequestHandler) => async (req: AxiomRequest) => {
      const res = await handler(req);
      const { headers } = res;
      const updated = await setOriginHeaders(req, headers, opts);
      if (!updated) {
        return res;
      }

      const exposed = Array.isArray(opts.exposedHeaders)
        ? opts.exposedHeaders.join(',')
        : opts.exposedHeaders;

      if (exposed) {
        headers.set('Access-Control-Expose-Headers', exposed);
      }
      return res;
    };

  results.OPTIONS = optionsRequestHandler;
  Object.entries(methodsMap).forEach(([method, handler]) => {
    (results as any)[method] = corsWrapper(handler);
  });

  return results;
};

export default cors;
