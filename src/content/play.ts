import type { Locale } from "./site";

// ---------------------------------------------------------------------------
// The playground's copy: the proof ticket that dares the visitor to use the
// editor, the live draft beside it, and the ending that "Send to agent"
// opens. Shown only where reword is on the page (the playground build, and
// `npm run edit`). Ticket ids are structure: they say which interaction
// strikes an item off.
// ---------------------------------------------------------------------------

export type MarkId = "headline" | "typo" | "rule" | "send";
type Mark = { id: MarkId; label: string; hint: string; done: string };
type Step = { title: string; text: string };

export type Play = {
  /** The planted typo in `home.hero.note`. When the note no longer holds it, the typo is fixed. */
  typo: string;
  ticket: { title: string; lede: string; marks: Mark[] };
  draft: {
    title: string;
    inBrowser: string;
    inRepo: string;
    empty: string;
    typing: string;
    refused: string;
    edit: string;
    edits: string;
    review: string;
  };
  payoff: {
    title: string;
    lede: string;
    brief: string;
    next: string;
    translate: Step;
    translated: string;
    check: Step;
    pull: Step;
    honest: string;
    install: { title: string; text: string };
    us: { title: string; text: string; open: string; note: string; partial: string; copy: string };
    close: string;
  };
};

export const play: Record<Locale, Play> = {
  en: {
    typo: "tpyo",
    ticket: {
      title: "Mark up this page",
      lede: "Four corrections. Each one is something reword does on your own site.",
      marks: [
        { id: "headline", label: "Rewrite the headline", hint: "Click it, type, press Enter.", done: "Saved. Your draft shows the diff." },
        { id: "typo", label: "Fix the typo", hint: "It has a squiggle. No prompt needed.", done: "Fixed by hand. Zero tokens." },
        {
          id: "rule",
          label: "Break a house rule",
          hint: "Type an em dash in any text. On a Mac: Option, Shift and the minus key.",
          done: "Refused, with this site's own reason.",
        },
        {
          id: "send",
          label: "Review, then send",
          hint: "Review is in the bar at the bottom. Send to agent is in the sheet.",
          done: "Done. That was the whole loop.",
        },
      ],
    },
    draft: {
      title: "Your draft",
      inBrowser: "src/content, in this browser",
      inRepo: "src/content, not committed",
      empty: "Nothing yet. Each edit shows up here as the change it makes to our source.",
      typing: "typing",
      refused: "refused",
      edit: "edit",
      edits: "edits",
      review: "Review the draft",
    },
    payoff: {
      title: "You just used reword.",
      lede: "Those edits changed strings in our source files. On your own site, this is where you stop typing and your agent takes over.",
      brief: "What your agent reads. Real output, built from your edits:",
      next: "Then, on your machine:",
      translate: { title: "It translates.", text: "It brings the same copy in the other languages in line with yours:" },
      translated: "Nothing left to translate: you edited every language yourself.",
      check: { title: "It checks.", text: "It runs the check, and commits only if it passes:" },
      pull: { title: "It opens the pull request.", text: "You read it and you merge it. Nothing ships without you." },
      honest: "None of this ran here: a browser cannot start your agent. Everything above is what it would receive.",
      install: {
        title: "Now put it on your site.",
        text: "One sentence for your coding agent. It follows the porting guide and wires reword into your Next.js site.",
      },
      us: {
        title: "Or send your edit to us.",
        text: "You just rewrote our landing page. If your version reads better, open an issue with your brief. We read every one, and the ones we like go through our agent and ship on this page.",
        open: "Open an issue with my brief",
        note: "GitHub opens with the issue filled in. Nothing is sent until you submit it there.",
        partial: "Some edits did not fit in the link. Copy the full brief and paste it into the issue.",
        copy: "Copy the full brief",
      },
      close: "Keep editing",
    },
  },
  it: {
    typo: "rfeuso",
    ticket: {
      title: "Correggi questa pagina",
      lede: "Quattro correzioni. Ognuna è una cosa che reword fa sul tuo sito.",
      marks: [
        { id: "headline", label: "Riscrivi il titolo", hint: "Cliccalo, scrivi, premi Invio.", done: "Salvato. La tua bozza mostra il diff." },
        { id: "typo", label: "Correggi il refuso", hint: "È sottolineato. Niente prompt.", done: "Corretto a mano. Zero token." },
        {
          id: "rule",
          label: "Infrangi una regola di casa",
          hint: "Scrivi una lineetta lunga in un testo qualsiasi. Su Mac: Option, Shift e il tasto meno.",
          done: "Rifiutata, con il motivo di questo sito.",
        },
        {
          id: "send",
          label: "Rivedi, poi manda",
          hint: "Review è nella barra in basso. Send to agent è nel foglio.",
          done: "Fatto. Questo era il giro completo.",
        },
      ],
    },
    draft: {
      title: "La tua bozza",
      inBrowser: "src/content, in questo browser",
      inRepo: "src/content, non committato",
      empty: "Ancora niente. Ogni modifica compare qui come il cambiamento che fa al nostro sorgente.",
      typing: "stai scrivendo",
      refused: "rifiutato",
      edit: "modifica",
      edits: "modifiche",
      review: "Rivedi la bozza",
    },
    payoff: {
      title: "Hai appena usato reword.",
      lede: "Quelle modifiche hanno cambiato stringhe nei nostri file sorgente. Sul tuo sito, è qui che smetti di scrivere e passi la mano al tuo agente.",
      brief: "Cosa legge il tuo agente. Output vero, costruito dalle tue modifiche:",
      next: "Poi, sulla tua macchina:",
      translate: { title: "Traduce.", text: "Riallinea gli stessi testi nelle altre lingue a quello che hai scritto tu:" },
      translated: "Niente da tradurre: hai modificato tu ogni lingua.",
      check: { title: "Controlla.", text: "Fa girare il check, e committa solo se passa:" },
      pull: { title: "Apre la pull request.", text: "La leggi e fai il merge tu. Non va online niente senza di te." },
      honest: "Qui non è partito niente: un browser non può avviare il tuo agente. Tutto quello che vedi sopra è ciò che riceverebbe.",
      install: {
        title: "Adesso mettilo sul tuo sito.",
        text: "Una frase per il tuo coding agent. Segue la guida al porting e collega reword al tuo sito Next.js.",
      },
      us: {
        title: "Oppure manda a noi la tua modifica.",
        text: "Hai appena riscritto la nostra landing page. Se la tua versione suona meglio, apri una issue con il tuo brief. Le leggiamo tutte, e quelle che ci piacciono passano dal nostro agente e finiscono su questa pagina.",
        open: "Apri una issue con il mio brief",
        note: "GitHub si apre con la issue già compilata. Non parte niente finché non la invii da lì.",
        partial: "Alcune modifiche non stavano nel link. Copia il brief completo e incollalo nella issue.",
        copy: "Copia il brief completo",
      },
      close: "Continua a modificare",
    },
  },
};
