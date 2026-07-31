import { Button } from "../primitives/index.js";
import { Component } from "../primitives/component.js";
import { root } from "../primitives/root.js"; // temp

export class ChatToolbar extends Component<HTMLDivElement> {
    constructor(isAdmin: boolean) {
        const container: HTMLDivElement = document.createElement("div");

        if (isAdmin) {
            const announcementBtn: Button = new Button("hark!", "announcement-btn", true, true);
            const chatAdminBtn: Button = new Button("chat admin", "chat-admin-btn", true, true);
            container.appendChild(announcementBtn.el);
            container.appendChild(chatAdminBtn.el);
        } else {
            const newChatBtn: Button = new Button("new chat", "new-chat-btn", true, true);
            container.appendChild(newChatBtn.el);
        }

        const availableChatsBtn: Button = new Button(
            "available chats",
            "available-chats-btn",
            true,
            true
        );
        const chatTagBtn: Button = new Button("chat tag", "chat-tag-btn", true, true);
        container.appendChild(availableChatsBtn.el);
        container.appendChild(chatTagBtn.el);

        super(container);

        root().appendChild(container); // temp
    }
}
