import { Container, Graphics, Text } from "pixi.js";

export default class HintBanner extends Container {
  constructor({
    fontFamily = "Sniglet-Regular",
    fontSize = 22,
    padX = 18,
    padY = 10,
    radius = 10,
  } = {}) {
    super();

    this._padX = padX;
    this._padY = padY;
    this._radius = radius;

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.text = new Text("", {
      fontFamily,
      fontSize,
      fill: 0xffffff,
      fontWeight: "800",
      align: "center",
    });
    this.text.anchor?.set?.(0.5);
    this.text.x = 0;
    this.text.y = 0;
    this.addChild(this.text);

    this.visible = false;
  }

  showForWord(word) {
    const W = (word || "").toString().toUpperCase();
    this.text.text = `Connect the letters ${W}`;

    const w = this.text.width + this._padX * 2;
    const h = this.text.height + this._padY * 2;

    this.bg.clear();
    this.bg.beginFill(0x2fbf2f, 1);
    this.bg.drawRoundedRect(-w / 2, -h / 2, w, h, this._radius);
    this.bg.endFill();

    this.visible = true;
  }

  hide() {
    this.visible = false;
    this.text.text = "";
    this.bg.clear();
  }
}
