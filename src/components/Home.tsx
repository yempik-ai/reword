import { commands } from "@/content/commands";
import type { Home as HomeContent } from "@/content/home";
import { site } from "@/content/site";
import CopyButton from "./CopyButton";
import DemoVideo from "./DemoVideo";

// The home page, section by section. Every string comes from content/home.ts
// and is rendered untouched: that is what makes it editable on the page.

function Label({ index, children }: { index: string; children: string }) {
  return (
    <p className="label">
      <span aria-hidden="true">{index}</span>
      <span>{children}</span>
    </p>
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

export default function Home({ c }: { c: HomeContent }) {
  return (
    <>
      <section className="hero">
        <p className="kicker">{c.hero.kicker}</p>
        <h1 className="hero-title">
          {/* The struck word is the joke, not the sentence: a screen reader gets the corrected line. */}
          <span>{c.hero.before}</span> <del aria-hidden="true">{c.hero.struck}</del>{" "}
          <ins>{c.hero.inserted}</ins>{" "}
          <span>{c.hero.after}</span>
        </h1>
        <p className="hero-lede">{c.hero.lede}</p>
        <div className="hero-actions">
          <a className="button button-solid" href={site.repo}>
            {c.hero.primary}
          </a>
          <a className="button" href="#how">
            {c.hero.secondary}
          </a>
          <p className="hero-note">{c.hero.note}</p>
        </div>
      </section>

      <figure className="demo">
        <DemoVideo label={c.demo.alt} />
        <figcaption>{c.demo.caption}</figcaption>
      </figure>

      <section className="section" aria-labelledby="steps-title">
        <Label index="01">{c.steps.label}</Label>
        <h2 id="steps-title">{c.steps.title}</h2>
        <ol className="steps">
          {c.steps.items.map((step) => (
            <li key={step.n}>
              <span className="step-n" aria-hidden="true">
                {step.n}
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" id="how" aria-labelledby="how-title">
        <Label index="02">{c.how.label}</Label>
        <h2 id="how-title">{c.how.title}</h2>
        <p className="section-lede">{c.how.lede}</p>
        <ul className="facts">
          {c.how.facts.map((fact) => (
            <li key={fact.label}>
              <p className="fact-label">{fact.label}</p>
              <h3>{fact.title}</h3>
              <p>{fact.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="between-title">
        <Label index="03">{c.between.label}</Label>
        <h2 id="between-title">{c.between.title}</h2>
        <p className="section-lede">{c.between.lede}</p>
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
              {c.between.rows.map((row) => (
                <tr key={row.aspect}>
                  <th scope="row">{row.aspect}</th>
                  <td>{row.cms}</td>
                  <td>{row.chat}</td>
                  <td className="compare-us">{row.reword}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" id="start" aria-labelledby="start-title">
        <Label index="04">{c.start.label}</Label>
        <h2 id="start-title">{c.start.title}</h2>
        <ul className="starts">
          <li>
            <h3>{c.start.cloneTitle}</h3>
            <p>{c.start.cloneText}</p>
            <Code>{commands.clone}</Code>
          </li>
          <li>
            <h3>{c.start.ownTitle}</h3>
            <p>{c.start.ownText}</p>
            <Code>{commands.copy}</Code>
          </li>
          <li>
            <h3>{c.start.agentTitle}</h3>
            <p>{c.start.agentText}</p>
            <Code>{site.installPrompt}</Code>
          </li>
        </ul>
      </section>

      <section className="section" aria-labelledby="agents-title">
        <Label index="05">{c.agents.label}</Label>
        <h2 id="agents-title">{c.agents.title}</h2>
        <p className="section-lede">{c.agents.lede}</p>
        <ul className="agents">
          {c.agents.items.map((agent) => (
            <li key={agent.name}>
              <h3>{agent.name}</h3>
              <p>{agent.text}</p>
            </li>
          ))}
        </ul>
        <Code>{commands.draft}</Code>
      </section>

      <section className="section" id="faq" aria-labelledby="faq-title">
        <Label index="06">{c.faq.label}</Label>
        <h2 id="faq-title">{c.faq.title}</h2>
        <div className="faq">
          {c.faq.items.map((item) => (
            <article key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="closing">
        <h2>{c.closing.title}</h2>
        <p>{c.closing.text}</p>
        <a className="button button-solid" href={site.repo}>
          {c.closing.cta}
        </a>
      </section>
    </>
  );
}
