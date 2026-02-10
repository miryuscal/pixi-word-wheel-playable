import { Container, Graphics, Text, Rectangle } from "pixi.js";

export default class LetterItem extends Container {
  constructor(char, { fontFamily = "Sniglet-Regular" } = {}) {
    super();

    this.char = char;
    this.isSelected = false;

    this.badge = new Graphics();
    this.addChild(this.badge);

    this.label = new Text(char, {
      fontFamily,
      fontSize: 40,
      fill: 0xff8a00,
      fontWeight: "800",
      align: "center",
    });
    this.label.anchor?.set?.(0.5);
    this.addChild(this.label);

    this.hitArea = new Rectangle(-45, -45, 90, 90);

    this.eventMode = "static";
    this.cursor = "pointer";

    this.redraw();
  }

  setSelected(selected) {
    this.isSelected = selected;
    this.redraw();
  }

  redraw() {
    this.badge.clear();

    if (this.isSelected) {
      this.badge.beginFill(0xff8a00, 1);
      this.badge.drawCircle(0, 0, 24);
      this.badge.endFill();
      this.label.style.fill = 0xffffff;
    } else {
      this.label.style.fill = 0xff8a00;
    }
  }
}
