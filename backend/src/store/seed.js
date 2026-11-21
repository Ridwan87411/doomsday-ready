import { movies, cinemas, newId } from "./db.js";

// Prerequisite gulo age likhte hobe, jate title diye id khuje paoa jay
const movieSeed = [
  { title: "Iron Man", releaseYear: 2008, runtime: 126, prereqs: [] },
  { title: "Captain America: The First Avenger", releaseYear: 2011, runtime: 124, prereqs: [] },
  { title: "The Avengers", releaseYear: 2012, runtime: 143, prereqs: ["Iron Man", "Captain America: The First Avenger"] },
  { title: "Captain America: Civil War", releaseYear: 2016, runtime: 147, prereqs: ["The Avengers"] },
  { title: "Thor: Ragnarok", releaseYear: 2017, runtime: 130, prereqs: [] },
  { title: "Avengers: Infinity War", releaseYear: 2018, runtime: 149, prereqs: ["Captain America: Civil War", "Thor: Ragnarok"] },
  { title: "Avengers: Endgame", releaseYear: 2019, runtime: 181, prereqs: ["Avengers: Infinity War"] },
  { title: "Avengers: Doomsday", releaseYear: 2026, runtime: 150, prereqs: ["Avengers: Endgame"] },
];

const cinemaSeed = [
  { name: "Starlight Cinemas", bundleSizes: [2, 5] },
  { name: "Grand Screen", bundleSizes: [1, 3, 4] },
  { name: "Galaxy Multiplex", bundleSizes: [4, 6] },
  { name: "Metro Cineplex", bundleSizes: [6, 9, 20] },
];

export function seedData() {
  const idByTitle = new Map();

  for (const m of movieSeed) {
    const id = newId();
    idByTitle.set(m.title, id);
    movies.set(id, {
      id,
      title: m.title,
      releaseYear: m.releaseYear,
      runtime: m.runtime,
      prerequisites: m.prereqs.map((t) => idByTitle.get(t)),
      watched: false,
    });
  }

  for (const c of cinemaSeed) {
    const id = newId();
    cinemas.set(id, { id, name: c.name, bundleSizes: c.bundleSizes });
  }
}