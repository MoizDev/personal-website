import { S } from "./meta";
import { Chapter, Figure } from "@/components/writeup/parts";
import { CallFlow } from "./figures/CallFlow";
import "./figures/figures.css";

export function Article() {
  return (
    <>
      <Chapter s={S.what} />
      <p>Draft.</p>
      <Figure title="One call, instrumented" caption="Draft flowchart." tools>
        <CallFlow />
      </Figure>
    </>
  );
}
