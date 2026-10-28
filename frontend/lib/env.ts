// Typed reads of the four documented environment variables. Reads process.env only, never a file.

function text(name: string): string | undefined {
  const value = process.env[name];
  return value === undefined || value.trim() === "" ? undefined : value.trim();
}

export const env = {
  /** Path to the read-only thesis repo. Never hard-coded. */
  seabednetRepo: text("SEABEDNET_REPO"),
  apiBaseUrl: text("API_BASE_URL"),
  samplesEnabled: text("SAMPLES_ENABLED")?.toLowerCase() === "true",
  /** Undecided, so undefined unless set (README open question 4). */
  uploadRetentionHours: (() => {
    const raw = text("UPLOAD_RETENTION_HOURS");
    if (raw === undefined) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  })(),
} as const;
