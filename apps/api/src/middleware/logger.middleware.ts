import { randomUUID } from "node:crypto";
import { pinoHttp } from "pino-http";

export const requestLogger = pinoHttp({
  genReqId: (_req, res) => {
    const requestId = randomUUID();

    res.setHeader("X-Request-Id", requestId);

    return requestId;
  },

  customProps: (req) => ({
    requestId: req.id,
  }),

  customLogLevel: (_req, res, error) => {
    if (error || res.statusCode >= 500) {
      return "error";
    }

    if (res.statusCode >= 400) {
      return "warn";
    }

    return "info";
  },
});
