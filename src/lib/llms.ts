import { commands } from "@/content/commands";
import { essays, type Block } from "@/content/essays";
import { home } from "@/content/home";
import { absolute, site } from "@/content/site";

// The site as plain text for language models (/llms.txt and /llms-full.txt),
// generated from the same content as the pages. English: the default locale.

const en = home.en;

/** Links inside copy are site paths (`/en/writing/...`): a text file needs the whole address. */
const absoluteLinks = (text: string) => text.replace(/\]\(\/([^)\s]*?)\/?\)/g, `](${site.url}/$1/)`);

function blocks(body: Block[]): string {
  return body
    .map((block) => {
      if (block.t === "h2") return `## ${block.text}`;
      if (block.t === "ul") return block.items.map((item) => `- ${absoluteLinks(item)}`).join("\n");
      return absoluteLinks(block.text);
    })
    .join("\n\n");
}

/** The short index: what reword is and where to read more. */
export function llmsIndex(): string {
  return [
    `# ${site.name}`,
    `> ${en.meta.description}`,
    [
      `${site.name} is open source (${site.license}), made at ${site.maker.name}. Source: ${site.repo}`,
      `Install prompt for a coding agent: ${site.installPrompt}`,
    ].join("\n"),
    "## Docs",
    [
      `- [README](${site.repo}#readme): what it is, quick start, configuration, agent handoff, limits`,
      `- [SPEC.md](${site.repo}/blob/main/SPEC.md): how to add reword to an existing site, written for coding agents`,
      `- [Everything on one page](${site.url}/llms-full.txt): this site as plain text`,
    ].join("\n"),
    "## Pages",
    [
      `- [Home](${absolute("en")}): ${en.hero.lede}`,
      ...essays.en.map((essay) => `- [${essay.title}](${absolute("en", `/writing/${essay.slug}`)}): ${essay.summary}`),
    ].join("\n"),
  ].join("\n\n") + "\n";
}

/** Everything a model needs to answer questions about reword, in one file. */
export function llmsFull(): string {
  const table = [
    `| | ${en.between.columns.cms} | ${en.between.columns.chat} | ${en.between.columns.reword} |`,
    "|---|---|---|---|",
    ...en.between.rows.map((row) => `| ${row.aspect} | ${row.cms} | ${row.chat} | ${row.reword} |`),
  ].join("\n");

  return [
    `# ${site.name}`,
    `> ${en.meta.description}`,
    `Source: ${site.repo} · License: ${site.license} · Made at ${site.maker.name} (${site.maker.url})`,
    `## ${en.steps.title}`,
    en.steps.items.map((step) => `${step.n}. **${step.title}.** ${step.text}`).join("\n"),
    `## ${en.how.title}`,
    en.how.lede,
    en.how.facts.map((fact) => `- **${fact.title}.** ${fact.text}`).join("\n"),
    `## ${en.between.title}`,
    en.between.lede,
    table,
    `## ${en.start.title}`,
    `${en.start.cloneText}\n\n\`\`\`\n${commands.clone}\n\`\`\``,
    `${en.start.ownText}\n\n\`\`\`\n${commands.copy}\n\`\`\``,
    `${en.start.agentText}\n\n\`\`\`\n${site.installPrompt}\n\`\`\``,
    `## ${en.agents.title}`,
    en.agents.lede,
    en.agents.items.map((agent) => `- **${agent.name}.** ${agent.text}`).join("\n"),
    "## Questions and answers",
    en.faq.items.map((item) => `### ${item.q}\n\n${item.a}`).join("\n\n"),
    ...essays.en.map((essay) => `# ${essay.title}\n\n${essay.summary}\n\n${blocks(essay.body)}`),
  ].join("\n\n") + "\n";
}
