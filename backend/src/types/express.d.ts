declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` after a valid Bearer JWT. */
      userId?: number;
    }
  }
}

export {};
