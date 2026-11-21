// Demo seed data (challenge er example data). Ids shob string, jate real backend (UUID) er sathe o mile.
export const initialMovies = [
  { id: 'm1', title: 'Iron Man', releaseYear: 2008, runtime: 126, prerequisites: [], watched: true },
  { id: 'm2', title: 'Captain America: The First Avenger', releaseYear: 2011, runtime: 124, prerequisites: [], watched: true },
  { id: 'm3', title: 'The Avengers', releaseYear: 2012, runtime: 143, prerequisites: ['m1', 'm2'], watched: true },
  { id: 'm4', title: 'Captain America: Civil War', releaseYear: 2016, runtime: 147, prerequisites: ['m3'], watched: false },
  { id: 'm5', title: 'Thor: Ragnarok', releaseYear: 2017, runtime: 130, prerequisites: [], watched: false },
  { id: 'm6', title: 'Avengers: Infinity War', releaseYear: 2018, runtime: 149, prerequisites: ['m4', 'm5'], watched: false },
  { id: 'm7', title: 'Avengers: Endgame', releaseYear: 2019, runtime: 181, prerequisites: ['m6'], watched: false },
  { id: 'm8', title: 'Avengers: Doomsday', releaseYear: 2026, runtime: 150, prerequisites: ['m7'], watched: false },
];

export const initialCinemas = [
  { id: 'c1', name: 'Starlight Cinemas', bundleSizes: [2, 5] },
  { id: 'c2', name: 'Grand Screen', bundleSizes: [1, 3, 4] },
  { id: 'c3', name: 'Galaxy Multiplex', bundleSizes: [4, 6] },
  { id: 'c4', name: 'Metro Cineplex', bundleSizes: [6, 9, 20] },
];
