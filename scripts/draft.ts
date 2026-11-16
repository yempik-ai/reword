import config from "../reword.config.ts";
import { renderBrief } from "../src/reword/draft.ts";
import { readDraft } from "../src/reword/workspace.ts";

// `npm run draft`: prints the pending draft as a brief, with the procedure to
// publish it. This is all an agent needs to read.

process.stdout.write(renderBrief(await readDraft(process.cwd(), config), config));
