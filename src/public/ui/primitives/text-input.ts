import { Component } from "./component.js";
import { K2_SECONDARY } from "../theme.js";

export class TextInput extends Component<HTMLInputElement> {
    constructor(placeholder: string, id?: string) {
        const el: HTMLInputElement = document.createElement("input");
        el.placeholder = placeholder;

        if (id) {
            el.id = id;
        }

        // styling
        el.style.backgroundColor = "#0f001e";
        el.style.border = `1px solid ${K2_SECONDARY}`;
        el.style.borderRadius = "5px"; // clever shennanigans will be needed for this soon....
        el.style.boxSizing = "border-box";
        el.style.color = K2_SECONDARY;
        el.style.cursor = "text";
        el.style.font = "inherit";
        el.style.fontWeight = "bold";
        el.style.margin = "0";
        el.style.padding = "6px 14px";
        el.style.textAlign = "center";

        super(el);
        this.mount();
    }
}
