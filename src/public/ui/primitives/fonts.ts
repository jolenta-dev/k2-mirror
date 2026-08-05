export function loadFonts(): void {
    if (document.getElementById("k2-fonts")) {
        return;
    }

    const style: HTMLStyleElement = document.createElement("style");
    style.id = "k2-fonts";
    style.textContent = `
    @font-face {
      font-display: swap;
      font-family: "Meylda";
      font-style: normal;
      font-weight: 400;
      src: url("/multimedia/fonts/meylda/Meylda-Regular.ttf") format("truetype");
      unicode-range: U+0000-002F, U+003A-10FFFF;
    }

    @font-face {
      font-display: swap;
      font-family: "Nedar";
      font-style: normal;
      font-weight: 400;
      src: url("/multimedia/fonts/Nedar/Nedar.ttf") format("truetype");
    }
  `;
    document.head.appendChild(style);
}
