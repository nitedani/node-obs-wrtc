function random(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function haiku(seed: number) {
  const seededRandom = random(seed);
  const adjs = [
      "Hidden",
      "Bitter",
      "Silent",
      "Dark",
      "Cool",
      "Broken",
      "Polished",
      "Ancient",
      "Purple",
      "Nameless",
    ],
    nouns = ["Scrub", "Noob", "Smurf", "Troll", "Pro"];

  return (
    adjs[Math.floor(seededRandom * (adjs.length - 1))] +
    nouns[Math.floor(seededRandom * (nouns.length - 1))] +
    Math.floor(seededRandom * 100000)
  );
}
