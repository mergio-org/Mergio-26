import { leaderboardPreview, levels, rules } from "@/lib/content";
import { Ridge } from "./art/ridge";
import { Icon } from "./icon";
import { SectionHead } from "./section-head";

// A sample board showing how a merge moves you up. Rows come from leaderboardPreview.
function Leaderboard() {
  const { tabs, rows } = leaderboardPreview;
  return (
    <div className="board-wrap reveal">
      <div className="board-copy">
        <h3>
          Every merge moves you <span>up the board.</span>
        </h3>
        <p>
          Points land on your profile as soon as a maintainer merges your pull
          request. Alongside the overall ranking there are weekly, college and
          first-timer boards, so everyone has something to climb.
        </p>
        <ul className="board-tabs" aria-label="Leaderboards">
          {tabs.map((tab) => (
            <li key={tab}>{tab}</li>
          ))}
        </ul>
      </div>
      <figure className="board panel">
        <figcaption className="board-head">
          <span>
            <Icon name="chart" size={16} />
            Leaderboard
          </span>
          <span className="board-tag">Sample</span>
        </figcaption>
        <ol className="board-rows">
          {rows.map((row, i) => (
            <li key={row.handle} className={row.gained ? "you" : undefined}>
              <span className="rank">{i + 1}</span>
              <span className="avatar" aria-hidden="true">
                {row.handle.charAt(0).toUpperCase()}
              </span>
              <span className="who">
                <b>{row.gained ? "You" : `@${row.handle}`}</b>
                <small>{row.merged} merged PRs</small>
              </span>
              {row.gained && <span className="gain">+{row.gained}</span>}
              <span className="pts">{row.points}</span>
            </li>
          ))}
        </ol>
      </figure>
    </div>
  );
}

export function Scoring() {
  return (
    <section className="section has-scene" id="scoring">
      <div className="aurora soft alt" aria-hidden="true" />
      <Ridge />
      <div className="wrap">
        <SectionHead
          eyebrow="Scoring"
          title="Clear, fair and"
          accent="transparent."
          center
        >
          Mentors set each issue&apos;s level before it is assigned, so everyone
          knows what it is worth.
        </SectionHead>
        <div className="score-grid">
          {levels.map((item, i) => (
            <div
              key={item.level}
              className={`score score-${i + 1} panel reveal`}
            >
              <div className="score-top">
                <span className="lv">{item.level}</span>
                {/* One snowflake per level, like difficulty markers on a ski slope. */}
                <span className="flakes" aria-hidden="true">
                  {Array.from({ length: i + 1 }, (_, k) => (
                    <Icon key={k} name="flake" size={14} />
                  ))}
                </span>
              </div>
              <div className="num">
                <span>{item.points}</span>
                <small>pts</small>
              </div>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
        <ul className="rules reveal">
          {rules.map((rule) => (
            <li key={rule}>
              <Icon name="check" size={16} />
              {rule}
            </li>
          ))}
        </ul>
        <Leaderboard />
      </div>
    </section>
  );
}
