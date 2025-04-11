import { waitUntil } from '@vercel/functions';
import { NextRequest } from 'next/server';
import {
  isEdgeRuntime,
  isVercelIntegration,
  Logger,
  LogLevel,
} from 'next-axiom';
import type { NextResponse } from 'next/server';
import type { AxiomRequest, RequestReport } from 'next-axiom';

type NextHandler<T = any> = (
  req: AxiomRequest,
  arg?: T,
) => NextResponse | Promise<NextResponse> | Promise<Response> | Response;

export const withPluginsRoute = (handler: NextHandler): NextHandler =>
  withAxiomRouteHandler(handler);

function withAxiomRouteHandler(handler: NextHandler): NextHandler {
  return async (req: NextRequest | Request, arg: any) => {
    let region = '';
    if ('geo' in req) {
      region = req.geo?.region ?? '';
    }

    let pathname = '';
    if (req instanceof NextRequest) {
      pathname = req.nextUrl.pathname;
    } else if (req instanceof Request) {
      // pathname = req.url.substring(req.headers.get('host')?.length || 0)
      pathname = new URL(req.url).pathname;
    }

    const report: RequestReport = {
      startTime: new Date().getTime(),
      endTime: new Date().getTime(),
      path: pathname,
      method: req.method,
      host: req.headers.get('host'),
      userAgent: req.headers.get('user-agent'),
      scheme: req.url.split('://')[0],
      ip: req.headers.get('x-forwarded-for'),
      region,
    };

    // main logger, mainly used to log reporting on the incoming HTTP request
    const logger = new Logger({
      req: report,
      source: isEdgeRuntime ? 'edge' : 'lambda',
    });
    // child logger to be used by the users within the handler
    const log = logger.with({});
    log.config.source = isEdgeRuntime ? 'edge-log' : 'lambda-log';
    const axiomContext = req as AxiomRequest;
    const args = arg;
    axiomContext.log = log;

    try {
      const result = await handler(axiomContext, args);
      report.endTime = new Date().getTime();

      // report log record
      report.statusCode = result.status;
      report.durationMs = report.endTime - report.startTime;
      logger.logHttpRequest(
        LogLevel.info,
        `[${req.method}] ${report.path} ${report.statusCode} ${report.endTime - report.startTime}ms`,
        report,
        {},
      );
      // attach the response status to all children logs
      log.attachResponseStatus(result.status);

      // flush the logger along with the child logger
      waitUntil(logger.flush());
      if (isEdgeRuntime && isVercelIntegration) {
        logEdgeReport(report);
      }
      return result;
    } catch (error: any) {
      report.endTime = new Date().getTime();
      // report log record
      report.statusCode = 500;
      report.durationMs = report.endTime - report.startTime;
      logger.logHttpRequest(
        LogLevel.error,
        `[${req.method}] ${report.path} ${report.statusCode} ${report.endTime - report.startTime}ms`,
        report,
        {},
      );

      log.error(error.message, { error });
      log.attachResponseStatus(500);

      waitUntil(logger.flush());
      if (isEdgeRuntime && isVercelIntegration) {
        logEdgeReport(report);
      }
      throw error;
    }
  };
}

function logEdgeReport(report: RequestReport) {
  console.log(`AXIOM_EDGE_REPORT::${JSON.stringify(report)}`);
}
