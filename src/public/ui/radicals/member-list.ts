import { Component } from "../primitives/component.js";
import { K2_SECONDARY, K2_TEXT } from "../theme.js";

type NameEntry = {
    user_id: number;
    name: string;
    decoration: string | null;
    color: string | null;
    tag: string | null;
    tag_style: string | null;
};

export class MemberList extends Component {
    memberListUl: HTMLUListElement;

    constructor() {
        const listWrapper: HTMLDivElement = document.createElement("div");
        super(listWrapper);
        listWrapper.style.flex = "0 0 auto";
        listWrapper.style.width = "max-content";
        listWrapper.style.overflow = "wrap";
        listWrapper.style.minWidth = "30vw";
        listWrapper.style.maxHeight = "80vh";
        listWrapper.style.border = `1px solid ${K2_SECONDARY}`;
        listWrapper.style.background = "rgba(255, 255, 255, 0.2)";
        listWrapper.style.padding = "8px 10px";

        const memberListHeading: HTMLHeadingElement = document.createElement("h3");
        memberListHeading.textContent = "Members";
        memberListHeading.style.color = K2_TEXT;
        listWrapper.appendChild(memberListHeading);

        const memberListUl: HTMLUListElement = document.createElement("ul");
        this.memberListUl = memberListUl;
        memberListUl.style.listStyle = "none";
        memberListUl.style.margin = "0";
        memberListUl.style.padding = "0";
        memberListUl.style.fontSize = "0.9rem";
        memberListUl.style.width = "100%";
        memberListUl.style.boxSizing = "border-box";

        listWrapper.appendChild(memberListUl);

        void this.fetchMembers();
    }

    private async fetchMembers(): Promise<void> {
        const res = await fetch("/api/names");
        if (!res.ok) return;
        const names = (await res.json()) as NameEntry[];
        for (const entry of names) {
            this.addMember(this.formatMember(entry));
        }
    }

    private formatMember(entry: NameEntry): string {
        const color = entry.color ?? K2_TEXT;
        const decoration = entry.decoration ? `${escapeHtml(entry.decoration)} ` : "";
        const tag = entry.tag
            ? ` <span style="${escapeHtml(entry.tag_style ?? "")}">${escapeHtml(entry.tag)}</span>`
            : "";
        return `${tag}${decoration}<span style="color: ${escapeHtml(color)}">${escapeHtml(entry.name)}</span>`;
    }

    public addMember(innerHTML: string): void {
        const newEl: HTMLLIElement = document.createElement("li");
        newEl.style.borderBottomColor = "#5a5a5a";
        newEl.style.lineHeight = "1.5";
        newEl.style.padding = "3px 0";
        newEl.style.borderBottom = "1px solid #eee";
        newEl.style.width = "100%";
        newEl.style.boxSizing = "border-box";
        newEl.innerHTML = innerHTML;

        this.memberListUl.appendChild(newEl);
    }
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
