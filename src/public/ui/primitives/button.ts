import { Wiggly } from "../effects/wiggly.js";
import { Component } from "./component.js";
import { K2_SECONDARY, K2_HIGHLIGHT, K2_HIGHLIGHT_HOVER } from "../theme.js";

export class Button extends Component<HTMLButtonElement> {
    constructor(content: string, id?: string, wiggles?: boolean, hasHover: boolean = true) {
        const el: HTMLButtonElement = document.createElement("button");
        el.textContent = content;

        if (id) {
            el.id = id;
        }

        // styling
        el.style.backgroundColor = K2_HIGHLIGHT;
        el.style.border = `1px solid ${K2_SECONDARY}`;
        el.style.borderRadius = "5px";
        el.style.boxSizing = "border-box";
        el.style.color = K2_SECONDARY;
        el.style.cursor = "pointer";
        el.style.font = "inherit";
        el.style.padding = "6px 14px";
        el.style.textAlign = "center";

        super(el);

        if (wiggles) {
            this.makeWiggly();
        }

        if (hasHover) {
            el.addEventListener("mouseenter", () => this.hover(el));
            el.addEventListener("mouseleave", () => this.hover(el));
        }

        this.mount();
    }

    /* TODO: add more button effects to chose from:
     * -spins
     *  -wiggles
     *  -sticky
     */
    makeWiggly(): void {
        new Wiggly(this.el);
    }
    // TODO: add an option for button sound effects

    hover(el: HTMLButtonElement): void {
        if (el.style.backgroundColor === "rgb(112, 141, 133)") {
            el.style.backgroundColor = K2_HIGHLIGHT;
            el.style.color = K2_SECONDARY;
        } else {
            el.style.backgroundColor = K2_HIGHLIGHT_HOVER;
            el.style.color = "black";
        }
    }
}
