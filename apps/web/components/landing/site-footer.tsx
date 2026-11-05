import { footerColumns, footerFacts, organiser } from "@/lib/content";
import { Icon } from "./icon";

// Sits on the snowy ground under the final forest: the page and body share the ground colour,
// so the footer needs no background of its own.
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <a className="brand" href="#top" aria-label="Mergio, back to top">
              <span className="brand-mark">
                <Icon name="flake" size={14} />
              </span>
              Mergio
            </a>
            <p>
              A month-long winter open-source program by {organiser}, open to
              students from every college.
            </p>
            <ul className="foot-facts">
              {footerFacts.map(({ value, label }) => (
                <li key={value}>
                  <b>{value}</b> {label}
                </li>
              ))}
            </ul>
          </div>
          <nav className="foot-cols" aria-label="Footer">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3>{column.title}</h3>
                <ul>
                  {column.links.map(({ label, href }) => (
                    <li key={label}>
                      <a href={href}>{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="foot-bottom">
          <span>
            Organised by <b>{organiser}</b>
          </span>
          <span>© {new Date().getFullYear()} Mergio</span>
        </div>
      </div>
    </footer>
  );
}
