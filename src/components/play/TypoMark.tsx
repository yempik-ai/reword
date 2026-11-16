"use client";

import { useEffect } from "react";

// The planted typo gets a spellchecker's squiggle. Drawn with the CSS Custom
// Highlight API, so the sentence stays one untouched text node: splitting it
// into spans would make it impossible to edit. The mark follows the text: it
// moves when the sentence is rewritten and goes away once the typo is fixed.

const NAME = "play-typo";

export default function TypoMark({ target, typo }: { target: string; typo: string }) {
  useEffect(() => {
    const element = document.getElementById(target);
    if (!element || typeof CSS === "undefined" || !("highlights" in CSS)) return;

    const draw = () => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const at = (node as Text).data.indexOf(typo);
        if (at < 0) continue;
        const range = new Range();
        range.setStart(node, at);
        range.setEnd(node, at + typo.length);
        CSS.highlights.set(NAME, new Highlight(range));
        return;
      }
      CSS.highlights.delete(NAME);
    };

    draw();
    const observer = new MutationObserver(draw);
    observer.observe(element, { characterData: true, childList: true, subtree: true });
    return () => {
      observer.disconnect();
      CSS.highlights.delete(NAME);
    };
  }, [target, typo]);

  return null;
}
