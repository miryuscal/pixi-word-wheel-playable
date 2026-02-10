export function parseLetters(lvlLettersStr) {
  return lvlLettersStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseWords(lvlWordsStr) {
  return lvlWordsStr
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const pieces = part.split(",").map((s) => s.trim());
      if (pieces.length !== 4) {
        throw new Error("Invalid word part: " + part);
      }

      
      const y = Number(pieces[0]);
      const x = Number(pieces[1]);

      const word = String(pieces[2] ?? "").trim().toUpperCase();
      const dir = String(pieces[3] ?? "").trim().toUpperCase();

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error("Invalid x/y in: " + part);
      }
      if (dir !== "H" && dir !== "V") {
        throw new Error("Invalid dir in: " + part);
      }
      if (!word) {
        throw new Error("Invalid word in: " + part);
      }

      return { x, y, word, dir };
    });
}

export function parseLevel(levelObj) {
  return {
    id: levelObj.id,
    letters: parseLetters(levelObj.lvlLetters),
    words: parseWords(levelObj.lvlWords),
  };


}
