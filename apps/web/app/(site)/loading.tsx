export default function SiteLoading() {
  return (
    <div className="w-full animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-2/3 max-w-md rounded-lg bg-(color:--surface-2)" />
      <div className="mt-3 h-5 w-full max-w-xl rounded bg-(color:--surface-2)" />
      <div className="panel mt-8 h-72 w-full" />
    </div>
  );
}
