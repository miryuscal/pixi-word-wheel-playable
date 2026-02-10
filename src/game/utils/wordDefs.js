export function normalizeWordDefs(words) {
  return (words || []).map((w) => {
    const word = (w.word ?? w.text ?? "").toString().toUpperCase().trim();
    const dir = (w.dir ?? w.direction ?? "").toString().toUpperCase().trim(); // "H"/"V"
    const x = Number(w.x ?? w.col ?? 0);
    const y = Number(w.y ?? w.row ?? 0);

    return { x, y, word, dir };
  });
}
