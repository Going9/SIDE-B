/**
 * Error handling utilities
 */

interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log error with context (only in development)
 */
export function logError(
  error: unknown,
  context?: ErrorContext
): void {
  if (import.meta.env.DEV) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("[Error]", {
      message: errorMessage,
      stack: errorStack,
      ...context,
    });
  }
  // In production, you might want to send to error tracking service
  // e.g., Sentry, LogRocket, etc.
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose internal error messages to users
    if (error.message.includes("Failed to fetch")) {
      return "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }
    if (error.message.includes("permission")) {
      return "권한이 없습니다.";
    }
    if (error.message.includes("not found")) {
      return "요청한 내용을 찾을 수 없습니다.";
    }
  }
  return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
}

