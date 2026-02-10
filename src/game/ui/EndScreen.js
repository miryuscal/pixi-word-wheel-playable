import { Container, Sprite, Text, Graphics, AnimatedSprite, Texture } from "pixi.js";
import gsap from "gsap";
import { GAME_WIDTH, GAME_HEIGHT } from "../../index";

export default class EndScreen extends Container {
  constructor({
    logoKey = "endLogo",
    onPlay = null,
  } = {}) {
    super();

    this.onPlay = onPlay;

    const overlay = new Graphics();
    overlay.beginFill(0x000000, 0.35);
    overlay.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.endFill();
    this.addChild(overlay);

    this.logo = Sprite.from(logoKey);
    this.logo.anchor.set(0.5);
    this.logo.x = GAME_WIDTH * 0.5;
    this.logo.y = GAME_HEIGHT * 0.22;
    this.logo.scale.set(0.4);
    this.addChild(this.logo);

    const frames = [];
    for (let i = 0; i <= 43; i++) {
      frames.push(Texture.from(`earth_f${String(i).padStart(2, "0")}`));
    }

    this.earth = new AnimatedSprite(frames);
    this.earth.anchor.set(0.5);
    this.earth.x = GAME_WIDTH * 0.5;
    this.earth.y = GAME_HEIGHT * 0.48;
    this.earth.scale.set(0.6);

    this.earth.animationSpeed = 0.7;
    this.earth.loop = true;
    this.earth.play();

    this.addChild(this.earth);

    gsap.to(this.earth, {
      y: this.earth.y - 10,
      duration: 1.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    this.playButton = new Container();

    const btn = Sprite.from("buttonContainer");
    btn.anchor.set(0.5);
    btn.scale.set(1.3);

    const txt = new Text("PLAY NOW!", {
      fontFamily: "Sniglet-Regular",
      fontSize: 28,
      fill: 0xffffff,
      fontWeight: "700",
      align: "center",
    });
    txt.anchor.set(0.5);

    this.playButton.addChild(btn);
    this.playButton.addChild(txt);

    this.playButton.x = GAME_WIDTH * 0.5;
    this.playButton.y = GAME_HEIGHT * 0.78;

    this.playButton.eventMode = "static";
    this.playButton.cursor = "pointer";
    this.playButton.on("pointerdown", () => {
      gsap.to(this.playButton.scale, {
        x: 1.22,
        y: 1.22,
        duration: 0.08,
        yoyo: true,
        repeat: 1,
      });
      this.onPlay?.();
    });

    this.addChild(this.playButton);

    gsap.to(this.playButton.scale, {
      x: 1.15,
      y: 1.15,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    this.visible = false;
    this.alpha = 0;
  }

  show() {
    this.visible = true;
    gsap.to(this, { alpha: 1, duration: 0.5, ease: "power1.out" });
  }

  hide() {
    gsap.to(this, {
      alpha: 0,
      duration: 0.3,
      ease: "power1.out",
      onComplete: () => (this.visible = false),
    });
  }
}
