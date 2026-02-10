export function buildOccupiedCells(words) {
  const cells = new Set();

  for (const w of words) {
    const { x, y, word, dir } = w;

    for (let i = 0; i < word.length; i++) {
      const cx = dir === "H" ? x + i : x;
      const cy = dir === "V" ? y + i : y;

      cells.add(`${cx},${cy}`);
    }
  }

  return cells;
}

export function getGridBounds(cellsSet) 
{
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const key of cellsSet) {
    const [xStr, yStr] = key.split(",");
    const x = Number(xStr);
    const y = Number(yStr);

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return { minX, minY, maxX, maxY };
}
