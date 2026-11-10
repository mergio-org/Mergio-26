import { footerColumns, footerFacts, organiser } from "@/lib/content";
import { Crystal } from "./art/crystal";
import { SnowLedge } from "./art/snow-ledge";
import { Icon } from "./icon";

// A frosted card with snow and icicles on top, sitting right under the final pine forest like
// snowy ground, and a large faint wordmark as the sign-off.
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Crystal className="f1" />
      <div className="wrap">
        <div className="foot-card panel">
          <SnowLedge id="footer" />
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
                everyone.
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
        </div>
        <div className="foot-bottom">
          <span>
            Organised by <b>{organiser}</b>
          </span>
          <span className="foot-end">
            © {new Date().getFullYear()} Mergio
            <a className="to-top" href="#top">
              Back to top <span aria-hidden="true">↑</span>
            </a>
          </span>
        </div>
      </div>
      <div className="foot-mark" aria-hidden="true">
        Mergio
      </div>
    </footer>
  );
}
