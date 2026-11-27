import ReactMarkdown from "react-markdown";

// Markdown written by organizers (FAQ answers, pages). Unlike applicant-written project
// descriptions it may contain images (uploaded to our object storage). Raw HTML is still never
// rendered. Links to other sites open in a new tab.
export function ContentMarkdown({ children, className = "md" }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          a: ({ href, children: label }) =>
            href && /^https?:\/\//.test(href) ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            ) : (
              <a href={href}>{label}</a>
            ),
          // eslint-disable-next-line @next/next/no-img-element -- remote images of unknown size
          img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" className="h-auto max-w-full rounded-lg" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
