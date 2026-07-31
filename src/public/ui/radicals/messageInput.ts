import { TextInput, Button } from "../primitives/index.js";
import { Component } from "../primitives/component.js";

export class MessageInput extends Component<HTMLDivElement> {
    constructor() {
        const container: HTMLDivElement = document.createElement("div");
        container.style.display = "flex";
        container.style.alignItems = "stretch";
        container.style.width = "100%";
        container.style.margin = "10px 0";
        container.style.boxSizing = "border-box";

        const input: TextInput = new TextInput("message");
        input.el.style.textAlign = "";
        input.el.style.flex = "1 1 auto";
        input.el.style.minWidth = "0";
        input.el.style.width = "100%";
        input.el.style.borderRadius = "5px 0 0 5px";

        const button: Button = new Button("send", "send-btn", true, true);
        button.el.style.flex = "0 0 auto";
        button.el.style.borderRadius = "0 5px 5px 0";

        container.appendChild(input.el);
        container.appendChild(button.el);
        super(container);
    }
}
