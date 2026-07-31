import { Component } from "../primitives/component.js";
import { K2_SECONDARY, K2_TEXT } from "../theme.js";
import { ChatToolbar } from "./chatToolbar.js";
import { ConversationTabs } from "./conversation-tabs.js";

export class ChatMessageBox extends Component<HTMLDivElement> {
    readonly toolbar: ChatToolbar;
    readonly tabs: ConversationTabs;
    readonly messages: HTMLDivElement;

    constructor(isAdmin: boolean = false) {
        const el: HTMLDivElement = document.createElement("div");
        el.style.display = "flex";
        el.style.flexDirection = "column";
        el.style.width = "100%";
        el.style.boxSizing = "border-box";

        super(el);

        this.toolbar = new ChatToolbar(isAdmin);
        this.tabs = new ConversationTabs();

        this.messages = document.createElement("div");
        this.messages.style.width = "100%";
        this.messages.style.height = "80vh";
        this.messages.style.border = `1px solid ${K2_SECONDARY}`;
        this.messages.style.borderTop = "none";
        this.messages.style.boxSizing = "border-box";
        this.messages.style.borderRadius = "0 0 10px 10px";
        this.messages.style.padding = "10px";
        this.messages.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
        this.messages.style.color = K2_TEXT;
        this.messages.style.overflow = "auto";

        this.el.appendChild(this.toolbar.el);
        this.el.appendChild(this.tabs.el);
        this.el.appendChild(this.messages);
    }
}
