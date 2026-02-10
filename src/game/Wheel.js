import { Container, Sprite, Graphics } from "pixi.js";
import gsap from "gsap";
import LetterItem from "./LetterItem";
import CurrentWordDisplay from "./CurrentWordDisplay";

export default class Wheel extends Container {
  constructor({
    circleTextureKey = "mainCircle",
    shuffleTextureKey = "shuffle",
    radius = 78,
  } = {}) {
    super();

    this.radius = radius;

    this.letterItems = [];
    this.selectedIndices = [];
    this.isDragging = false;
    this.pointerGlobal = { x: 0, y: 0 };

    this.usedCounts = {};
    this.letterLimits = {};

    this.onSubmit = null;

    this.circleContainer = new Container();
    this.circleContainer.alpha = 0.5;
    this.addChild(this.circleContainer);

    this.circle = Sprite.from(circleTextureKey);
    this.circle.anchor.set(0.5);
    this.circle.scale.set(0.04);
    this.circleContainer.addChild(this.circle);

    this.lineLayer = new Graphics();
    this.addChild(this.lineLayer);

    this.lettersContainer = new Container();
    this.addChild(this.lettersContainer);

    this.wordDisplay = new CurrentWordDisplay();
    this.wordDisplay.y = -this.radius - 60;
    this.wordDisplay.scale.set(0.7);
    this.wordDisplay.y -= 5;
    this.addChild(this.wordDisplay);

    this.slots = this.createSlots(4);

    this.shuffleButton = this.createShuffleButton(shuffleTextureKey);
    this.addChild(this.shuffleButton);
  }

  createSlots(count) {
    const r = this.radius;
    const startAngle = -Math.PI / 2;

    const slots = [];
    for (let i = 0; i < count; i++) {
      const a = startAngle + (i * (Math.PI * 2)) / count;
      slots.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
      });
    }
    return slots;
  }

  createShuffleButton(textureKey) {
    const c = new Container();

    const icon = Sprite.from(textureKey);
    icon.anchor.set(0.5);
    icon.scale.set(0.12);
    c.addChild(icon);

    c.eventMode = "static";
    c.cursor = "pointer";
    c.on("pointerdown", () => {
      gsap.to(c.scale, { x: 0.92, y: 0.92, duration: 0.08, yoyo: true, repeat: 1 });
      this.shuffle();
    });

    return c;
  }

  setLetters(letters, letterLimits = null) {
    this.clearSelection(true);
    this.lettersContainer.removeChildren();
    this.letterItems = [];

    this.letters = letters.map((l) => String(l).toUpperCase());
    this.letterLimits = letterLimits || {};

    this.slots = this.createSlots(this.letters.length);

    for (let i = 0; i < this.letters.length; i++) {
      const item = new LetterItem(this.letters[i]);
      item.x = this.slots[i].x;
      item.y = this.slots[i].y;
      item.slotIndex = i;

      item.on("pointerdown", (e) => this.startDrag(i, e));

      this.lettersContainer.addChild(item);
      this.letterItems.push(item);
    }
  }

  startDrag(index, e) {
    this.isDragging = true;
    this.selectedIndices = [];
    this.usedCounts = {};

    this.addToSelection(index);

    const global = e.global;
    this.pointerGlobal.x = global.x;
    this.pointerGlobal.y = global.y;

    this.eventMode = "static";
    this.on("pointermove", this.onDragMove, this);

    this.on("pointerup", this.finishDragAndSubmit, this);
    this.on("pointerupoutside", this.finishDragAndSubmit, this);

    this.redrawLine();
  }

  onDragMove(e) {
    if (!this.isDragging) return;

    this.pointerGlobal.x = e.global.x;
    this.pointerGlobal.y = e.global.y;

    const hitIndex = this.hitTestLetter(this.pointerGlobal.x, this.pointerGlobal.y);
    if (hitIndex !== -1) this.addToSelection(hitIndex);

    this.redrawLine();
  }

  hitTestLetter(globalX, globalY) {
    for (let i = 0; i < this.letterItems.length; i++) {
      const b = this.letterItems[i].getBounds();
      if (b.contains(globalX, globalY)) return i;
    }
    return -1;
  }

  addToSelection(index) {
    const item = this.letterItems[index];
    if (!item) return;

    const letter = String(item.char).toUpperCase();

    const limit = this.letterLimits[letter] ?? 1;
    const used = this.usedCounts[letter] ?? 0;

    if (used >= limit) return;

    if (limit === 1 && this.selectedIndices.includes(index)) return;

    const last = this.selectedIndices[this.selectedIndices.length - 1];
    if (last === index) return;

    this.selectedIndices.push(index);
    this.usedCounts[letter] = used + 1;

    item.setSelected(true);

    this.wordDisplay.setWord(this.getSelectedWord());
  }

  redrawLine() {
    this.lineLayer.clear();

    if (!this.isDragging || this.selectedIndices.length === 0) return;

    this.lineLayer.lineStyle({
      width: 10,
      color: 0xff8a00,
      alpha: 1,
      alignment: 0.5,
      cap: "round",
      join: "round",
    });

    const pts = this.selectedIndices.map((idx) => {
      const item = this.letterItems[idx];
      return { x: item.x, y: item.y };
    });

    this.lineLayer.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      this.lineLayer.lineTo(pts[i].x, pts[i].y);
    }

    const last = pts[pts.length - 1];
    const localPointer = this.toLocal(this.pointerGlobal);
    this.lineLayer.moveTo(last.x, last.y);
    this.lineLayer.lineTo(localPointer.x, localPointer.y);
  }

  finishDragAndSubmit() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.off("pointermove", this.onDragMove, this);
    this.off("pointerup", this.finishDragAndSubmit, this);
    this.off("pointerupoutside", this.finishDragAndSubmit, this);
    this.submitCurrentSelection();
  }

  getSelectedWord() {
    return this.selectedIndices.map((i) => this.letterItems[i].char).join("");
  }

  getSelectedLetterItems() {
    return this.selectedIndices.map((i) => this.letterItems[i]);
  }

  clearSelection(resetWordDisplay = true) {
    const unique = Array.from(new Set(this.selectedIndices));
    for (const idx of unique) {
      this.letterItems[idx]?.setSelected(false);
      if (this.letterItems[idx]) this.letterItems[idx].alpha = 1;
    }

    this.selectedIndices = [];
    this.usedCounts = {};

    this.lineLayer.clear();
    if (resetWordDisplay) this.wordDisplay.clear();

    this.isDragging = false;
    this.off("pointermove", this.onDragMove, this);
    this.off("pointerup", this.finishDragAndSubmit, this);
    this.off("pointerupoutside", this.finishDragAndSubmit, this);
  }

  shuffle() {
    this.clearSelection(true);

    const indices = Array.from({ length: this.letterItems.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    for (let i = 0; i < this.letterItems.length; i++) {
      const item = this.letterItems[i];
      const newSlot = indices[i];
      item.slotIndex = newSlot;

      const target = this.slots[newSlot];
      gsap.to(item, { x: target.x, y: target.y, duration: 0.35, ease: "power2.out" });
    }
  }

  selectIndex(index) {
    this.addToSelection(index);
  }


  submitCurrentSelection() {
    const word = this.getSelectedWord();
    const displayNodes = this.wordDisplay.getLetterNodes?.() ?? []; // CurrentWordDisplay güncel olmalı
    this.onSubmit?.(word, displayNodes, this.lineLayer);
  }


  getLetterGlobalPosition(index) {
    const item = this.letterItems?.[index];
    if (!item) return null;
    return item.getGlobalPosition?.() ?? null;
  }


  getIndicesForWord(word) {
    const W = (word || "").toString().toUpperCase().trim();
    if (!W) return [];

    const buckets = new Map();
    for (let i = 0; i < this.letterItems.length; i++) {
      const ch = String(this.letterItems[i].char).toUpperCase();
      if (!buckets.has(ch)) buckets.set(ch, []);
      buckets.get(ch).push(i);
    }

    const usedByChar = {};
    const chosen = [];

    for (const ch of W) {
      const arr = buckets.get(ch) || [];
      if (arr.length === 0) return [];

      const used = usedByChar[ch] ?? 0;
      const idx = arr[Math.min(used, arr.length - 1)];
      chosen.push(idx);

      usedByChar[ch] = used + 1;
    }

    return chosen;
  }
}
