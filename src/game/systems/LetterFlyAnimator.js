import gsap from "gsap";
import { Text } from "pixi.js";

export default class LetterFlyAnimator {
    constructor({ rootLayer } = {}) {
    this.rootLayer = rootLayer;
  }

  #getGlobalPos(displayObj) 
  {
    if (displayObj?.getGlobalPosition) return displayObj.getGlobalPosition();

    const parent = displayObj?.parent;
    if (!parent || !this.rootLayer) return null;

    const p = parent.toGlobal({ x: displayObj.x, y: displayObj.y });
    return p;
  }

  #getTargetGlobal(cell) 
  {
    if (cell?.getWorldCenter) return cell.getWorldCenter();

    if (cell?.getGlobalPosition) return cell.getGlobalPosition();

    if (cell?.bg?.getGlobalPosition) {
      const p = cell.bg.getGlobalPosition();
      return { x: p.x + (cell.bg.width ?? 0) / 2, y: p.y + (cell.bg.height ?? 0) / 2 };
    }

    return null;
  }

  flyToCells({
    letters,
    letterItems,
    targetCells,
    fadeOriginal = true,
    duration = 0.9,       
    ease = "sine.out",    
  }) {
    if (!this.rootLayer) return Promise.resolve();
    if (!letters?.length || !targetCells?.length) return Promise.resolve();

    const jobs = [];

    for (let i = 0; i < letters.length; i++) {
      const ch = letters[i];
      const item = letterItems?.[i];
      const cell = targetCells?.[i];
      if (!item || !cell) continue;

      const startGlobal = this.#getGlobalPos(item);
      if (!startGlobal) continue;

      const targetGlobal = this.#getTargetGlobal(cell);
      if (!targetGlobal) continue;

      const startLocal = this.rootLayer.toLocal(startGlobal);
      const targetLocal = this.rootLayer.toLocal(targetGlobal);

      const flying = new Text(ch, {
        fontFamily: "Arial",
        fontSize: 28,
        fill: 0xffffff,
        fontWeight: "700",
      });
      flying.anchor?.set?.(0.5);
      flying.x = startLocal.x;
      flying.y = startLocal.y;
      flying.alpha = 1;

      this.rootLayer.addChild(flying);

      if (fadeOriginal) {
        gsap.to(item, { alpha: 0, duration: 0.12, ease: "power1.out" });
      }

      jobs.push(
        new Promise((resolve) => {
          gsap.to(flying, {
            x: targetLocal.x,
            y: targetLocal.y,
            duration,
            ease,
            onComplete: () => {
              flying.destroy();
              resolve();
            },
          });
        })
      );
    }

    return Promise.all(jobs);
  }

  fadeOutItems(letterItems, duration = 0.15) {
    if (!letterItems?.length) return Promise.resolve();
    const jobs = letterItems.map(
      (it) =>
        new Promise((resolve) => {
          gsap.to(it, {
            alpha: 0,
            duration,
            ease: "power1.out",
            onComplete: resolve,
          });
        })
    );
    return Promise.all(jobs);
  }
}
