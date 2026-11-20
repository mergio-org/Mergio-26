import ReactMarkdown from "react-markdown";

// Project descriptions are written by applicants, so they render without raw HTML (react-markdown
// never renders it) and without images (a remote image could track visitors). Links open in a new
// tab and carry no referrer or ranking credit.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        disallowedElements={["img"]}
        unwrapDisallowed
        components={{
          a: ({ href, children: label }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc">
              {label}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

/** The first ~160 characters of a markdown description as plain text, for cards. */
export function excerpt(markdown: string, length = 160) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length).replace(/\s+\S*$/, "")}…` : text;
}
