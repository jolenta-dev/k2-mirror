import { Component } from "../primitives/component.js";
import { ChatMessageBox } from "./chat-message-box.js";
import { MemberList } from "./member-list.js";
import { MessageInput } from "./messageInput.js";

export class Chat extends Component {
    private readonly chatBox: ChatMessageBox;

    constructor() {
        const chatWrapper: HTMLDivElement = document.createElement("div");
        chatWrapper.style.display = "flex";

        const chatInnerWrapper: HTMLDivElement = document.createElement("div");
        chatInnerWrapper.style.width = "65vw";
        chatInnerWrapper.style.boxSizing = "border-box";
        super(chatWrapper);

        this.chatBox = new ChatMessageBox(false);
        const messageInput = new MessageInput();
        const memberList = new MemberList();
        memberList.el.style.position = "absolute";
        memberList.el.style.top = "9.5vh"; // TODO: these are kinda random settings
        memberList.el.style.left = "66vw";

        this.chatBox.el.style.width = "100%";
        messageInput.el.style.width = "100%";

        chatInnerWrapper.appendChild(this.chatBox.el);
        chatInnerWrapper.appendChild(messageInput.el);
        chatWrapper.appendChild(chatInnerWrapper);
        chatWrapper.appendChild(memberList.el);
        super.mount();

        this.addMessage("now", 0, "this is a test message");
    }

    public addMessage(timestamp: string, user_id: number, message: string): void {
        const username: string = "test" + user_id; // TODO: fetch username from db here based on user_id
        const tag: string = "(COOL TESTER)";
        const messageString: string =
            "[" + timestamp + "] " + tag + " " + username + ": " + message;

        const newMessageEl: HTMLLIElement = document.createElement("li");
        newMessageEl.style.listStyle = "none";
        newMessageEl.textContent = messageString;
        this.chatBox.messages.appendChild(newMessageEl);
    }
}
