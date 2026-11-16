import config from "../../reword.config";
import { commands } from "@/content/commands";
import type { Home as HomeContent } from "@/content/home";
import { site, type Locale } from "@/content/site";
import { PUBLISH_PROMPT } from "@/reword/draft";
import CopyButton from "./CopyButton";
import InstallBox from "./InstallBox";
import { live, LiveDesk, LiveTypo } from "./Live";
import { Caret } from "./Wordmark";

// The home page, set like a proof: the text on the right, the proofreader's
// notes in the margin on the left. Every string comes from content/home.ts
// and is rendered untouched: that is what makes it editable on the page.

/** A section of the proof: its name in the margin, its text beside it. */
function Sheet({ id, label, title, children }: { id: string; label: string; title: string; children: React.ReactNode }) {
  return (
    <section className="sheet" id={id} aria-labelledby={`${id}-title`}>
      <p className="sheet-label">
        <span aria-hidden="true">¶ </span>
        {label}
      </p>
      <div className="sheet-body">
        <h2 id={`${id}-title`}>{title}</h2>
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <div className="code">
      <pre>
        <code>{children}</code>
      </pre>
      <CopyButton text={children} />
    </div>
  );
}

/** The house rule of this site, as reword.config.ts writes it. */
const houseRule = config.forbid
  .map((rule) => `{ pattern: ${JSON.stringify(rule.pattern)}, message: ${JSON.stringify(rule.message)} }`)
  .join(",\n  ");

export default function Home({ c, locale }: { c: HomeContent; locale: Locale }) {
  return (
    <>
      <section className={live ? "hero hero-live" : "hero"} aria-labelledby="hero-title">
        <div className="hero-main">
          {live ? (
            <p className="hero-invite">
              <Caret className="invite-caret" />
              {c.hero.invite}
            </p>
          ) : (
            <p className="kicker">{c.hero.kicker}</p>
          )}
          <h1 id="hero-title" className="hero-title">
            {/* The struck word is the joke, not the sentence: a screen reader gets the corrected line. */}
            <span>{c.hero.before}</span> <del aria-hidden="true">{c.hero.struck}</del>{" "}
            <ins>{c.hero.inserted}</ins> <span>{c.hero.after}</span>
          </h1>
          <p id="hero-lede" className="hero-lede">
            {c.hero.lede}
          </p>
          <p id="hero-note" className="hero-note">
            {c.hero.note}
          </p>
          <InstallBox install={c.install} id="install" />
          <a className="hero-source" href={site.repo}>
            {c.hero.source}
            <span aria-hidden="true"> ↗</span>
          </a>
        </div>
        <LiveDesk locale={locale} />
      </section>
      <LiveTypo locale={locale} target="hero-note" />

      <Sheet id="loop" label={c.loop.label} title={c.loop.title}>
        <ol className="loop">
          {c.loop.items.map((step, index) => (
            <li key={index}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </Sheet>

      <Sheet id="how" label={c.how.label} title={c.how.title}>
        <p className="sheet-lede">{c.how.lede}</p>
        <ul className="facts">
          {c.how.facts.map((fact, index) => (
            <li key={index}>
              <p className="fact-label">{fact.label}</p>
              <h3>{fact.title}</h3>
              <p>{fact.text}</p>
            </li>
          ))}
        </ul>
        <figure className="rule">
          <figcaption>{c.how.rule}</figcaption>
          <pre>
            <code>{`forbid: [\n  ${houseRule},\n]`}</code>
          </pre>
        </figure>
      </Sheet>

      <Sheet id="between" label={c.between.label} title={c.between.title}>
        <p className="sheet-lede">{c.between.lede}</p>
        <div className="table-wrap">
          <table className="compare">
            <thead>
              <tr>
                <td />
                <th scope="col">{c.between.columns.cms}</th>
                <th scope="col">{c.between.columns.chat}</th>
                <th scope="col" className="compare-us">
                  {c.between.columns.reword}
                </th>
              </tr>
            </thead>
            <tbody>
              {c.between.rows.map((row, index) => (
                <tr key={index}>
                  <th scope="row">{row.aspect}</th>
                  <td>{row.cms}</td>
                  <td>{row.chat}</td>
                  <td className="compare-us">{row.reword}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sheet>

      <Sheet id="agents" label={c.agents.label} title={c.agents.title}>
        <p className="sheet-lede">{c.agents.lede}</p>
        <p className="code-caption">{c.agents.prompt}</p>
        <Code>{PUBLISH_PROMPT}</Code>
        <dl className="agents">
          {c.agents.items.map((agent, index) => (
            <div key={index}>
              <dt>{agent.name}</dt>
              <dd>{agent.text}</dd>
            </div>
          ))}
        </dl>
        <Code>{commands.draft}</Code>
      </Sheet>

      <Sheet id="start" label={c.start.label} title={c.start.title}>
        <ul className="starts">
          <li>
            <div>
              <h3>{c.start.cloneTitle}</h3>
              <p>{c.start.cloneText}</p>
            </div>
            <Code>{commands.clone}</Code>
          </li>
          <li>
            <div>
              <h3>{c.start.ownTitle}</h3>
              <p>{c.start.ownText}</p>
            </div>
            <Code>{commands.copy}</Code>
          </li>
          <li>
            <div>
              <h3>{c.start.agentTitle}</h3>
              <p>{c.start.agentText}</p>
            </div>
            <Code>{site.installPrompt}</Code>
          </li>
        </ul>
      </Sheet>

      <Sheet id="faq" label={c.faq.label} title={c.faq.title}>
        <div className="faq">
          {c.faq.items.map((item, index) => (
            <article key={index}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
      </Sheet>

      <section className="closing" aria-labelledby="closing-title">
        <h2 id="closing-title">{c.closing.title}</h2>
        <p>{c.closing.text}</p>
        <InstallBox install={c.install} />
      </section>
    </>
  );
}
