import gsap from "gsap";
import { Container, Graphics, Text } from "pixi.js";

export default class CurrentWordDisplay extends Container {
  constructor({
    fontFamily = "Sniglet-Regular",
    fontSize = 28,
    fill = 0xffffff,
    fontWeight = "800",
    padX = 22,
    padY = 12,
    radius = 14,
    letterSpacing = 2, 
  } = {}) {
    super();

    this._opts = {
      fontFamily,
      fontSize,
      fill,
      fontWeight,
      padX,
      padY,
      radius,
      letterSpacing,
    };

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.lettersLayer = new Container();
    this.addChild(this.lettersLayer);

    this.letterNodes = [];

    this.visible = false;

    this._shakeTween = null;
  }

  setWord(word) 
  {
    const text = (word || "").toString().toUpperCase().trim();

    if (!text) {
      this.clear();
      return;
    }

    this.visible = true;

    this.#clearLettersOnly();

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      const t = new Text(ch, {
        fontFamily: this._opts.fontFamily,
        fontSize: this._opts.fontSize,
        fill: this._opts.fill,
        fontWeight: this._opts.fontWeight,
        align: "center",
      });
      t.anchor?.set?.(0.5);
      this.lettersLayer.addChild(t);
      this.letterNodes.push(t);
    }

    this.#layoutLetters();

    this.#redrawBackground();
  }

  getLetterNodes() {
    return this.letterNodes;
  }

  playShake(duration = 1.0) 
  { 
    if (this._shakeTween) {
      this._shakeTween.kill();
      this._shakeTween = null;
    }

    const baseX = this.x;

    return new Promise((resolve) => {
      this._shakeTween = gsap.to(this, {
        x: baseX + 10,
        duration: 0.06,
        yoyo: true,
        repeat: Math.floor(duration / 0.06),
        ease: "power0.none",
        onComplete: () => {
          this.x = baseX;
          this._shakeTween = null;
          resolve();
        },
      });
    });
  }

  hideLetters() {
    for (const n of this.letterNodes) n.alpha = 0;
  }


  showLetters() {
    for (const n of this.letterNodes) n.alpha = 1;
  }

  clear() 
  {
    this.visible = false;
    this.#clearLettersOnly();
    this.bg.clear();
  }

  #clearLettersOnly() {
    for (const n of this.letterNodes) {
      n.destroy();
    }
    this.letterNodes = [];
    this.lettersLayer.removeChildren();
  }

  #layoutLetters() 
  {
    const spacing = this._opts.letterSpacing;

    const widths = this.letterNodes.map((n) => Math.max(1, n.width));
    const totalW =
      widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, widths.length - 1);

    let cursorX = -totalW / 2;

    for (let i = 0; i < this.letterNodes.length; i++) {
      const n = this.letterNodes[i];
      const w = widths[i];

      n.x = cursorX + w / 2;
      n.y = 0;

      cursorX += w + spacing;
    }
  }

  #redrawBackground() {
    const padX = this._opts.padX;
    const padY = this._opts.padY;
    const r = this._opts.radius;

    const b = this.lettersLayer.getLocalBounds();

    const w = b.width + padX * 2;
    const h = b.height + padY * 2;

    this.bg.clear();
    this.bg.beginFill(0xff8a00, 1);
    this.bg.drawRoundedRect(-w / 2, -h / 2, w, h, r);
    this.bg.endFill();
  }
}
