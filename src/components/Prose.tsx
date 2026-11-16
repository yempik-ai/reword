import type { Block } from "@/content/essays";
import InlineLinks from "./InlineLinks";

/** Renders an essay body, block by block. */
export default function Prose({ body, newTab }: { body: Block[]; newTab: string }) {
  return (
    <div className="prose">
      {body.map((block, index) => {
        switch (block.t) {
          case "p":
            return (
              <p key={index}>
                <InlineLinks text={block.text} newTab={newTab} />
              </p>
            );
          case "h2":
            return <h2 key={index}>{block.text}</h2>;
          case "ul":
            return (
              <ul key={index}>
                {block.items.map((item, position) => (
                  <li key={position}>
                    <InlineLinks text={item} newTab={newTab} />
                  </li>
                ))}
              </ul>
            );
        }
      })}
    </div>
  );
}
