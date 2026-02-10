export default class WordSystem {
  constructor({
    grid,
    wheel,
    wordDefs,
    flyAnimator,
  } = {}) {
    this.grid = grid;
    this.wheel = wheel;
    this.flyAnimator = flyAnimator;
    this.onLevelComplete = null;
    this.wordMap = new Map((wordDefs || []).map((d) => [d.word, d]));
    this.solvedWords = new Set();

    this.isBusy = false;
  }

  getNextUnsolvedWord() {
    for (const [w] of this.wordMap) {
      if (!this.solvedWords.has(w) && !this.#isWordSolved(this.wordMap.get(w))) {
        return w;
      }
    }
    return null;
  }

  async submitWord(word, _displayNodes, _selectionLine) 
  {
    if (this.isBusy) return;

    const W = (word || "").toString().toUpperCase().trim();
    if (!W) return;

    const def = this.wordMap.get(W);

    if (!def) {
      return this.#fail();
    }

    if (this.solvedWords.has(W) || this.#isWordSolved(def)) {
      return this.#fail();
    }

    if (!this.#canPlaceWord(def)) {
      return this.#fail();
    }

    this.isBusy = true;

    const letters = def.word.split("");
    const targetCells = this.#getCellsForWord(def);
    if (!targetCells) {
      await this.#fail();
      return;
    }

    const display = this.wheel?.wordDisplay;
    const displayNodes = display?.getLetterNodes?.() ?? [];

    if (displayNodes.length < letters.length) {
      await this.#fail();
      return;
    }

    const flyLetters = [];
    const flyItems = [];
    const flyCells = [];

    for (let i = 0; i < letters.length; i++) {
      const cell = targetCells[i];
      const item = displayNodes[i];
      if (!cell || !item) continue;

      if (cell.locked) continue;

      flyLetters.push(letters[i]);
      flyItems.push(item);
      flyCells.push(cell);
    }

    display?.hideLetters?.();

    if (flyLetters.length && this.flyAnimator?.flyToCells) {
      await this.flyAnimator.flyToCells({
        letters: flyLetters,
        letterItems: flyItems,     
        targetCells: flyCells,
        fadeOriginal: true,
        duration: 0.9,             
        ease: "sine.out",          
      });
    }

    this.#applySolvedWord(def);
    this.solvedWords.add(W);
    
    if (this.getNextUnsolvedWord?.() === null) {
    this.onLevelComplete?.();
    }

    this.wheel?.clearSelection?.(true);

    this.isBusy = false;
  }


  async #fail() 
  {
    if (this.isBusy) return;
    this.isBusy = true;

    const display = this.wheel?.wordDisplay;
    if (display?.playShake) {
      await display.playShake(1.0);
    }

    this.wheel?.clearSelection?.(true);

    this.isBusy = false;
  }

  #getCellsForWord(def) 
  {
    if (this.grid?.getCellsForWord) return this.grid.getCellsForWord(def);

    const out = [];
    for (let i = 0; i < def.word.length; i++) {
      const cx = def.x + (def.dir === "H" ? i : 0);
      const cy = def.y + (def.dir === "V" ? i : 0);

      const cell =
        this.grid?.getCell?.(cx, cy) ??
        this.grid?.cells?.[cy]?.[cx] ??
        null;

      if (!cell) return null;
      out.push(cell);
    }
    return out;
  }

  #canPlaceWord(def) 
  {
    if (this.grid?.canPlaceWord) return this.grid.canPlaceWord(def);

    const cells = this.#getCellsForWord(def);
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

  #isWordSolved(def) 
  {
    if (this.grid?.isWordSolved) return this.grid.isWordSolved(def);

    const cells = this.#getCellsForWord(def);
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

  #applySolvedWord(def) 
  {
    if (this.grid?.applySolvedWord) return this.grid.applySolvedWord(def);

    const cells = this.#getCellsForWord(def);
    if (!cells) return;

    for (let i = 0; i < def.word.length; i++) {
      const cell = cells[i];
      const ch = def.word[i];

      if (!cell.locked) {
        if (cell.lockWithLetter) cell.lockWithLetter(ch);
        else {
          cell.locked = true;
          cell.value = ch;
          if (cell.letterText) cell.letterText.text = ch;
        }
      }

      if (cell.setSolvedStyle) cell.setSolvedStyle();
      else {
        if (cell.bg) cell.bg.tint = 0xF39A2E;
        if (cell.letterText?.style) cell.letterText.style.fill = 0xffffff;
        if (cell.letterText) cell.letterText.alpha = 1;
      }
    }
  }
}
