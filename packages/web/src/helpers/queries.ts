import { withAxiom } from 'next-axiom';
import type { NextResponse } from 'next/server';
import type { AxiomRequest } from 'next-axiom';

type NextHandler<T = any> = (
  req: AxiomRequest,
  arg?: T,
) => NextResponse | Promise<NextResponse> | Promise<Response> | Response;

export const withPluginsRoute = (handler: NextHandler): NextHandler =>
  withAxiom(handler);
