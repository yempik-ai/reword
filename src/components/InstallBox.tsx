"use client";

import { useState } from "react";
import { commands } from "@/content/commands";
import type { Home } from "@/content/home";
import { site } from "@/content/site";
import CopyButton from "./CopyButton";

// The first thing to do with reword: get it. One box, three ways in, one
// press to copy. The sentence for a coding agent comes first because it is
// the shortest path; the commands are there for whoever wants to drive.

const COMMAND = { agent: site.installPrompt, terminal: commands.copy, starter: commands.clone } as const;

type WayId = Home["install"]["ways"][number]["id"];

export default function InstallBox({ install, id }: { install: Home["install"]; id?: string }) {
  const [current, setCurrent] = useState<WayId>(install.ways[0].id);
  const way = install.ways.find((one) => one.id === current) ?? install.ways[0];
  const command = COMMAND[way.id];

  return (
    <div className="install" id={id}>
      <div className="install-head">
        <p className="install-label">{install.label}</p>
        <div className="install-ways" role="group" aria-label={install.label}>
          {install.ways.map((one) => (
            <button key={one.id} type="button" aria-pressed={one.id === way.id} onClick={() => setCurrent(one.id)}>
              {one.label}
            </button>
          ))}
        </div>
      </div>
      <div className="install-command">
        <pre>
          <code>{command}</code>
        </pre>
        <CopyButton text={command} className="install-copy" />
      </div>
      <p className="install-hint">{way.hint}</p>
    </div>
  );
}
