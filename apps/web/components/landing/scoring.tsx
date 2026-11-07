import { leaderboardPreview, levels, rules } from "@/lib/content";
import { Ridge } from "./art/ridge";
import { type Level, Slope } from "./art/slope";
import { SnowLedge } from "./art/snow-ledge";
import { Icon } from "./icon";
import { SectionHead } from "./section-head";

// Sample board. When it scrolls into view, "You" (the row with a gain) climbs one place,
// passing the row listed after it; the CSS animates that swap. Rank numbers sit in their own
// column so they stay put while the rows move.
function Leaderboard() {
  const { tabs, rows } = leaderboardPreview;
  const you = rows.findIndex((row) => row.gained);
  const rowClass = (i: number) =>
    i === you ? "you" : you >= 0 && i === you + 1 ? "passed" : undefined;

  return (
    <div className="board-wrap reveal">
      <div className="board-copy">
        <h3>
          Every merge moves you <span>up the board.</span>
        </h3>
        <p>
          Points land the moment your pull request is merged. Climb the overall,
          weekly, college and first-timer boards.
        </p>
        <ul className="board-tabs" aria-label="Leaderboards">
          {tabs.map((tab) => (
            <li key={tab}>{tab}</li>
          ))}
        </ul>
      </div>
      <figure className="board panel">
        <SnowLedge id="board" />
        <figcaption className="board-head">
          <span>
            <Icon name="chart" size={16} />
            Leaderboard
          </span>
          <span className="board-tag">Sample</span>
        </figcaption>
        <div className="board-body">
          <ol className="board-ranks" aria-hidden="true">
            {rows.map((row, i) => (
              <li key={row.handle} className={`rank r${i + 1}`}>
                {i + 1}
              </li>
            ))}
          </ol>
          <ol className="board-rows">
            {rows.map((row, i) => (
              <li key={row.handle} className={rowClass(i)}>
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
        </div>
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
        {/* Each level is a ski run: the marker and the slope get tougher with the level. */}
        <div className="score-grid">
          {levels.map((item, i) => (
            <div
              key={item.level}
              className={`score score-${i + 1} panel reveal`}
            >
              <div className="score-top">
                <span className="run">
                  <span
                    className={`run-marker ${item.run}`}
                    aria-hidden="true"
                  />
                  {item.tier}
                </span>
                <span className="lv">{item.level}</span>
              </div>
              <div className="num">
                <span>{item.points}</span>
                <small>pts</small>
              </div>
              <p>{item.body}</p>
              <Slope level={(i + 1) as Level} />
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
