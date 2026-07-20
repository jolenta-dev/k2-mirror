import { TextInput, Button } from "../primitives/index.js";
import { Component } from "../primitives/component.js";
import { root } from "../primitives/root.js"; // temp for testing

export class MessageInput extends Component<HTMLDivElement> {
    constructor() {
        const container: HTMLDivElement = document.createElement("div");

        const input: TextInput = new TextInput("message");
        const button: Button = new Button("send", "send-btn", true, true);

        container.appendChild(input.el);
        container.appendChild(button.el);
        super(container);
        root().appendChild(container); // rm later
    }
}
