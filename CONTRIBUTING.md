# Contributing

Issues and pull requests are welcome.

```bash
npm install
npm run edit      # the site with reword
npm run check     # lint, types, tests, build: must pass
```

- The tool is `src/reword`. Keep it self-contained: people copy that folder
  into their own sites. It imports nothing from the rest of this repository.
- The server half (everything outside `src/reword/client`) is also run by
  Node without a bundler (`npm run draft`). Import with the `.ts` extension
  and use only syntax that can be erased (no enums, no parameter properties).
- A behaviour change comes with a test next to the module.
- The site's copy is in `src/content`, in every language. A copy change
  touches all of them in the same pull request. The easy way is `npm run edit`.
- The safety contract in the README is not negotiable. A change that touches
  `guard.ts`, `next.ts`, `Mount.tsx` or the save path explains why it holds.
- No em dashes in copy: the house rule in `reword.config.ts` enforces it.
