import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [m, c] = await Promise.all([api.getMovies(), api.getCinemas()]);
      setMovies(m);
      setCinemas(c);
    } catch (err) {
      setLoadError(err.message || 'Could not load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Movie actions: error hole throw kore, jate form e dekhano jay (jemon CIRCULAR_DEPENDENCY)
  const addMovie = useCallback(async (data) => {
    const created = await api.createMovie(data);
    setMovies((prev) => [...prev, created]);
    return created;
  }, []);

  const updateMovie = useCallback(async (id, patch) => {
    const updated = await api.updateMovie(id, patch);
    setMovies((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  }, []);

  const removeMovie = useCallback(async (id) => {
    await api.deleteMovie(id);
    setMovies((prev) =>
      prev.filter((m) => m.id !== id).map((m) => ({ ...m, prerequisites: m.prerequisites.filter((p) => p !== id) }))
    );
  }, []);

  const addCinema = useCallback(async (data) => {
    const created = await api.createCinema(data);
    setCinemas((prev) => [...prev, created]);
    return created;
  }, []);

  const value = useMemo(
    () => ({ movies, cinemas, loading, loadError, reload, addMovie, updateMovie, removeMovie, addCinema }),
    [movies, cinemas, loading, loadError, reload, addMovie, updateMovie, removeMovie, addCinema]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
