export function FullPageSpinner() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-green-700" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
