import type { Locale } from "./site";

// The interface strings of the site: navigation, footer, small labels.

type Ui = {
  skip: string;
  nav: { label: string; how: string; start: string; writing: string; github: string; language: string };
  writing: { kicker: string; title: string; lede: string; metaTitle: string; metaDescription: string; back: string; read: string };
  footer: { line: string; origin: string; license: string; starter: string };
  newTab: string;
  notFound: { title: string; text: string; home: string };
};

export const ui: Record<Locale, Ui> = {
  en: {
    skip: "Skip to content",
    nav: {
      label: "Main",
      how: "How it works",
      start: "Quick start",
      writing: "Writing",
      github: "GitHub",
      language: "Language",
    },
    writing: {
      kicker: "Writing",
      title: "Notes on editing a website that lives in a repo.",
      lede: "Short pieces on why reword exists and how it works. Every one of them was edited on this page.",
      metaTitle: "Writing: editing a website that lives in a repo",
      metaDescription:
        "Notes from the makers of reword on personal websites without a CMS, in-place editing, and using git as the draft.",
      back: "All writing",
      read: "Read",
    },
    footer: {
      line: "reword is open source, built at Yempik.",
      origin: "Extracted from simonebova.com, where it edits about 3,300 strings in three languages.",
      license: "MIT license",
      starter: "This site is the starter: clone it and write.",
    },
    newTab: " (opens in a new tab)",
    notFound: {
      title: "This page does not exist.",
      text: "The address may be wrong, or the page moved.",
      home: "Back to the start",
    },
  },
  it: {
    skip: "Vai al contenuto",
    nav: {
      label: "Principale",
      how: "Come funziona",
      start: "Per partire",
      writing: "Scritti",
      github: "GitHub",
      language: "Lingua",
    },
    writing: {
      kicker: "Scritti",
      title: "Appunti su come si scrive un sito che vive in una repo.",
      lede: "Pezzi brevi sul perché esiste reword e su come funziona. Ognuno è stato corretto su questa pagina.",
      metaTitle: "Scritti: come si scrive un sito che vive in una repo",
      metaDescription:
        "Appunti di chi ha fatto reword sui siti personali senza CMS, sull'editing in-place e su git usato come bozza.",
      back: "Tutti gli scritti",
      read: "Leggi",
    },
    footer: {
      line: "reword è open source, fatto in Yempik.",
      origin: "Estratto da simonebova.com, dove modifica circa 3.300 stringhe in tre lingue.",
      license: "Licenza MIT",
      starter: "Questo sito è lo starter: clonalo e scrivi.",
    },
    newTab: " (si apre in una nuova scheda)",
    notFound: {
      title: "Questa pagina non esiste.",
      text: "L'indirizzo potrebbe essere sbagliato, oppure la pagina è stata spostata.",
      home: "Torna all'inizio",
    },
  },
};
