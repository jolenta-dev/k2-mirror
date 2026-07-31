import { Component } from "../primitives/component.js";
import { K2_SECONDARY } from "../theme.js";

export class MemberList extends Component {
    memberListUl: HTMLUListElement;

    constructor() {
        const listWrapper: HTMLDivElement = document.createElement("div");
        super(listWrapper);
        listWrapper.style.flex = "0 0 auto";
        listWrapper.style.width = "max-content";
        listWrapper.style.overflow = "wrap";
        listWrapper.style.maxWidth = "30vw";
        listWrapper.style.maxHeight = "80vh";
        listWrapper.style.border = `1px solid ${K2_SECONDARY}`;
        listWrapper.style.background = "rgba(0, 0, 0, 0.8)";
        listWrapper.style.padding = "8px 10px";

        const memberListHeading: HTMLHeadingElement = document.createElement("h3");
        memberListHeading.textContent = "Members";
        listWrapper.appendChild(memberListHeading);

        const memberListUl: HTMLUListElement = document.createElement("ul");
        this.memberListUl = memberListUl;
        memberListUl.style.listStyle = "none";
        memberListUl.style.margin = "0";
        memberListUl.style.padding = "0";
        memberListUl.style.fontSize = "0.9rem";
        memberListUl.style.width = "max-content";
        memberListUl.style.maxWidth = "100%";

        listWrapper.appendChild(memberListUl);
    }

    public addMember(innerHTML: string): void {
        const newEl: HTMLLIElement = document.createElement("li");
        newEl.style.borderBottomColor = "#5a5a5a";
        newEl.style.lineHeight = "1.5";
        newEl.style.padding = "3px 0";
        newEl.style.borderBottom = "1px solid #eee";
        newEl.innerHTML = innerHTML;

        this.memberListUl.appendChild(newEl);
    }
}
