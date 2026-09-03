import type { LoggerService } from "@nestjs/common";

export class JsonLogger implements LoggerService {
  public log(message: unknown, context?: string): void {
    this.write("info", message, context);
  }
  public error(message: unknown, trace?: string, context?: string): void {
    this.write("error", message, context, trace);
  }
  public warn(message: unknown, context?: string): void {
    this.write("warn", message, context);
  }
  public debug(message: unknown, context?: string): void {
    this.write("debug", message, context);
  }
  public verbose(message: unknown, context?: string): void {
    this.write("trace", message, context);
  }

  private write(level: string, message: unknown, context?: string, trace?: string): void {
    const details =
      typeof message === "object" && message !== null && !(message instanceof Error)
        ? (message as Record<string, unknown>)
        : {};
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message:
        typeof message === "string"
          ? message
          : message instanceof Error
            ? message.message
            : typeof details.event === "string"
              ? details.event
              : "structured-event",
      ...details,
      ...(context ? { context } : {}),
      ...(trace ? { trace } : {}),
    });
    if (level === "error") process.stderr.write(`${line}\n`);
    else process.stdout.write(`${line}\n`);
  }
}
