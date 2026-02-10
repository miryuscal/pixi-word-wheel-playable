import * as PIXI from "pixi.js";
import { Application } from "pixi.js";
import { initAssets } from "./assets";
import { gsap } from "gsap";
import { CustomEase, PixiPlugin } from "gsap/all";
import Game from "./game";

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 800;

export const app = new Application({
  backgroundColor: 0x000000,
  antialias: true,
  hello: true,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
});

app.ticker.stop();

let game = null;

gsap.ticker.add((time, deltaTime) => {
  app.ticker.update();

  const dtSeconds = (deltaTime || 16.6667) / 1000;
  game?.update?.(dtSeconds);
});

async function init() {
  document.body.appendChild(app.view);

  const assets = await initAssets();
  console.log("assets", assets);

  gsap.registerPlugin(PixiPlugin, CustomEase);
  PixiPlugin.registerPIXI(PIXI);

  game = new Game();
  app.stage.addChild(game);
}

init();
