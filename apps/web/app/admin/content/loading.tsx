export default function AdminContentLoading() {
  return (
    <div className="w-full animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-64 rounded-lg bg-(color:--surface-2)" />
      <div className="panel mt-8 h-96 w-full" />
    </div>
  );
}
