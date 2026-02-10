import gsap from "gsap";
import { Container, Sprite, Text, Rectangle } from "pixi.js";
import { GAME_HEIGHT, GAME_WIDTH } from ".";
import Wheel from "./game/Wheel";
import { LEVELS } from "./data/wordsets";
import { parseLevel } from "./data/levelParser";
import Grid from "./game/Grid";
import WordSystem from "./game/systems/WordSystem";
import LetterFlyAnimator from "./game/systems/LetterFlyAnimator";
import WrongWordAnimator from "./game/systems/WrongWordAnimator";
import { normalizeWordDefs } from "./game/utils/wordDefs";
import AutoPlaySystem from "./game/systems/AutoPlaySystem";
import EndScreen from "./game/ui/EndScreen";

function buildLetterLimitsFromWords(words) {
  const limits = {};

  for (const w of words) {
    const text = (w.word ?? w.text ?? "").toString().toUpperCase();
    const counts = {};

    for (const ch of text) counts[ch] = (counts[ch] || 0) + 1;

    for (const ch in counts) {
      limits[ch] = Math.max(limits[ch] || 1, counts[ch]);
    }
  }

  return limits;
}

export default class Game extends Container {
  constructor() {
    super();

    this.autoPlay = null;

    this.grid = null;
    this.wheel = null;
    this.wordSystem = null;

    this.bg = null;
    this.playButton = null;
    this.endScreen = null;

    this.init();
  }

  fitToRect(displayObj, rect, padding = 0) {
    const b = displayObj.getLocalBounds();

    displayObj.pivot.set(b.x + b.width / 2, b.y + b.height / 2);

    const availW = Math.max(1, rect.w - padding * 2);
    const availH = Math.max(1, rect.h - padding * 2);

    const bw = Math.max(1, b.width);
    const bh = Math.max(1, b.height);

    const s = Math.min(availW / bw, availH / bh);
    displayObj.scale.set(s);

    displayObj.x = rect.x + rect.w / 2;
    displayObj.y = rect.y + rect.h / 2;
  }

  update(dtSeconds) {
    this.autoPlay?.update(dtSeconds);
  }

  bindGlobalInput() {
    this.eventMode = "static";
    this.hitArea = new Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const onAnyInput = () => {
      this.autoPlay?.notifyUserInput();
    };

    this.on("pointerdown", onAnyInput);
    this.on("pointermove", onAnyInput);
    this.on("pointerup", onAnyInput);
    this.on("pointerupoutside", onAnyInput);
  }

  showEndScreen() {
    this.autoPlay?.notifyUserInput?.();

    const toHide = [this.grid, this.wheel, this.playButton].filter(Boolean);

    gsap.to(toHide, {
      alpha: 0,
      duration: 0.35,
      ease: "power1.out",
      onComplete: () => {
        for (const o of toHide) {
          if (!o) continue;
          o.visible = false;
        }

        if (this.endScreen) {
          this.endScreen.visible = true;
          this.endScreen.alpha = 0;
          this.addChild(this.endScreen); 
          this.endScreen.show();
        }
      },
    });
  }

  init() {
    const bg = Sprite.from("backGround");
    bg.anchor.set(0);
    bg.x = 0;
    bg.y = 0;
    bg.width = GAME_WIDTH;
    bg.height = GAME_HEIGHT;
    bg.alpha = 0;
    this.addChild(bg);
    this.bg = bg;

    const logo = Sprite.from("logo");
    logo.anchor.set(0.5);
    logo.x = GAME_WIDTH * 0.5;
    logo.y = GAME_HEIGHT * 0.5;
    logo.scale.set(0.5);
    this.addChild(logo);

    const activeLevel = parseLevel(LEVELS[0]);

    const grid = new Grid({
      cellTextureKey: "rect",
      cellSize: 78,
      gap: 10,
      debug: false,
    });

    grid.buildFromWords(activeLevel.words);
    this.addChild(grid);

    const gridRect = {
      x: 0,
      y: 80,
      w: GAME_WIDTH,
      h: GAME_HEIGHT * 0.32,
    };
    this.fitToRect(grid, gridRect, 20);
    grid.alpha = 0;
    this.grid = grid;

    const wheel = new Wheel({
      circleTextureKey: "mainCircle",
      shuffleTextureKey: "shuffle",
      radius: 78,
    });

    wheel.x = GAME_WIDTH * 0.5;
    wheel.y = GAME_HEIGHT * 0.72;
    wheel.alpha = 0;
    this.addChild(wheel);

    const letterLimits = buildLetterLimitsFromWords(activeLevel.words);
    wheel.setLetters(activeLevel.letters, letterLimits);

    this.wheel = wheel;

    const wordDefs = normalizeWordDefs(activeLevel.words);

    const flyAnimator = new LetterFlyAnimator({ rootLayer: this });
    const wrongAnimator = new WrongWordAnimator();

    const wordSystem = new WordSystem({
      grid,
      wheel,
      wordDefs,
      flyAnimator,
      wrongAnimator,
    });

    this.wordSystem = wordSystem;

    wordSystem.onLevelComplete = () => {
      this.showEndScreen();
    };

    wheel.onSubmit = (word, displayNodes, selectionLine) => {
      wordSystem.submitWord(word, displayNodes, selectionLine);
    };

    this.autoPlay = new AutoPlaySystem({
      rootLayer: this,
      wheel,
      wordSystem,
      idleSeconds: 6,
      loopsBeforeClick: 3,
      moveDuration: 0.7,
      stepDelay: 0.16,
      loopPauseSeconds: 0.5,
      handTextureKey: "hand",
    });

    this.bindGlobalInput();

    const playButton = new Container();

    const button = Sprite.from("buttonContainer");
    button.anchor.set(0.5);
    button.scale.set(1.3);

    const buttonText = new Text("PLAY NOW!", {
      fontFamily: "Sniglet-Regular",
      fontSize: 28,
      fill: 0xffffff,
      fontWeight: "700",
      align: "center",
    });
    buttonText.anchor?.set?.(0.5);

    playButton.addChild(button);
    playButton.addChild(buttonText);

    playButton.x = GAME_WIDTH * 0.5;
    const bottomPadding = 35;
    playButton.y = GAME_HEIGHT - bottomPadding - button.height * 0.5;
    playButton.alpha = 0;
    this.addChild(playButton);

    this.playButton = playButton;

    const endScreen = new EndScreen({
      logoKey: "endLogo",
      earthKey: "earth", 
      onPlay: () => {
        window.location.reload();
      },
    });
    endScreen.visible = false;
    endScreen.alpha = 0;
    this.addChild(endScreen);
    this.endScreen = endScreen;

    const pulseTween = gsap.to(logo, {
      pixi: { scale: 0.6 },
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap
      .timeline()
      .to({}, { duration: 2 })
      .add(() => {
        pulseTween.kill();
      })
      .to(logo, {
        alpha: 0,
        duration: 0.5,
        ease: "power1.out",
      })
      .add(() => {
        this.removeChild(logo);
        logo.destroy();
      })
      .to(bg, {
        alpha: 1,
        duration: 0.6,
        ease: "power1.out",
      })
      .to(
        wheel,
        {
          alpha: 1,
          duration: 1,
          ease: "power1.out",
        },
        "<"
      )
      .to(
        playButton,
        {
          alpha: 1,
          duration: 1,
          ease: "power1.out",
        },
        "<"
      )
      .to(
        grid,
        {
          alpha: 1,
          duration: 1,
          ease: "power1.out",
        },
        "<"
      );

    gsap.to(playButton.scale, {
      x: 1.15,
      y: 1.15,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }
}
