import type { Home } from "@/content/home";
import { play } from "@/content/play";
import type { Locale } from "@/content/site";

// The page's half of the playground: the desk beside the headline, the typo
// mark, and the ending "Send to agent" opens. Present where reword is: the
// playground build (NEXT_PUBLIC_REWORD_PLAYGROUND=1, defined in every build
// by withReword) and `npm run edit`. The condition is resolved at build
// time, as in reword's own Mount, so any other build has none of this code.

const pieces =
  (process.env.NODE_ENV === "development" && process.env.REWORD === "1") ||
  process.env.NEXT_PUBLIC_REWORD_PLAYGROUND === "1"
    ? await import("./play")
    : null;

/** True when reword is on the page and the page invites the visitor to use it. */
export const live = pieces !== null;

const typos = Object.values(play).map((one) => one.typo);

export function LiveDesk({ locale }: { locale: Locale }) {
  return pieces ? <pieces.Desk play={play[locale]} typos={typos} /> : null;
}

export function LiveTypo({ locale, target }: { locale: Locale; target: string }) {
  return pieces ? <pieces.TypoMark target={target} typo={play[locale].typo} /> : null;
}

export function LivePayoff(props: { locale: Locale; install: Home["install"]; check: string; newTab: string }) {
  return pieces ? <pieces.Payoff t={play[props.locale].payoff} install={props.install} check={props.check} newTab={props.newTab} /> : null;
}
