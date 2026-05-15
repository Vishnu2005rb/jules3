import { prisma } from './prisma';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  step: string;
  message: string;
  level: LogLevel;
  timestamp: string;
  data?: Record<string, any>;
}

/**
 * Appends a log entry to a submission's processingLog JSON field.
 * Non-blocking - errors are swallowed so they don't break the main flow.
 */
export async function appendLog(submissionId: string, entry: Omit<LogEntry, 'timestamp'>) {
  try {
    const submission = await prisma.userSubmission.findUnique({
      where: { id: submissionId },
      select: { processingLog: true }
    });

    const existing: LogEntry[] = (submission?.processingLog as LogEntry[]) || [];
    const newEntry: LogEntry = { ...entry, timestamp: new Date().toISOString() };

    await prisma.userSubmission.update({
      where: { id: submissionId },
      data: { processingLog: [...existing, newEntry] }
    });
  } catch (err) {
    console.error('[Logger] Failed to append log:', err);
  }
}
