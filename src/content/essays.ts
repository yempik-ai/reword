import type { Locale } from "./site";

// ---------------------------------------------------------------------------
// Writing, in every language. Slugs and dates are the same in every locale,
// so reword treats them as structure and will not open them. Add an essay by
// adding one entry to each list, with the same slug.
// ---------------------------------------------------------------------------

/** A minimal block model. Paragraphs and list items may hold [label](href) links. */
export type Block = { t: "p"; text: string } | { t: "h2"; text: string } | { t: "ul"; items: string[] };

export type Essay = {
  slug: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
  summary: string;
  body: Block[];
};

export const essays: Record<Locale, Essay[]> = {
  en: [
    {
      slug: "your-personal-site-does-not-need-a-cms",
      date: "2026-11-16",
      title: "Your personal site does not need a CMS",
      summary:
        "A personal website has one writer and a few dozen pages. The comfort a CMS gives that writer can live inside the repository, next to the code, with nothing extra to run.",
      body: [
        {
          t: "p",
          text: "A personal website has one writer, a few dozen pages and no editorial workflow. A CMS solves the problems of a newsroom: many writers, roles, scheduling, an archive of thousands of entries. On a personal site it mostly adds a second place where your words live, with its own login, schema and bill.",
        },
        {
          t: "p",
          text: "So developers keep their copy in the repository, as typed files next to the components. That choice is correct and it has one cost: writing stops being pleasant. To fix a sentence you search for it in a file, edit a string between quotes, and look at the result somewhere else.",
        },
        { t: "h2", text: "The detour through the agent" },
        {
          t: "p",
          text: "Coding agents made this worse in a quiet way. It is now easy to say \"change the second paragraph of the about page so it sounds less formal\" and get it done. It also takes a minute, costs tokens, and returns words you did not write. For code that trade is excellent. For your own sentences it is backwards: you know exactly what you want to say, and typing it is faster than describing it.",
        },
        {
          t: "p",
          text: "What an agent is good at here is everything around the sentence. It can carry your edit into your other languages, run the build, and open the pull request. Those are the chores, and they are worth delegating.",
        },
        { t: "h2", text: "Put the cursor on the page" },
        {
          t: "p",
          text: "The missing piece is small: a text cursor on the page itself. Click the sentence, type, press Enter. The file changes underneath, because the page knows which string it is showing. No form, no preview pane, no description of the change.",
        },
        {
          t: "p",
          text: "That is what [reword](https://github.com/yempik-ai/reword) does. It gives a repository the one comfort a CMS has, and leaves the rest of the CMS out. How the save works is in [Git is the draft](/en/writing/git-is-the-draft).",
        },
        { t: "h2", text: "What you keep" },
        {
          t: "ul",
          items: [
            "One source of truth: the files in your repository.",
            "Review: every change is a diff, then a pull request.",
            "History and undo: git, as before.",
            "Zero running cost: nothing is deployed, nothing is billed.",
          ],
        },
      ],
    },
    {
      slug: "git-is-the-draft",
      date: "2026-11-15",
      title: "Git is the draft",
      summary:
        "How reword saves an edit: one string literal rewritten through the TypeScript syntax tree, with git as the only place where the draft exists.",
      body: [
        {
          t: "p",
          text: "Most editing tools keep a draft somewhere: a database row, a browser store, a file next to the content. Then they need a way to merge that draft back into the real thing. reword skips the problem. The edit goes into the real file at once, and the draft is whatever git says has changed.",
        },
        { t: "h2", text: "Finding the string" },
        {
          t: "p",
          text: "When the page loads in Edit mode, the dev server parses your content files with the TypeScript compiler and lists every string literal that sits in plain data. Each one gets an address made of property names and array positions. The browser receives the copy of the current language and walks the page: a text node whose text equals one of those strings is that string.",
        },
        {
          t: "p",
          text: "Nothing is added to the page to make this work. If the same words appear in two files, reword looks at the copy around them on the page and picks the literal that lives next to its neighbours in the source.",
        },
        { t: "h2", text: "Writing it back" },
        {
          t: "p",
          text: "A save carries four things: the file, the address, the text you saw and the text you typed. The server finds the literal by its address and compares its value with the text you saw. If the file moved on in the meantime, the save is refused. Otherwise it replaces that one literal, keeps its quote style, parses the file again and checks that nothing else changed.",
        },
        {
          t: "p",
          text: "The write is atomic and one at a time. Your new text is serialized as a string, so it cannot turn into code, whatever you type.",
        },
        { t: "h2", text: "Reading the draft" },
        {
          t: "p",
          text: "To show the review sheet, reword compares the last commit with your working tree, literal by literal. Each changed string is paired with the same address in your other languages. That pairing is the brief your agent receives: this sentence changed here, and these are the sentences to bring in line.",
        },
        {
          t: "p",
          text: "Because the draft is only a diff, everything you already know applies. You can stash it, discard it, or commit it by hand. Nothing in reword would notice.",
        },
      ],
    },
  ],

  it: [
    {
      slug: "your-personal-site-does-not-need-a-cms",
      date: "2026-11-16",
      title: "Al tuo sito personale non serve un CMS",
      summary:
        "Un sito personale ha una sola persona che scrive e qualche decina di pagine. La comodità che un CMS dà a chi scrive può stare dentro la repo, accanto al codice, senza niente in più da far girare.",
      body: [
        {
          t: "p",
          text: "Un sito personale ha una sola persona che scrive, qualche decina di pagine e nessun flusso editoriale. Un CMS risolve i problemi di una redazione: tante firme, ruoli, programmazione, un archivio di migliaia di voci. In un sito personale aggiunge soprattutto un secondo posto dove vivono le tue parole, con il suo login, il suo schema e il suo conto.",
        },
        {
          t: "p",
          text: "Per questo chi sviluppa tiene i testi nella repo, in file tipizzati accanto ai componenti. La scelta è giusta e ha un costo: scrivere smette di essere piacevole. Per sistemare una frase la cerchi in un file, modifichi una stringa tra virgolette e guardi il risultato da un'altra parte.",
        },
        { t: "h2", text: "Il giro largo passando dall'agente" },
        {
          t: "p",
          text: "I coding agent hanno peggiorato la cosa senza far rumore. Oggi è facile dire «cambia il secondo paragrafo della pagina about, che suoni meno formale» e vederlo fatto. Però ci vuole un minuto, costa token, e tornano indietro parole che non hai scritto tu. Per il codice lo scambio è ottimo. Per le tue frasi è al contrario: sai già cosa vuoi dire, e scriverlo è più veloce che descriverlo.",
        },
        {
          t: "p",
          text: "Dove un agente è bravo, qui, è in tutto quello che sta intorno alla frase. Porta la tua modifica nelle altre lingue, fa girare la build e apre la pull request. Sono le faccende, e vale la pena delegarle.",
        },
        { t: "h2", text: "Metti il cursore sulla pagina" },
        {
          t: "p",
          text: "Il pezzo che manca è piccolo: un cursore di testo sulla pagina stessa. Clicchi la frase, scrivi, premi Invio. Sotto cambia il file, perché la pagina sa quale stringa sta mostrando. Nessun form, nessun pannello di anteprima, nessuna descrizione della modifica.",
        },
        {
          t: "p",
          text: "È quello che fa [reword](https://github.com/yempik-ai/reword). Dà a una repo l'unica comodità di un CMS e lascia fuori il resto del CMS. Come funziona il salvataggio lo trovi in [La bozza è git](/it/writing/git-is-the-draft).",
        },
        { t: "h2", text: "Cosa ti resta" },
        {
          t: "ul",
          items: [
            "Una sola fonte di verità: i file nella tua repo.",
            "Revisione: ogni modifica è un diff, poi una pull request.",
            "Cronologia e undo: git, come prima.",
            "Zero costi di esercizio: niente da deployare, niente da pagare.",
          ],
        },
      ],
    },
    {
      slug: "git-is-the-draft",
      date: "2026-11-15",
      title: "La bozza è git",
      summary:
        "Come reword salva una modifica: una sola stringa riscritta passando dall'albero sintattico di TypeScript, con git come unico posto in cui la bozza esiste.",
      body: [
        {
          t: "p",
          text: "Quasi tutti gli strumenti di editing tengono una bozza da qualche parte: una riga di database, uno storage nel browser, un file accanto ai contenuti. Poi gli serve un modo per riportare quella bozza dentro la cosa vera. reword salta il problema. La modifica entra subito nel file vero, e la bozza è ciò che git dice che è cambiato.",
        },
        { t: "h2", text: "Trovare la stringa" },
        {
          t: "p",
          text: "Quando la pagina si carica in modalità Edit, il dev server legge i tuoi file di contenuti con il compiler di TypeScript ed elenca ogni stringa che sta dentro dati semplici. Ognuna riceve un indirizzo fatto di nomi di proprietà e posizioni negli array. Il browser riceve i testi della lingua corrente e scorre la pagina: un nodo di testo uguale a una di quelle stringhe è quella stringa.",
        },
        {
          t: "p",
          text: "Alla pagina non viene aggiunto niente per farlo funzionare. Se le stesse parole compaiono in due file, reword guarda i testi che hanno intorno nella pagina e sceglie la stringa che nel sorgente sta accanto ai suoi vicini.",
        },
        { t: "h2", text: "Riscriverla" },
        {
          t: "p",
          text: "Un salvataggio porta quattro cose: il file, l'indirizzo, il testo che hai visto e il testo che hai scritto. Il server trova la stringa dal suo indirizzo e confronta il suo valore con il testo che hai visto. Se nel frattempo il file è andato avanti, il salvataggio viene rifiutato. Altrimenti sostituisce solo quella stringa, mantiene il suo tipo di virgolette, rilegge il file e controlla che non sia cambiato nient'altro.",
        },
        {
          t: "p",
          text: "La scrittura è atomica e avviene una alla volta. Il tuo nuovo testo viene serializzato come stringa, quindi non può diventare codice, qualunque cosa tu scriva.",
        },
        { t: "h2", text: "Leggere la bozza" },
        {
          t: "p",
          text: "Per mostrare il foglio di revisione, reword confronta l'ultimo commit con il tuo working tree, stringa per stringa. Ogni stringa cambiata viene abbinata allo stesso indirizzo nelle altre lingue. Quell'abbinamento è il brief che riceve il tuo agente: questa frase è cambiata qui, e queste sono le frasi da riallineare.",
        },
        {
          t: "p",
          text: "Siccome la bozza è solo un diff, vale tutto quello che sai già. Puoi metterla in stash, buttarla via o committarla a mano. reword non se ne accorgerebbe nemmeno.",
        },
      ],
    },
  ],
};

export function getEssay(locale: Locale, slug: string): Essay | undefined {
  return essays[locale].find((essay) => essay.slug === slug);
}

/** Newest first. */
export function sortedEssays(locale: Locale): Essay[] {
  return [...essays[locale]].sort((a, b) => (a.date < b.date ? 1 : -1));
}
