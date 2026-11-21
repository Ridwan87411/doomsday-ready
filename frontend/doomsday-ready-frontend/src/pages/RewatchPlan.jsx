import { useEffect, useState } from 'react';
import { ArrowDown, Clock3, Clapperboard, CheckCircle2, Circle, Play, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useData } from '../context/DataContext';
import { formatDuration } from '../utils/algorithms';

export default function RewatchPlan() {
  const { movies, updateMovie } = useData();
  const [target, setTarget] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Default target: shesh movie (Doomsday). Target delete hoye gele abar default e fire jabe.
  useEffect(() => {
    if (movies.length && !movies.some((m) => m.id === target)) setTarget(movies[movies.length - 1].id);
  }, [movies, target]);

  // Target ba movies (watched/prerequisite) bodlale abar plan ana hoy
  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .getRewatchOrder(target)
      .then((data) => !cancelled && setResult(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [target, movies]);

  const plan = result?.order ?? [];
  const total = result?.totalCount ?? 0;
  const watched = result?.watchedCount ?? 0;
  const percent = total ? Math.round((watched / total) * 100) : 0;
  const { h, m } = formatDuration(result?.remainingRuntime ?? 0);
  const targetMovie = movies.find((x) => x.id === target);

  async function toggleWatched(movie) {
    try {
      await updateMovie(movie.id, { watched: !movie.watched });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <section className="page-intro">
        <div>
          <div className="eyebrow"><span /> YOUR PERSONAL WATCH GUIDE</div>
          <h1>The rewatch <em>plan.</em></h1>
          <p>Every origin. Every connection. One story at a time.</p>
        </div>
        <div className="intro-stamp"><Sparkles size={18} /><span>STAY IN THE LOOP</span></div>
      </section>

      <section className="plan-selector panel">
        <div>
          <span className="field-kicker">I'M GETTING READY FOR</span>
          <h2>Choose your target movie</h2>
          <p>We'll map out the stories you need to see first.</p>
        </div>
        <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Target movie">
          {movies.map((mv) => <option key={mv.id} value={mv.id}>{mv.title}</option>)}
        </select>
      </section>

      {error && <div className="page-error">{error}</div>}

      <section className="plan-overview">
        <div className="progress-panel panel">
          <div className="panel-top">
            <div>
              <span className="field-kicker">YOUR PROGRESS</span>
              <h2>{total === 0 ? 'Nothing to catch up on.' : percent === 100 ? "You're ready!" : "You're getting closer."}</h2>
            </div>
            <div className="progress-number">{percent}<small>%</small></div>
          </div>
          <div className="progress-track"><div style={{ width: `${percent}%` }} /></div>
          <div className="progress-foot">
            <span><b>{watched} of {total}</b> watched</span>
            <span>{total - watched} remaining</span>
          </div>
          <div className="progress-stats">
            <div><CheckCircle2 size={17} /><strong>{watched}</strong><span>COMPLETED</span></div>
            <div><Clock3 size={17} /><strong>{total - watched}</strong><span>UP NEXT</span></div>
          </div>
        </div>
        <div className="time-panel">
          <div className="time-glow" />
          <div className="eyebrow">TIME LEFT IN YOUR MARATHON</div>
          <div className="time-value">{h}<small>h</small> {m}<small>m</small></div>
          <p>Estimated unwatched runtime</p>
          <div className="time-bottom"><Clock3 size={15} /> Based on movie runtimes</div>
        </div>
      </section>

      <section className="section-heading plan-list-heading">
        <div>
          <div className="eyebrow muted">THE ROAD TO {targetMovie ? targetMovie.title.toUpperCase() : 'THE PREMIERE'}</div>
          <h2>Your watch order <span className="count-pill">{total} {total === 1 ? 'FILM' : 'FILMS'}</span></h2>
        </div>
        <span className="order-note">PREREQUISITES FIRST <ArrowDown size={14} /></span>
      </section>

      <div className="timeline" style={{ opacity: loading ? 0.6 : 1 }}>
        {plan.length ? (
          plan.map((movie, i) => (
            <div className={`timeline-item ${movie.watched ? 'is-done' : ''}`} key={movie.id}>
              <div className="timeline-rail">
                <button
                  className="rail-btn"
                  title={movie.watched ? 'Mark as not watched' : 'Mark as watched'}
                  onClick={() => toggleWatched(movie)}
                >
                  {movie.watched ? <CheckCircle2 size={23} /> : <Circle size={23} />}
                </button>
                {i !== plan.length - 1 && <div className="rail-line" />}
              </div>
              <article className="timeline-card">
                <div className={`timeline-poster poster-${i % 6}`}><Clapperboard size={25} /><span>{movie.releaseYear}</span></div>
                <div className="timeline-info">
                  <span className="timeline-step">CHAPTER {String(i + 1).padStart(2, '0')}</span>
                  <h3>{movie.title}</h3>
                  <div className="movie-meta">
                    <span><Clock3 size={14} />{movie.runtime} min</span>
                    <span>{movie.watched ? 'Completed' : 'On your list'}</span>
                  </div>
                </div>
                <span className={`status ${movie.watched ? 'status-watched' : 'status-pending'}`}>
                  {movie.watched ? 'WATCHED' : 'UP NEXT'}
                </span>
              </article>
            </div>
          ))
        ) : (
          !loading && (
            <div className="empty-state">
              <Play size={30} />
              <h3>Nothing to rewatch first</h3>
              <p>{targetMovie ? `"${targetMovie.title}" has no prerequisites.` : 'Pick a target movie above.'}</p>
            </div>
          )
        )}
      </div>

      <div className="note-banner">
        <Sparkles size={18} />
        <p><b>One story, one universe.</b> Your watch order includes every prerequisite (and their prerequisites), each movie once, with earlier movies always first. Tap a circle to mark a movie as watched.</p>
      </div>
    </>
  );
}
