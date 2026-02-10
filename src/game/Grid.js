import { Container, Sprite, Text } from "pixi.js";

export default class Grid extends Container {
  constructor({
    cellTextureKey = "rect",
    cellSize = 80,
    gap = 10,
    debug = false,
  } = {}) {
    super();
    this.cellTextureKey = cellTextureKey;
    this.cellSize = cellSize;
    this.gap = gap;
    this.debug = debug;

    this.cells = new Map();

    this._offsetX = 0;
    this._offsetY = 0;
  }

  #normalizeDir(d) 
  {
    const dir = String(d || "").toUpperCase().trim();
    if (dir === "H" || dir === "V") return dir;
    if (dir.startsWith("H")) return "H";
    if (dir.startsWith("V")) return "V";
    return "H";
  }

  #toWordText(w) {
    const t = (w.text ?? w.word ?? w.value ?? w.name ?? w.letters ?? "").toString();
    return t.trim().toUpperCase();
  }

  #toInt(n) {
    const v = Number.parseInt(n, 10);
    return Number.isFinite(v) ? v : NaN;
  }

  #key(gx, gy) {
    return `${gx},${gy}`;
  }

  #gridToLocal(gx, gy) {
    const cellStep = (this.cellSize ?? 78) + (this.gap ?? 10);
    const nx = gx - this._offsetX;
    const ny = gy - this._offsetY;
    return {
      x: nx * cellStep,
      y: ny * cellStep,
    };
  }

  #createCell({ gx, gy, expectedLetter }) {
    const pos = this.#gridToLocal(gx, gy);

    const bg = Sprite.from(this.cellTextureKey);
    bg.width = this.cellSize;
    bg.height = this.cellSize;
    bg.x = pos.x;
    bg.y = pos.y;

    const letterText = new Text("", {
      fontFamily: "Arial",
      fontSize: 28,
      fill: 0xffffff,
      fontWeight: "700",
    });
    letterText.anchor?.set?.(0.5);
    letterText.x = bg.x + this.cellSize / 2;
    letterText.y = bg.y + this.cellSize / 2;
    letterText.alpha = 0;

    const cell = {
      gx,
      gy,
      bg,
      letterText,
      locked: false,
      value: "",

      expectedLetter: expectedLetter ?? "",

      lockWithLetter: (ch) => {
        cell.locked = true;
        cell.value = String(ch || "").toUpperCase();
        cell.letterText.text = cell.value;
      },

      setSolvedStyle: () => {
        cell.bg.tint = 0xF39A2E;
        if (cell.letterText?.style) cell.letterText.style.fill = 0xffffff;
        cell.letterText.alpha = 1;
      },

      getWorldCenter: () => {
        return cell.letterText.getGlobalPosition();
      },
    };

    this.addChild(bg);
    this.addChild(letterText);

    return cell;
  }

  buildFromWords(words) {
    this.removeChildren();
    this.cells.clear();

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    const cellMap = new Map();

    try {
      for (const w of words) {
        const startX = this.#toInt(w.x ?? w.col ?? w.column);
        const startY = this.#toInt(w.y ?? w.row);

        const dir = this.#normalizeDir(w.dir ?? w.direction);
        const text = this.#toWordText(w);

        if (!Number.isFinite(startX) || !Number.isFinite(startY)) {
          console.warn("[Grid] Invalid coords:", w);
          continue;
        }
        if (!text) continue;

        for (let i = 0; i < text.length; i++) {
          const letter = text[i];
          const gx = startX + (dir === "H" ? i : 0);
          const gy = startY + (dir === "V" ? i : 0);

          const key = this.#key(gx, gy);
          const existing = cellMap.get(key);

          if (existing) {
            if (existing.letter !== letter) {
              console.error(
                `[Grid] Cell conflict at (${gx},${gy}): '${existing.letter}' vs '${letter}'`,
                { existing, incoming: { gx, gy, letter, word: text, dir, startX, startY } }
              );
            }
          } else {
            cellMap.set(key, { gx, gy, letter });
          }

          if (gx < minX) minX = gx;
          if (gy < minY) minY = gy;
          if (gx > maxX) maxX = gx;
          if (gy > maxY) maxY = gy;
        }
      }

      if (cellMap.size === 0) {
        console.warn("[Grid] No cells generated.");
        return;
      }

      this._offsetX = minX;
      this._offsetY = minY;

      for (const entry of cellMap.values()) {
        const cell = this.#createCell({
          gx: entry.gx,
          gy: entry.gy,
          expectedLetter: entry.letter,
        });
        this.cells.set(this.#key(entry.gx, entry.gy), cell);
      }

      const cellStep = (this.cellSize ?? 78) + (this.gap ?? 10);
      this.gridWidth = (maxX - minX + 1) * cellStep - (this.gap ?? 10);
      this.gridHeight = (maxY - minY + 1) * cellStep - (this.gap ?? 10);

    } catch (e) {
      console.error("[Grid] buildFromWords crashed:", e, { words });
    }
  }

  getCell(gx, gy) {
    return this.cells.get(this.#key(gx, gy)) ?? null;
  }

  getCellsForWord(def) 
  {
    const out = [];
    for (let i = 0; i < def.word.length; i++) {
      const gx = def.x + (def.dir === "H" ? i : 0);
      const gy = def.y + (def.dir === "V" ? i : 0);

      const cell = this.getCell(gx, gy);
      if (!cell) return null;
      out.push(cell);
    }
    return out;
  }

  canPlaceWord(def) 
  {
    const cells = this.getCellsForWord(def);
    if (!cells) return false;

    for (let i = 0; i < def.word.length; i++) {
      const cell = cells[i];
      const ch = def.word[i];

      if (cell.locked) {
        const v = (cell.value ?? "").toString().toUpperCase();
        if (v && v !== ch) return false;
      }
    }
    return true;
  }

  isWordSolved(def) 
  {
    const cells = this.getCellsForWord(def);
    if (!cells) return false;

    for (let i = 0; i < def.word.length; i++) {
      const cell = cells[i];
      const ch = def.word[i];

      if (!cell.locked) return false;
      const v = (cell.value ?? "").toString().toUpperCase();
      if (v !== ch) return false;
    }
    return true;
  }

  applySolvedWord(def) 
  {
    const cells = this.getCellsForWord(def);
    if (!cells) return;

    for (let i = 0; i < def.word.length; i++) {
      const cell = cells[i];
      const ch = def.word[i];

      if (!cell.locked) {
        cell.lockWithLetter(ch);
      }
      cell.setSolvedStyle();
    }
  }

  getCellGlobalPosition(gx, gy) {
    const cell = this.getCell(gx, gy);
    if (!cell) return null;
    return cell.getWorldCenter();
  }
}
