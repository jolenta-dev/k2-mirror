import { Component } from "./component.js";
import { K2_SERIF } from "../theme.js";

export class PageTitle extends Component<HTMLDivElement> {
    constructor(content: string) {
        const titleWrapper: HTMLDivElement = document.createElement("div");
        const title: HTMLHeadingElement = document.createElement("h1");
        titleWrapper.appendChild(title);
        title.innerHTML = "<h2><b>" + content + "</b></h2>";
        titleWrapper.style.display = "flex";
        titleWrapper.style.fontFamily = K2_SERIF;
        titleWrapper.style.justifyContent = "center";

        super(titleWrapper);
        this.mount();
    }
}
