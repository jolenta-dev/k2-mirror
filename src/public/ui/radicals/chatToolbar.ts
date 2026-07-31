import { Button } from "../primitives/index.js";
import { Component } from "../primitives/component.js";
import { K2_PRIMARY, K2_SECONDARY, K2_HIGHLIGHT_HOVER } from "../theme.js";

export class ChatToolbar extends Component<HTMLDivElement> {
    constructor(isAdmin: boolean) {
        const el: HTMLDivElement = document.createElement("div");
        el.style.display = "flex";
        el.style.flexWrap = "wrap";
        el.style.overflow = "hidden";
        el.style.boxSizing = "border-box";
        el.style.width = "100%";
        el.style.color = K2_SECONDARY;

        super(el);

        const buttons: { label: string; id: string }[] = isAdmin
            ? [
                  { label: "hark!", id: "announcement-btn" },
                  { label: "chat admin", id: "chat-admin-btn" },
                  { label: "available chats", id: "available-chats-btn" },
                  { label: "chat tag", id: "chat-tag-btn" },
              ]
            : [
                  { label: "new chat", id: "new-chat-btn" },
                  { label: "available chats", id: "available-chats-btn" },
                  { label: "chat tag", id: "chat-tag-btn" },
              ];

        for (let i: number = 0; i < buttons.length; i++) {
            const item = buttons[i] as { label: string; id: string };
            const btn: Button = new Button(item.label, item.id, false, false);
            btn.el.style.fontSize = "1rem";
            btn.el.style.display = "inline-flex";
            btn.el.style.alignItems = "center";
            btn.el.style.justifyContent = "center";
            btn.el.style.gap = "0.35em";
            btn.el.style.maxWidth = "100%";
            btn.el.style.flex = "1 1 0";
            btn.el.style.borderRadius = "0";
            btn.el.style.backgroundColor = K2_PRIMARY;
            if (i === 0) {
                btn.el.style.borderRadius = "25px 0px 0px 25px";
            } else if (i === buttons.length - 1) {
                btn.el.style.borderRadius = "0px 25px 25px 0px";
            }
            this.el.appendChild(btn.el);

            btn.el.addEventListener("mouseenter", (): void => this.hover(btn.el));
            btn.el.addEventListener("mouseleave", (): void => this.hover(btn.el));
        }
    }

    hover(el: HTMLButtonElement): void {
        el.dataset.hover = el.dataset.hover === "true" ? "false" : "true";
        el.style.backgroundColor = el.dataset.hover === "true" ? K2_HIGHLIGHT_HOVER : K2_PRIMARY;
    }
}
