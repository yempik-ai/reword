import type { Locale } from "./site";

// ---------------------------------------------------------------------------
// The home page, in every language. This file is the demo: run `npm run edit`
// (or open the live site), click a sentence on the page, and the string
// below changes.
// ---------------------------------------------------------------------------

type Step = { title: string; text: string };
/** One way to install. `id` is structure: it picks the command (content/commands.ts). */
type Way = { id: "agent" | "terminal" | "starter"; label: string; hint: string };
type Fact = { label: string; title: string; text: string };
type Row = { aspect: string; cms: string; chat: string; reword: string };
type Agent = { name: string; text: string };
type Question = { q: string; a: string };

export type Home = {
  meta: { title: string; description: string };
  hero: {
    /** Above the headline on a build without reword. */
    kicker: string;
    /** Above the headline when reword is on the page: the playground, or `npm run edit`. */
    invite: string;
    /** The headline is a proof correction: before, a struck word, the word put in, after. */
    before: string;
    struck: string;
    inserted: string;
    after: string;
    lede: string;
    /** Holds a planted typo (content/play.ts names it): the playground dares the visitor to fix it. */
    note: string;
    source: string;
  };
  install: { label: string; ways: Way[] };
  loop: { label: string; title: string; items: Step[] };
  how: { label: string; title: string; lede: string; facts: Fact[]; rule: string };
  between: {
    label: string;
    title: string;
    lede: string;
    columns: { cms: string; chat: string; reword: string };
    rows: Row[];
  };
  start: {
    label: string;
    title: string;
    cloneTitle: string;
    cloneText: string;
    ownTitle: string;
    ownText: string;
    agentTitle: string;
    agentText: string;
  };
  agents: { label: string; title: string; lede: string; prompt: string; items: Agent[] };
  faq: { label: string; title: string; items: Question[] };
  closing: { title: string; text: string };
};

export const home: Record<Locale, Home> = {
  en: {
    meta: {
      title: "reword: edit your website's copy by clicking on it",
      description:
        "reword is an open-source in-place editor for websites whose copy lives in code. Click a sentence, rewrite it, and the edit lands in your source file. Git is the draft. Your coding agent translates it and opens the pull request.",
    },
    hero: {
      kicker: "Open source. For websites whose copy lives in code.",
      invite: "This page runs reword. Click the headline and rewrite it.",
      before: "Edit your site by",
      struck: "prompting",
      inserted: "clicking",
      after: "on it.",
      lede: "reword is an in-place editor for websites whose copy lives in code. Click a sentence and rewrite it where it stands. The edit lands in your source file, git is the draft, and your coding agent translates it and opens the pull request.",
      note: "No CMS. No database. No prompt for a tpyo.",
      source: "MIT, one folder. Read it on GitHub",
    },
    install: {
      label: "Put it on your site",
      ways: [
        {
          id: "agent",
          label: "Ask your agent",
          hint: "Paste it into Claude Code, Codex, T3 Code or Cursor, in your site's repo. The agent follows the porting guide.",
        },
        { id: "terminal", label: "Copy the folder", hint: "Then follow the five steps in the README." },
        { id: "starter", label: "Start a new site", hint: "This site is the starter. Clone it and replace our words with yours." },
      ],
    },
    loop: {
      label: "The loop",
      title: "Click, review, send.",
      items: [
        {
          title: "Click",
          text: "Run the edit server and switch to Edit. Click a sentence and it becomes a text field, with the typography it already has. Enter saves, Esc cancels.",
        },
        {
          title: "Review",
          text: "Each edit is a word diff: what you took out, what you put in. One press takes an edit back. The draft is your uncommitted git diff and nothing more.",
        },
        {
          title: "Send",
          text: "One press hands the draft to your coding agent. It translates each edit into your other languages, runs your checks and opens a pull request. You merge.",
        },
      ],
    },
    how: {
      label: "Under the hood",
      title: "What happens when you press Enter.",
      lede: "reword adds no layer between you and your site. It reads the files you already have and changes one string at a time.",
      facts: [
        {
          label: "AST, not regex",
          title: "An edit rewrites one string literal",
          text: "The TypeScript compiler finds the literal by its address in the file. reword replaces that value, parses the file again and refuses the write if anything else moved.",
        },
        {
          label: "Git is the draft",
          title: "Nothing is stored anywhere else",
          text: "No draft table and no sidecar file. The draft is the difference between your last commit and your working tree. Undo is git. History is git.",
        },
        {
          label: "No markers",
          title: "The page finds its own copy",
          text: "Your components render strings untouched, so a text node that equals a content string is that string. No wrapper components, no data attributes, no invisible characters.",
        },
        {
          label: "Copy, not structure",
          title: "Slugs and dates stay out of reach",
          text: "On a multilingual site, copy is what differs between languages. A value that is the same everywhere is a slug, a date or a name, and reword will not open it.",
        },
        {
          label: "Local only",
          title: "The write route cannot exist in production",
          text: "The route that writes files is a route only in the editing dev server. A production build does not contain it. It answers loopback and same-origin requests, nothing else.",
        },
        {
          label: "House rules",
          title: "Your style guide, enforced at the keyboard",
          text: "Declare what your copy never contains. reword refuses it while you type and says why. This site writes without em dashes: try to type one.",
        },
      ],
      rule: "The rule, as this site's reword.config.ts declares it:",
    },
    between: {
      label: "Where it sits",
      title: "Between a devtool and an editorial tool.",
      lede: "A CMS gives writers a comfortable place to write and gives developers a second system to run. Editing in the repo gives developers one system and gives writers a diff. reword keeps the repo and adds the comfortable place.",
      columns: { cms: "A headless CMS", chat: "Asking an agent in chat", reword: "reword" },
      rows: [
        {
          aspect: "Where the copy lives",
          cms: "A database or a hosted service",
          chat: "Your repository",
          reword: "Your repository",
        },
        {
          aspect: "How you change a sentence",
          cms: "Log in, find the entry, fill a form",
          chat: "Describe the sentence and the change, wait, check",
          reword: "Click the sentence and type",
        },
        {
          aspect: "What you look at while you write",
          cms: "A form, sometimes a preview",
          chat: "A chat window",
          reword: "The page itself",
        },
        {
          aspect: "Translations",
          cms: "A plugin, or a second pass by hand",
          chat: "Another prompt",
          reword: "The agent writes them from your diff",
        },
        {
          aspect: "Review",
          cms: "Depends on the product",
          chat: "Read what the agent changed",
          reword: "A word diff before the commit, a pull request after",
        },
        {
          aspect: "What it costs to run",
          cms: "A service, an API key, a schema",
          chat: "Tokens for every typo",
          reword: "Nothing. It is part of your dev server",
        },
      ],
    },
    start: {
      label: "Quick start",
      title: "Clone it, or put it in the site you have.",
      cloneTitle: "Start a site from this one",
      cloneText: "This website is the starter. Clone it, start the edit server and replace our words with yours. That is the whole tutorial.",
      ownTitle: "Add it to your own site",
      ownText: "reword is one folder, one route file and a few lines of config. Copy the folder into a Next.js App Router site and follow the five steps in the README.",
      agentTitle: "Or let your agent install it",
      agentText: "The repository has a porting guide written for coding agents. Paste this into yours:",
    },
    agents: {
      label: "The handoff",
      title: "Any agent. One sentence.",
      lede: "The agent needs a single instruction, because one command prints both your edits and the procedure to publish them. That is why the handoff works with every coding agent.",
      prompt: "What every agent receives, word for word:",
      items: [
        {
          name: "T3 Code",
          text: "Built in. Send to agent starts a thread in your project, and you watch it work.",
        },
        {
          name: "Claude Code",
          text: "One line of config starts a headless session. Or paste the sentence into the session you already have open.",
        },
        {
          name: "Codex",
          text: "One line of config for a non-interactive run. Or paste the sentence.",
        },
        {
          name: "Cursor, Gemini CLI, a colleague",
          text: "If it can read a terminal, it can publish your draft. reword shows the sentence and a Copy button.",
        },
      ],
    },
    faq: {
      label: "Questions",
      title: "Before you install it.",
      items: [
        {
          q: "What is reword?",
          a: "reword is an open-source, in-place copy editor for websites whose text lives in the source code. You click a sentence on your running site, rewrite it, and reword saves the change into the source file. A coding agent then translates the edit and opens a pull request.",
        },
        {
          q: "Is reword a CMS?",
          a: "No. reword has no database, no admin panel and no hosted service. Your content stays in typed files in your repository, and git holds the draft and the history. It replaces the editing comfort of a CMS, not its storage.",
        },
        {
          q: "Does reword work without T3 Code?",
          a: "Yes. T3 Code is the built-in handoff, and any other agent works with one line of config or one pasted sentence: Claude Code, Codex, Cursor, or any tool that can run a command. Editing itself needs no agent at all.",
        },
        {
          q: "Which frameworks does reword support?",
          a: "Today reword runs in Next.js App Router sites whose content is in TypeScript or JavaScript files. The parser, the draft logic and the page matcher do not depend on Next.js, and the repository includes a porting guide for other setups.",
        },
        {
          q: "Is it safe to run?",
          a: "The part of reword that writes files exists only in a development server on your own machine. It is not part of a production build, it answers only loopback and same-origin requests, and it can change only the value of a string that already exists.",
        },
        {
          q: "How can this page be editable, then?",
          a: "This site is built in playground mode, an opt-in for demos. The build ships the editor's browser half with a backend that lives in your browser: your edits stay in local storage and never leave it. There is no route that writes files and no server. Without the flag, a production build contains nothing of reword.",
        },
        {
          q: "Can reword edit a site that has one language?",
          a: "Yes. On a single-language site reword skips translation and decides what is copy from the property name and the shape of the value. The agent then only runs your checks and opens the pull request.",
        },
        {
          q: "What can reword not edit?",
          a: "Text that is assembled in code: template strings with variables, concatenations, and text typed directly inside components. Move that text into a content file and it becomes editable. Structure such as slugs, dates and ids is locked on purpose.",
        },
        {
          q: "How much does reword cost?",
          a: "Nothing. reword is MIT licensed and runs inside the dev server you already have. Editing uses no tokens. Only the handoff uses your agent, once per draft.",
        },
      ],
    },
    closing: {
      title: "Your website has a text cursor now.",
      text: "Paste one sentence into your coding agent and make it true.",
    },
  },

  it: {
    meta: {
      title: "reword: modifica i testi del tuo sito cliccandoci sopra",
      description:
        "reword è un editor in-place open source per i siti che tengono i testi nel codice. Clicchi una frase, la riscrivi, e la modifica finisce nel file sorgente. La bozza è git. Il tuo coding agent la traduce e apre la pull request.",
    },
    hero: {
      kicker: "Open source. Per i siti che tengono i testi nel codice.",
      invite: "Su questa pagina gira reword. Clicca il titolo e riscrivilo.",
      before: "Riscrivi il tuo sito",
      struck: "con un prompt",
      inserted: "con un click",
      after: "e basta.",
      lede: "reword è un editor in-place per i siti che tengono i testi nel codice. Clicchi una frase e la riscrivi lì dov'è. La modifica finisce nel file sorgente, la bozza è git, e il tuo coding agent la traduce e apre la pull request.",
      note: "Niente CMS. Niente database. Niente prompt per un rfeuso.",
      source: "MIT, una cartella. Leggila su GitHub",
    },
    install: {
      label: "Mettilo sul tuo sito",
      ways: [
        {
          id: "agent",
          label: "Chiedilo al tuo agente",
          hint: "Incollala in Claude Code, Codex, T3 Code o Cursor, nella repo del tuo sito. L'agente segue la guida al porting.",
        },
        { id: "terminal", label: "Copia la cartella", hint: "Poi segui i cinque passi del README." },
        { id: "starter", label: "Parti da zero", hint: "Questo sito è lo starter. Clonalo e sostituisci le nostre parole con le tue." },
      ],
    },
    loop: {
      label: "Il giro",
      title: "Clicca, rivedi, manda.",
      items: [
        {
          title: "Clicca",
          text: "Avvia il server di editing e passa a Edit. Clicchi una frase e diventa un campo di testo, con la tipografia che ha già. Invio salva, Esc annulla.",
        },
        {
          title: "Rivedi",
          text: "Ogni modifica è un diff parola per parola: cosa hai tolto, cosa hai messo. Con un click ne annulli una. La bozza è il tuo diff di git non committato, e nient'altro.",
        },
        {
          title: "Manda",
          text: "Con un click la bozza passa al tuo coding agent. Traduce ogni modifica nelle altre lingue, fa girare i tuoi check e apre una pull request. Il merge lo fai tu.",
        },
      ],
    },
    how: {
      label: "Sotto il cofano",
      title: "Cosa succede quando premi Invio.",
      lede: "reword non mette nessuno strato tra te e il tuo sito. Legge i file che hai già e cambia una stringa alla volta.",
      facts: [
        {
          label: "AST, non regex",
          title: "Una modifica riscrive una sola stringa",
          text: "Il compiler di TypeScript trova la stringa dal suo indirizzo nel file. reword sostituisce quel valore, rilegge il file e rifiuta la scrittura se si è mosso qualcos'altro.",
        },
        {
          label: "La bozza è git",
          title: "Non c'è niente salvato altrove",
          text: "Nessuna tabella delle bozze e nessun file di appoggio. La bozza è la differenza tra l'ultimo commit e il working tree. L'undo è git. La cronologia è git.",
        },
        {
          label: "Nessun marcatore",
          title: "La pagina trova i suoi testi da sola",
          text: "I tuoi componenti mostrano le stringhe così come sono, quindi un nodo di testo uguale a una stringa dei contenuti è quella stringa. Niente componenti wrapper, niente data attribute, niente caratteri invisibili.",
        },
        {
          label: "Testi, non struttura",
          title: "Slug e date restano fuori portata",
          text: "In un sito multilingua, il testo è ciò che cambia da una lingua all'altra. Un valore identico ovunque è uno slug, una data o un nome, e reword non lo apre.",
        },
        {
          label: "Solo in locale",
          title: "La route che scrive non può esistere in produzione",
          text: "La route che scrive i file è una route solo nel dev server di editing. Una build di produzione non la contiene. Risponde a loopback e alle richieste same-origin, e a nient'altro.",
        },
        {
          label: "Regole di casa",
          title: "La tua guida di stile, applicata alla tastiera",
          text: "Dichiari cosa i tuoi testi non contengono mai. reword lo rifiuta mentre scrivi e ti dice perché. Questo sito scrive senza lineette lunghe: prova a digitarne una.",
        },
      ],
      rule: "La regola, come la dichiara il reword.config.ts di questo sito:",
    },
    between: {
      label: "Dove si mette",
      title: "A metà tra un devtool e uno strumento editoriale.",
      lede: "Un CMS dà a chi scrive un posto comodo per scrivere e a chi sviluppa un secondo sistema da tenere in piedi. Modificare nella repo dà a chi sviluppa un sistema solo e a chi scrive un diff. reword tiene la repo e aggiunge il posto comodo.",
      columns: { cms: "Un headless CMS", chat: "Chiederlo a un agente in chat", reword: "reword" },
      rows: [
        {
          aspect: "Dove vivono i testi",
          cms: "In un database o in un servizio esterno",
          chat: "Nella tua repo",
          reword: "Nella tua repo",
        },
        {
          aspect: "Come cambi una frase",
          cms: "Fai login, cerchi la voce, compili un form",
          chat: "Descrivi la frase e la modifica, aspetti, controlli",
          reword: "Clicchi la frase e scrivi",
        },
        {
          aspect: "Cosa guardi mentre scrivi",
          cms: "Un form, a volte un'anteprima",
          chat: "Una finestra di chat",
          reword: "La pagina stessa",
        },
        {
          aspect: "Traduzioni",
          cms: "Un plugin, o un secondo passaggio a mano",
          chat: "Un altro prompt",
          reword: "Le scrive l'agente partendo dal tuo diff",
        },
        {
          aspect: "Revisione",
          cms: "Dipende dal prodotto",
          chat: "Leggi cosa ha cambiato l'agente",
          reword: "Un diff parola per parola prima del commit, una pull request dopo",
        },
        {
          aspect: "Quanto costa farlo girare",
          cms: "Un servizio, una API key, uno schema",
          chat: "Token per ogni refuso",
          reword: "Niente. Fa parte del tuo dev server",
        },
      ],
    },
    start: {
      label: "Per partire",
      title: "Clonalo, oppure mettilo nel sito che hai.",
      cloneTitle: "Parti da questo sito",
      cloneText: "Questo sito è lo starter. Clonalo, avvia il server di editing e sostituisci le nostre parole con le tue. Il tutorial è tutto qui.",
      ownTitle: "Aggiungilo al tuo sito",
      ownText: "reword è una cartella, un file di route e qualche riga di config. Copia la cartella in un sito Next.js App Router e segui i cinque passi del README.",
      agentTitle: "Oppure fallo installare al tuo agente",
      agentText: "Nella repo c'è una guida al porting scritta per i coding agent. Incolla questo nel tuo:",
    },
    agents: {
      label: "Il passaggio",
      title: "Qualsiasi agente. Una frase.",
      lede: "All'agente basta una sola istruzione, perché un unico comando stampa sia le tue modifiche sia la procedura per pubblicarle. Per questo il passaggio funziona con ogni coding agent.",
      prompt: "Cosa riceve ogni agente, parola per parola:",
      items: [
        {
          name: "T3 Code",
          text: "Integrato. Send to agent apre un thread nel tuo progetto, e tu lo guardi lavorare.",
        },
        {
          name: "Claude Code",
          text: "Una riga di config avvia una sessione headless. Oppure incolli la frase nella sessione che hai già aperta.",
        },
        {
          name: "Codex",
          text: "Una riga di config per un'esecuzione non interattiva. Oppure incolli la frase.",
        },
        {
          name: "Cursor, Gemini CLI, una collega",
          text: "Se sa leggere un terminale, sa pubblicare la tua bozza. reword mostra la frase e un pulsante Copy.",
        },
      ],
    },
    faq: {
      label: "Domande",
      title: "Prima di installarlo.",
      items: [
        {
          q: "Che cos'è reword?",
          a: "reword è un editor di testi in-place e open source, per i siti che tengono i testi nel codice sorgente. Clicchi una frase sul sito in esecuzione, la riscrivi, e reword salva la modifica nel file sorgente. Poi un coding agent traduce la modifica e apre una pull request.",
        },
        {
          q: "reword è un CMS?",
          a: "No. reword non ha database, pannello di amministrazione o servizio esterno. I contenuti restano in file tipizzati nella tua repo, e git tiene la bozza e la cronologia. Sostituisce la comodità di scrittura di un CMS, non il suo archivio.",
        },
        {
          q: "reword funziona senza T3 Code?",
          a: "Sì. T3 Code è il passaggio integrato, e qualsiasi altro agente funziona con una riga di config o con una frase incollata: Claude Code, Codex, Cursor, o qualunque strumento che sappia eseguire un comando. Per scrivere non serve nessun agente.",
        },
        {
          q: "Quali framework supporta reword?",
          a: "Oggi reword gira nei siti Next.js App Router con i contenuti in file TypeScript o JavaScript. Il parser, la logica della bozza e il riconoscimento dei testi nella pagina non dipendono da Next.js, e nella repo c'è una guida al porting per gli altri casi.",
        },
        {
          q: "È sicuro da usare?",
          a: "La parte di reword che scrive i file esiste solo in un server di sviluppo sulla tua macchina. Non fa parte della build di produzione, risponde solo a loopback e alle richieste same-origin, e può cambiare solo il valore di una stringa che esiste già.",
        },
        {
          q: "E allora come fa questa pagina a essere modificabile?",
          a: "La build di questo sito è in modalità playground, un opt-in pensato per le demo. Contiene la metà dell'editor che gira nel browser, con un backend che vive nel tuo browser: le tue modifiche restano nel local storage e non ne escono. Non c'è nessuna route che scrive file e nessun server. Senza il flag, una build di produzione non contiene niente di reword.",
        },
        {
          q: "reword può modificare un sito in una sola lingua?",
          a: "Sì. In un sito con una lingua sola reword salta la traduzione e decide cosa è testo dal nome della proprietà e dalla forma del valore. L'agente a quel punto fa girare i tuoi check e apre la pull request.",
        },
        {
          q: "Cosa non può modificare reword?",
          a: "Il testo assemblato nel codice: template string con variabili, concatenazioni e testo scritto direttamente dentro i componenti. Sposta quel testo in un file di contenuti e diventa modificabile. La struttura, cioè slug, date e id, è bloccata di proposito.",
        },
        {
          q: "Quanto costa reword?",
          a: "Niente. reword ha licenza MIT e gira dentro il dev server che hai già. Scrivere non consuma token. Solo il passaggio usa il tuo agente, una volta per bozza.",
        },
      ],
    },
    closing: {
      title: "Adesso il tuo sito ha un cursore di testo.",
      text: "Incolla una frase nel tuo coding agent e rendilo vero.",
    },
  },
};
