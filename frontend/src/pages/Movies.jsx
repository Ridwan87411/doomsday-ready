import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Clock3, CalendarDays, Check, X, Film, Filter, AlertTriangle } from 'lucide-react';
import { useData } from '../context/DataContext';

const emptyForm = { title: '', releaseYear: '', runtime: '', prerequisites: [], watched: false };

export default function Movies() {
  const { movies, addMovie, updateMovie, removeMovie } = useData();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null); // { message, circular }
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const titleOf = (id) => movies.find((m) => m.id === id)?.title ?? 'Unknown';
  const watchedCount = movies.filter((m) => m.watched).length;

  const visible = useMemo(
    () =>
      movies.filter(
        (m) =>
          m.title.toLowerCase().includes(query.trim().toLowerCase()) &&
          (filter === 'all' || (filter === 'watched' ? m.watched : !m.watched))
      ),
    [movies, query, filter]
  );

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 3500);
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModal(true);
  }

  function openEdit(movie) {
    setEditing(movie.id);
    setForm({
      title: movie.title,
      releaseYear: String(movie.releaseYear),
      runtime: String(movie.runtime),
      prerequisites: [...movie.prerequisites],
      watched: movie.watched,
    });
    setError(null);
    setModal(true);
  }

  function closeModal() {
    if (!saving) setModal(false);
  }

  function togglePrereq(id) {
    setForm((f) => ({
      ...f,
      prerequisites: f.prerequisites.includes(id) ? f.prerequisites.filter((p) => p !== id) : [...f.prerequisites, id],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);

    const title = form.title.trim();
    const year = Number(form.releaseYear);
    const runtime = Number(form.runtime);
    if (!title || form.releaseYear === '' || form.runtime === '')
      return setError({ message: 'Please complete all required fields.' });
    if (!Number.isInteger(year) || year < 1888 || year > 2100)
      return setError({ message: 'Release year must be between 1888 and 2100.' });
    if (!Number.isInteger(runtime) || runtime < 1 || runtime > 300)
      return setError({ message: 'Runtime must be a whole number between 1 and 300 minutes.' });

    const payload = { title, releaseYear: year, runtime, prerequisites: form.prerequisites, watched: form.watched };
    setSaving(true);
    try {
      if (editing) await updateMovie(editing, payload);
      else await addMovie(payload);
      setModal(false);
      showToast(editing ? 'Movie updated.' : 'Movie added.');
    } catch (err) {
      setError({
        message:
          err.code === 'CIRCULAR_DEPENDENCY'
            ? 'Circular dependency! A movie cannot depend on itself, directly or through other movies. Remove one of the selected prerequisites.'
            : err.message,
        circular: err.code === 'CIRCULAR_DEPENDENCY',
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleWatched(movie) {
    try {
      await updateMovie(movie.id, { watched: !movie.watched });
    } catch (err) {
      showToast(err.message);
    }
  }

  async function remove(movie) {
    if (!window.confirm(`Delete "${movie.title}"? It will also be removed from other movies' prerequisites.`)) return;
    try {
      await removeMovie(movie.id);
      showToast('Movie deleted.');
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <>
      <section className="hero hero-movies">
        <div className="hero-copy">
          <div className="eyebrow"><span /> THE ULTIMATE MCU CHECKLIST</div>
          <h1>Every story has a<br /><em>beginning.</em></h1>
          <p>Build your watchlist. Track your progress. Be ready for what comes next.</p>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={17} /> Add a movie</button>
        </div>
        <div className="hero-art">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-reel"><Film size={76} strokeWidth={1.1} /></div>
          <div className="hero-tag">YOUR NEXT MARATHON <b>STARTS NOW</b></div>
        </div>
        <div className="hero-index">01 <span>/ 03</span></div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><Film size={18} /></div>
          <div><span>TOTAL MOVIES</span><strong>{String(movies.length).padStart(2, '0')}</strong></div>
          <small>IN YOUR LIBRARY</small>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Check size={18} /></div>
          <div><span>WATCHED</span><strong>{String(watchedCount).padStart(2, '0')}</strong></div>
          <small>COMPLETED</small>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Clock3 size={18} /></div>
          <div><span>LEFT TO WATCH</span><strong>{String(movies.length - watchedCount).padStart(2, '0')}</strong></div>
          <small>STILL TO EXPLORE</small>
        </div>
      </section>

      <section className="section-heading">
        <div>
          <div className="eyebrow muted">YOUR COLLECTION</div>
          <h2>Movie library <span className="count-pill">{visible.length}</span></h2>
        </div>
        <div className="library-tools">
          <div className="search-box">
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search movies..." />
          </div>
          <div className="filter-box">
            <Filter size={15} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All movies</option>
              <option value="watched">Watched</option>
              <option value="unwatched">Unwatched</option>
            </select>
          </div>
        </div>
      </section>

      <div className="movie-grid">
        {visible.map((movie, i) => (
          <article className="movie-card" key={movie.id}>
            <div className={`poster poster-${i % 6}`}>
              <span className="poster-year">{movie.releaseYear}</span>
              <div className="poster-symbol"><Film size={34} /></div>
              <div className="poster-title">{movie.title}</div>
              <span className="poster-label">MARVEL REWATCH</span>
              <div className="poster-number">{String(i + 1).padStart(2, '0')}</div>
            </div>
            <div className="movie-card-body">
              <div className="movie-title-row">
                <h3>{movie.title}</h3>
                <span className={`status ${movie.watched ? 'status-watched' : 'status-pending'}`}>
                  {movie.watched ? 'WATCHED' : 'TO WATCH'}
                </span>
              </div>
              <div className="movie-meta">
                <span><CalendarDays size={14} />{movie.releaseYear}</span>
                <span><Clock3 size={14} />{movie.runtime} min</span>
              </div>
              <p className="needs-line">
                {movie.prerequisites.length
                  ? <>Watch first: {movie.prerequisites.map(titleOf).join(', ')}</>
                  : 'No prerequisites'}
              </p>
              <div className="movie-actions">
                <label className="watch-toggle">
                  <input type="checkbox" checked={movie.watched} onChange={() => toggleWatched(movie)} />
                  <span className="fake-check"><Check size={12} /></span> Watched
                </label>
                <div>
                  <button className="icon-btn" title="Edit movie" onClick={() => openEdit(movie)}><Pencil size={15} /></button>
                  <button className="icon-btn danger-hover" title="Delete movie" onClick={() => remove(movie)}><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="empty-state">
          <Film size={30} />
          <h3>No movies found</h3>
          <p>Try another search or add a movie to your collection.</p>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      {modal && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <form className="modal" onSubmit={submit} noValidate>
            <div className="modal-head">
              <div>
                <div className="eyebrow muted">MOVIE DETAILS</div>
                <h2>{editing ? 'Edit movie' : 'Add a movie'}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={closeModal}><X /></button>
            </div>

            {error && (
              <div className={`form-error ${error.circular ? 'form-error-circular' : ''}`}>
                {error.circular && <AlertTriangle size={14} />} {error.message}
              </div>
            )}

            <label>
              Movie title
              <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Iron Man" />
            </label>
            <div className="form-row">
              <label>
                Release year
                <input type="number" min="1888" max="2100" value={form.releaseYear} onChange={(e) => setForm({ ...form, releaseYear: e.target.value })} placeholder="2008" />
              </label>
              <label>
                Runtime (minutes)
                <input type="number" min="1" max="300" value={form.runtime} onChange={(e) => setForm({ ...form, runtime: e.target.value })} placeholder="126" />
              </label>
            </div>

            <div className="field-group">
              <div className="field-title">Prerequisite movies <span className="label-hint">Tap to select what to watch first</span></div>
              <div className="chip-list">
                {movies.filter((m) => m.id !== editing).map((m) => {
                  const on = form.prerequisites.includes(m.id);
                  return (
                    <button type="button" key={m.id} className={`chip ${on ? 'chip-on' : ''}`} onClick={() => togglePrereq(m.id)}>
                      {on && <Check size={12} />} {m.title}
                    </button>
                  );
                })}
                {movies.filter((m) => m.id !== editing).length === 0 && <span className="label-hint">No other movies yet.</span>}
              </div>
            </div>

            <label className="modal-checkbox">
              <input type="checkbox" checked={form.watched} onChange={(e) => setForm({ ...form, watched: e.target.checked })} /> Already watched
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add movie'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
