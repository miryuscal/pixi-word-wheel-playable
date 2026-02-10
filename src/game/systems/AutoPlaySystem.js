import gsap from "gsap";
import { Sprite } from "pixi.js";
import HintBanner from "../ui/HintBanner";

export default class AutoPlaySystem {
  constructor({
    rootLayer,
    wheel,
    wordSystem,
    idleSeconds = 5,
    loopsBeforeClick = 3,
    moveDuration = 0.35,
    stepDelay = 0.08,
    clickScale = 0.92,
    clickDuration = 0.08,
    flySlowDuration = 0.9, 
    loopPauseSeconds = 1.0, 
    handTextureKey = "hand",
  } = {}) {
    this.rootLayer = rootLayer;
    this.wheel = wheel;
    this.wordSystem = wordSystem;

    this.idleSeconds = idleSeconds;
    this.loopsBeforeClick = loopsBeforeClick;
    this.moveDuration = moveDuration;
    this.stepDelay = stepDelay;
    this.clickScale = clickScale;
    this.clickDuration = clickDuration;
    this.handTextureKey = handTextureKey;

    this.loopPauseSeconds = loopPauseSeconds;

    this._idleTimer = 0;
    this._isRunning = false;
    this._cancelToken = 0;
    this._activeTweens = [];

    this.banner = new HintBanner();
    this.rootLayer.addChild(this.banner);

    this.hand = Sprite.from(this.handTextureKey);
    this.hand.anchor.set(0.25, 0.05); 
    this.hand.scale.set(0.28);
    this.hand.visible = false;
    this.rootLayer.addChild(this.hand);

    this._layout();
  }

  _layout() {

    this.banner.x = this.wheel.x;
    this.banner.y = this.wheel.y - (this.wheel.radius ?? 78) - 110;
  }

  update(dtSeconds) {
    if (this._isRunning) return;

    this._idleTimer += dtSeconds;
    if (this._idleTimer >= this.idleSeconds) {
      this._idleTimer = 0;
      this.start();
    }
  }


  notifyUserInput() {
    this._idleTimer = 0;
    if (this._isRunning) this.stop();
  }

  start() {
    if (this._isRunning) return;

    const word = this.wordSystem?.getNextUnsolvedWord?.();
    if (!word) return;

    const indices = this.wheel?.getIndicesForWord?.(word);
    if (!indices || indices.length === 0) return;

    this._isRunning = true;
    this._cancelToken++;
    const token = this._cancelToken;

    this._layout();
    this.banner.showForWord(word);
    this.hand.visible = true;

    this._runDemo(word, indices, token).finally(() => {
      if (this._cancelToken === token) {
        this._cleanupVisuals();
        this._isRunning = false;
        this._idleTimer = 0;
      }
    });
  }

  stop() {
    this._cancelToken++;

    for (const t of this._activeTweens) {
      try {
        t.kill?.();
      } catch {}
    }
    this._activeTweens = [];

    this.wheel?.clearSelection?.(true);
    this._cleanupVisuals();

    this._isRunning = false;
  }

  _cleanupVisuals() {
    this.banner.hide();
    this.hand.visible = false;
    this.hand.scale.set(0.28);
  }

  async _runDemo(word, indices, token) {
    for (let loop = 1; loop <= this.loopsBeforeClick; loop++) {
      if (this._cancelToken !== token) return;

      const willClick = loop === this.loopsBeforeClick;

      if (willClick) {
        this.wheel?.clearSelection?.(true);
      }

      for (let i = 0; i < indices.length; i++) {
        if (this._cancelToken !== token) return;

        const idx = indices[i];

        await this._moveHandToLetterIndex(idx, token);
        if (this._cancelToken !== token) return;

        if (willClick) {
          await this._tap(token);
          this.wheel?.selectIndex?.(idx);
          await this._delay(this.stepDelay, token);
        } else {
          await this._delay(this.stepDelay, token);
        }
      }

      await this._delay(0.25 + this.loopPauseSeconds, token);
    }

    if (this._cancelToken !== token) return;

    this.wheel?.submitCurrentSelection?.();

    await this._delay(1.1, token);
  }

  async _moveHandToLetterIndex(index, token) {
    const pos = this.wheel?.getLetterGlobalPosition?.(index);
    if (!pos) return;

    const local = this.rootLayer.toLocal(pos);

    return new Promise((resolve) => {
      if (this._cancelToken !== token) return resolve();

      const t = gsap.to(this.hand, {
        x: local.x,
        y: local.y,
        duration: this.moveDuration,
        ease: "sine.out",
        onComplete: resolve,
      });

      this._activeTweens.push(t);
    });
  }

  async _tap(token) {
    return new Promise((resolve) => {
      if (this._cancelToken !== token) return resolve();

      const base = this.hand.scale.x;

      const t1 = gsap.to(this.hand.scale, {
        x: base * this.clickScale,
        y: base * this.clickScale,
        duration: this.clickDuration,
        ease: "power1.out",
        yoyo: true,
        repeat: 1,
        onComplete: resolve,
      });

      this._activeTweens.push(t1);
    });
  }

  async _delay(seconds, token) {
    return new Promise((resolve) => {
      if (this._cancelToken !== token) return resolve();

      const t = gsap.delayedCall(seconds, () => resolve());
      this._activeTweens.push(t);
    });
  }
}
