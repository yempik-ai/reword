import { writeFile } from "node:fs/promises";
import config from "../reword.config.ts";
import { indexLiterals } from "../src/reword/draft.ts";
import { parseLiterals } from "../src/reword/literals.ts";
import { PLAYGROUND_INDEX, toIndex } from "../src/reword/playground.ts";
import { readSources } from "../src/reword/workspace.ts";

// `npm run playground`: parses the content files once, at build time, into
// public/reword-copy.json. A build with NEXT_PUBLIC_REWORD_PLAYGROUND=1 reads
// it in the browser: no TypeScript compiler and no git ever run there.

const sources = await readSources(process.cwd(), config);
const files = new Map([...sources].map(([file, source]) => [file, indexLiterals(parseLiterals(file, source, config.locales))]));
await writeFile(`public/${PLAYGROUND_INDEX}`, JSON.stringify(toIndex(files)));
process.stdout.write(`reword: indexed ${files.size} content files into public/${PLAYGROUND_INDEX}\n`);
