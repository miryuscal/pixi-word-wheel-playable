import gsap from "gsap";

export default class WrongWordAnimator {
  constructor() {}

  /**
   * @param {Object} args
   * @param {Array} args.letterItems 
   * @param {number} args.holdDuration 
   */
  playWrong({ letterItems, holdDuration = 1.0 } = {}) {
    const items = letterItems || [];
    const shakes = [];

    for (const item of items) 
    {
      const baseX = item.x;
      const t = gsap.to(item, {
        x: baseX + 6,
        duration: 0.06,
        yoyo: true,
        repeat: Math.floor(holdDuration / 0.06),
        ease: "power0.none",
        onComplete: () => {
          item.x = baseX;
        },
      });
      shakes.push(t);
    }

    return new Promise((resolve) => {
      gsap.delayedCall(holdDuration, () => {
        shakes.forEach((t) => t.kill());
        resolve();
      });
    });
  }
}
