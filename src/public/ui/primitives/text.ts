// @ts-expect-error browser-resolved path to marked esm bundle (it breaks completely without this, not really sure why)
import { marked } from "../../../../node_modules/marked/lib/marked.esm.js";
import { Component } from "./component.js";
import { K2_SECONDARY } from "../theme.js";

export class Text extends Component<HTMLDivElement> {
    constructor(id?: string) {
        const el: HTMLDivElement = document.createElement("div");

        el.style.backgroundColor = "rgba(15, 0, 29, 0.3)";
        el.style.border = `1px solid ${K2_SECONDARY}`;
        el.style.borderRadius = "15px";
        el.style.margin = "1em";
        el.style.padding = "1em";

        if (id) {
            el.id = id;
        }

        super(el);
    }

    readMarkdown(filePath: string): void {
        void fetch(filePath)
            .then((response) => response.text())
            .then((markdown) => {
                this.el.innerHTML = marked(markdown) as string;
            });
    }
}
