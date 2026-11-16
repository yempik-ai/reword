// Commands shown on the site. Code is the same in every language, so it is
// not copy: reword leaves these alone.

export const commands = {
  clone: "git clone https://github.com/yempik-ai/reword my-site\ncd my-site && npm install\nnpm run edit",
  copy: "npx degit yempik-ai/reword/src/reword src/reword",
  draft: "npm run draft",
} as const;
