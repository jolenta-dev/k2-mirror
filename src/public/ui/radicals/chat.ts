import { Component } from "../primitives/component.js";
import { root } from "../primitives/root.js";
import { Button, PageTitle, TextInput } from "../primitives/index.js";
import { DraggableDiv } from "../effects/draggable-div.js";
import { ChatMessageBox } from "./chat-message-box.js";
import { MemberList } from "./member-list.js";
import { MessageInput } from "./messageInput.js";

export class Chat extends Component {
    private chatBox!: ChatMessageBox;
    private loginWrapper!: HTMLDivElement;

    constructor() {
        const userLoggedIn = false; // temp obv
        const wrapper: HTMLDivElement = document.createElement("div");
        super(wrapper);
        if (userLoggedIn) {
            this.drawChat();
        } else {
            this.drawLogin();
        }
    }

    drawChat(): void {
        this.el.style.display = "flex";

        const chatInnerWrapper: HTMLDivElement = document.createElement("div");
        chatInnerWrapper.style.width = "65vw";
        chatInnerWrapper.style.boxSizing = "border-box";

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
        this.el.appendChild(chatInnerWrapper);
        this.el.appendChild(memberList.el);
        this.mount();

        this.addMessage("now", 0, "this is a test message");
    }

    drawLogin(): void {
        const wrapper: HTMLDivElement = document.createElement("div");
        this.loginWrapper = wrapper;
        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "column";
        wrapper.style.alignItems = "center";
        wrapper.style.textAlign = "center";
        wrapper.style.width = "100%";
        wrapper.style.boxSizing = "border-box";
        wrapper.style.paddingTop = "20vh";

        const title: HTMLDivElement = new PageTitle("Login").el;
        title.style.textAlign = "center";
        title.style.display = "flex";
        title.style.justifyContent = "center";
        title.style.width = "100%";

        wrapper.appendChild(title);

        const inputWrapper: HTMLDivElement = document.createElement("div");
        inputWrapper.id = "chat-login-input-wrapper";

        inputWrapper.style.display = "flex";
        inputWrapper.style.flexDirection = "column";
        inputWrapper.style.alignItems = "center";
        inputWrapper.style.width = "40vw";
        inputWrapper.style.maxWidth = "100%";
        inputWrapper.style.boxSizing = "border-box";

        const rulesHeading: HTMLHeadingElement = document.createElement("h3");
        rulesHeading.textContent = "RULES:";

        const rules: HTMLUListElement = document.createElement("ul");
        const rule: HTMLLIElement = document.createElement("li");
        rule.textContent = "Be chill.";
        rules.appendChild(rule);

        const blurb: HTMLParagraphElement = document.createElement("p");
        const blurbText: HTMLElement = document.createElement("i");
        blurbText.textContent =
            "Enter a nickname to join the chat. If it's a new nickname, you'll be given the option to claim it and register a password. If your name is already claimed, it'll prompt you for your password.";
        blurb.appendChild(blurbText);

        const nameInput: HTMLInputElement = new TextInput("nickname").el;
        nameInput.style.margin = "1em";
        nameInput.style.height = "4vh";

        const enterBtn: HTMLButtonElement = new Button("join", "chat-join-btn", false, true).el;
        enterBtn.style.display = "flex";
        enterBtn.style.fontSize = "clamp(1rem, 5vw, 0.75rem)";
        enterBtn.style.lineHeight = "1.25";
        enterBtn.style.padding = "1em 2em";
        enterBtn.style.margin = "0.6rem auto 0";

        enterBtn.addEventListener("click", (): void => {
            void this.handleJoin(nameInput.value);
        });
        nameInput.addEventListener("keydown", (e: KeyboardEvent): void => {
            if (e.key === "Enter") enterBtn.click();
        });

        inputWrapper.appendChild(rulesHeading);
        inputWrapper.appendChild(rules);
        inputWrapper.appendChild(blurb);
        inputWrapper.appendChild(nameInput);
        inputWrapper.appendChild(enterBtn);

        wrapper.appendChild(inputWrapper);
        root().appendChild(wrapper);
    }

    private async handleJoin(name: string): Promise<void> {
        const trimmed = name.trim();
        if (!trimmed) {
            window.alert("Enter a nickname to join.");
            return;
        }

        const res = await fetch("/api/names");
        if (!res.ok) {
            window.alert("Could not check whether that nickname is claimed.");
            return;
        }

        const names = (await res.json()) as Array<{ name: string }>;
        const claimed = names.some((entry) => entry.name.toLowerCase() === trimmed.toLowerCase());
        this.openPasswordModal(trimmed, claimed ? "login" : "register");
    }

    private openPasswordModal(name: string, mode: "login" | "register"): void {
        const content: HTMLDivElement = document.createElement("div");
        content.style.display = "flex";
        content.style.flexDirection = "column";
        content.style.alignItems = "center";
        content.style.padding = "1em";
        content.style.gap = "0.75em";
        content.style.boxSizing = "border-box";

        const passwordInput: HTMLInputElement = new TextInput("password").el;
        passwordInput.type = "password";
        passwordInput.style.width = "100%";
        passwordInput.style.boxSizing = "border-box";

        const submitLabel = mode === "login" ? "login" : "register";
        const submitBtn: HTMLButtonElement = new Button(
            submitLabel,
            `chat-${submitLabel}-btn`,
            false,
            true
        ).el;

        content.appendChild(passwordInput);
        content.appendChild(submitBtn);

        const title = mode === "login" ? `Login as "${name}"` : `Claim "${name}"`;
        const modal = new DraggableDiv(title, content, "default");

        const submit = async (): Promise<void> => {
            const password = passwordInput.value;
            if (!password) {
                window.alert(
                    mode === "login"
                        ? "A password is required to log in."
                        : "A password is required to register."
                );
                return;
            }

            const endpoint = mode === "login" ? "/api/login" : "/api/register";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, password }),
            });
            const body = (await res.json()) as { success?: boolean; error?: string };

            if (!res.ok || !body.success) {
                window.alert(
                    body.error ?? (mode === "login" ? "Login failed." : "Registration failed.")
                );
                return;
            }

            // registration does not set a session cookie; log in after claiming
            if (mode === "register") {
                const loginRes = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, password }),
                });
                const loginBody = (await loginRes.json()) as {
                    success?: boolean;
                    error?: string;
                };
                if (!loginRes.ok || !loginBody.success) {
                    window.alert(loginBody.error ?? "Registered, but login failed.");
                    return;
                }
            }

            modal.el.remove();
            this.enterChat();
        };

        submitBtn.addEventListener("click", (): void => {
            void submit();
        });
        passwordInput.addEventListener("keydown", (e: KeyboardEvent): void => {
            if (e.key === "Enter") submitBtn.click();
        });

        passwordInput.focus();
    }

    private enterChat(): void {
        this.loginWrapper.remove();
        this.drawChat();
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
