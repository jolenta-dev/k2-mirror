import { Component } from "../primitives/component.js";
import { K2_HIGHLIGHT, K2_HIGHLIGHT_HOVER, K2_PRIMARY, K2_SECONDARY, K2_TEXT } from "../theme.js";

export type Conversation = {
    id: string;
    label: string;
};

export class ConversationTabs extends Component<HTMLDivElement> {
    private activeId: string;
    private openIds: string[];
    private conversations: Map<string, Conversation>;
    private unreadIds: Set<string>;

    constructor(
        conversations: Conversation[] = [
            { id: "1", label: "general" },
            { id: "2", label: "vip" },
        ]
    ) {
        const el: HTMLDivElement = document.createElement("div");
        el.setAttribute("role", "tablist");
        el.style.display = "flex";
        el.style.flexWrap = "wrap";
        el.style.overflow = "hidden";
        el.style.boxSizing = "border-box";
        el.style.width = "100%";
        el.style.border = `1px solid ${K2_SECONDARY}`;
        el.style.borderRadius = "10px 10px 0 0";
        el.style.backgroundColor = K2_PRIMARY;
        el.style.color = K2_SECONDARY;

        super(el);

        this.conversations = new Map(conversations.map((c) => [c.id, c]));
        this.openIds = conversations.map((c) => c.id);
        this.activeId = this.openIds[0] ?? "";
        this.unreadIds = new Set();

        this.renderTabs();
        if (this.activeId) {
            void this.fetchMessages(this.activeId);
        }
    }

    private renderTabs(): void {
        this.el.replaceChildren();

        for (const id of this.openIds) {
            const convo: Conversation | undefined = this.conversations.get(id);
            if (!convo) {
                continue;
            }

            const active: boolean = id === this.activeId;
            const btn: HTMLButtonElement = document.createElement("button");
            btn.type = "button";
            btn.setAttribute("role", "tab");
            btn.setAttribute("aria-selected", active ? "true" : "false");
            btn.dataset.conversationId = id;
            if (active) {
                btn.dataset.active = "true";
            }

            btn.style.flex = "0 1 auto";
            btn.style.margin = "0";
            btn.style.backgroundColor = active ? K2_HIGHLIGHT_HOVER : K2_PRIMARY;
            btn.style.border = "none";
            btn.style.borderRadius = "5px 5px 0 0";
            btn.style.borderRight = `1px solid ${K2_HIGHLIGHT}`;
            btn.style.cursor = "pointer";
            btn.style.padding = "0.5rem 0.55rem 0.5rem 1rem";
            btn.style.font = "inherit";
            btn.style.fontSize = "1rem";
            btn.style.fontWeight = active ? "bold" : "normal";
            btn.style.color = K2_SECONDARY;
            btn.style.textAlign = "center";
            btn.style.display = "inline-flex";
            btn.style.alignItems = "center";
            btn.style.gap = "0.35rem";
            btn.style.maxWidth = "100%";
            btn.style.boxSizing = "border-box";

            const label: HTMLSpanElement = document.createElement("span");
            label.style.minWidth = "0";
            label.style.overflow = "hidden";
            label.style.textOverflow = "ellipsis";
            label.textContent = convo.label + (this.unreadIds.has(id) ? " (*)" : "");
            btn.appendChild(label);

            if (this.openIds.length > 1) {
                const close: HTMLSpanElement = document.createElement("span");
                close.setAttribute("aria-label", "Close tab");
                close.textContent = "\u00d7";
                close.style.flexShrink = "0";
                close.style.opacity = "0.55";
                close.style.margin = "0 -0.1em 0 0";
                close.style.padding = "0.1em 0.25em";
                close.style.lineHeight = "1";
                close.style.fontSize = "1.15em";
                close.style.fontWeight = "bold";
                close.style.color = K2_TEXT;
                close.style.borderRadius = "2px";
                close.addEventListener("click", (e: MouseEvent): void => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeTab(id);
                });
                close.addEventListener("mouseenter", (): void => {
                    close.style.opacity = "1";
                    close.style.backgroundColor = "rgba(0, 0, 0, 0.08)";
                });
                close.addEventListener("mouseleave", (): void => {
                    close.style.opacity = "0.55";
                    close.style.backgroundColor = "transparent";
                });
                btn.appendChild(close);
            }

            btn.addEventListener("mouseenter", (): void => this.hover(btn));
            btn.addEventListener("mouseleave", (): void => this.hover(btn));
            btn.addEventListener("click", (e: MouseEvent): void => {
                if ((e.target as HTMLElement).closest("[aria-label='Close tab']")) {
                    return;
                }
                this.switchConversation(id);
            });

            this.el.appendChild(btn);
        }

        const last: Element | null = this.el.lastElementChild;
        if (last instanceof HTMLButtonElement) {
            last.style.borderRight = "none";
        }
    }

    private paint(el: HTMLButtonElement): void {
        const active: boolean = el.dataset.active === "true";
        const hover: boolean = el.dataset.hover === "true";
        if (hover || active) {
            el.style.backgroundColor = K2_HIGHLIGHT_HOVER;
        } else {
            el.style.backgroundColor = K2_PRIMARY;
        }
    }

    private hover(el: HTMLButtonElement): void {
        el.dataset.hover = el.dataset.hover === "true" ? "false" : "true";
        this.paint(el);
    }

    switchConversation(conversationId: string): void {
        if (!conversationId || conversationId === this.activeId) {
            return;
        }
        if (!this.openIds.includes(conversationId)) {
            this.openIds.push(conversationId);
        }
        this.activeId = conversationId;
        this.unreadIds.delete(conversationId);
        this.renderTabs();
        void this.fetchMessages(conversationId);
    }

    closeTab(conversationId: string): void {
        if (this.openIds.length <= 1) {
            return;
        }
        const idx: number = this.openIds.indexOf(conversationId);
        if (idx === -1) {
            return;
        }
        const closingCurrent: boolean = conversationId === this.activeId;
        const nextId: string | undefined = idx > 0 ? this.openIds[idx - 1] : this.openIds[idx + 1];
        this.openIds.splice(idx, 1);
        this.unreadIds.delete(conversationId);
        if (closingCurrent && nextId) {
            this.activeId = nextId;
            this.renderTabs();
            void this.fetchMessages(nextId);
        } else {
            this.renderTabs();
        }
    }

    // sketch: render into the message list once the payload shape is settled
    async fetchMessages(conversationId: string): Promise<void> {
        const res: Response = await fetch(
            `/api/conversations/${encodeURIComponent(conversationId)}/messages`
        );
        if (!res.ok) {
            return;
        }
        await res.json();
    }
}
