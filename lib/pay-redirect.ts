export function isAbortError(error: unknown) {
  return (
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      (error.name === "AbortError" || error.name === "TimeoutError")) ||
    (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError"))
  );
}

export function canFollowPayRedirect(opts: {
  mounted: boolean;
  aborted?: boolean;
  dialogOpen?: boolean;
}) {
  if (!opts.mounted || opts.aborted) return false;
  if (opts.dialogOpen === false) return false;
  return true;
}
