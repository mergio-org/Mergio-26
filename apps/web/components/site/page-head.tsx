export function PageHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="m-0 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{title}</h1>
      {children && <p className="mt-3 max-w-2xl text-(color:--muted)">{children}</p>}
    </header>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="panel p-8 text-center">
      <p className="m-0 font-medium">{title}</p>
      {children && <div className="mt-2 text-(color:--muted)">{children}</div>}
    </div>
  );
}
