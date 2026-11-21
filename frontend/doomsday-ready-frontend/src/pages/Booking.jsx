import { useEffect, useRef, useState } from 'react';
import { Ticket, Users, Armchair, Plus, Minus, CheckCircle2, AlertCircle, ArrowRight, X } from 'lucide-react';
import { api } from '../services/api';
import { useData } from '../context/DataContext';

const MAX_GROUP = 10000;

export default function Booking() {
  const { cinemas, addCinema } = useData();
  const [cinemaId, setCinemaId] = useState('');
  const [groupSize, setGroupSize] = useState('11'); // string, jate input faka rakha jay
  const [quote, setQuote] = useState(undefined); // undefined = ekhono hoy nai
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  // cinema modal
  const [modal, setModal] = useState(false);
  const [cinemaName, setCinemaName] = useState('');
  const [sizesText, setSizesText] = useState('');
  const [cinemaError, setCinemaError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cinemas.length && !cinemas.some((c) => c.id === cinemaId)) setCinemaId(cinemas[0].id);
  }, [cinemas, cinemaId]);

  const cinema = cinemas.find((c) => c.id === cinemaId);
  const size = Number(groupSize);
  const sizeValid = groupSize !== '' && Number.isInteger(size) && size >= 1 && size <= MAX_GROUP;

  function changeSize(value) {
    setGroupSize(String(value));
    setQuote(undefined);
    setError('');
  }

  async function calculate(e) {
    e.preventDefault();
    if (!cinema) return;
    if (!sizeValid) return setError(`Enter a whole number of guests from 1 to ${MAX_GROUP.toLocaleString()}.`);
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const result = await api.getBooking(cinema.id, size);
      if (id === requestId.current) setQuote({ ...result, groupSize: size, cinemaName: cinema.name });
    } catch (err) {
      if (id === requestId.current) {
        setQuote(undefined);
        setError(err.message);
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  function openModal() {
    setCinemaName('');
    setSizesText('');
    setCinemaError('');
    setModal(true);
  }

  async function submitCinema(e) {
    e.preventDefault();
    setCinemaError('');
    const parts = sizesText.split(/[\s,]+/).filter(Boolean);
    const sizes = parts.map(Number);
    if (!cinemaName.trim()) return setCinemaError('Cinema name is required.');
    if (sizes.length < 1 || sizes.length > 10) return setCinemaError('Enter 1 to 10 bundle sizes, separated by commas.');
    if (sizes.some((s) => !Number.isInteger(s) || s < 1 || s > 500)) return setCinemaError('Each bundle size must be a whole number from 1 to 500.');
    if (new Set(sizes).size !== sizes.length) return setCinemaError('Bundle sizes must be different from each other.');
    setSaving(true);
    try {
      const created = await addCinema({ name: cinemaName.trim(), bundleSizes: sizes });
      setCinemaId(created.id);
      setQuote(undefined);
      setModal(false);
    } catch (err) {
      setCinemaError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="page-intro booking-intro">
        <div>
          <div className="eyebrow"><span /> ASSEMBLE YOUR SQUAD</div>
          <h1>Movie night.<br /><em>All together.</em></h1>
          <p>Bring your people. We'll figure out the perfect seat bundle combination.</p>
        </div>
        <div className="ticket-art">
          <div className="ticket-shape"><Ticket size={48} /><span>ADMIT ONE</span><b>DOOMSDAY</b></div>
        </div>
      </section>

      <div className="booking-layout">
        <section className="booking-form panel">
          <div className="panel-heading">
            <div className="stat-icon orange"><Ticket size={19} /></div>
            <div><span className="field-kicker">THE GAME PLAN</span><h2>Build your watch party</h2></div>
            <button type="button" className="btn btn-ghost add-cinema-btn" onClick={openModal}><Plus size={14} /> New cinema</button>
          </div>

          <form onSubmit={calculate} noValidate>
            <label className="form-label">
              SELECT YOUR CINEMA
              <select value={cinemaId} onChange={(e) => { setCinemaId(e.target.value); setQuote(undefined); setError(''); }}>
                {cinemas.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}
              </select>
            </label>

            <div className="bundle-info">
              <span>AVAILABLE BUNDLE SIZES</span>
              <div>{cinema?.bundleSizes.map((s) => <b key={s}>{s} <small>SEATS</small></b>)}</div>
            </div>

            <div className="form-label">HOW MANY PEOPLE ARE COMING?</div>
            <div className="guest-counter">
              <button type="button" onClick={() => changeSize(Math.max(1, (sizeValid ? size : 1) - 1))} disabled={sizeValid && size <= 1} aria-label="Fewer guests"><Minus size={17} /></button>
              <div><strong>{sizeValid ? size : '–'}</strong><span>GUESTS</span></div>
              <button type="button" onClick={() => changeSize(Math.min(MAX_GROUP, (sizeValid ? size : 0) + 1))} disabled={sizeValid && size >= MAX_GROUP} aria-label="More guests"><Plus size={17} /></button>
            </div>
            <div className="guest-input">
              <Users size={16} />
              <input type="number" min="1" max={MAX_GROUP} value={groupSize} onChange={(e) => changeSize(e.target.value)} aria-label="Group size" />
              <span>People in your group (1–10,000)</span>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button className="btn btn-primary calculate-btn" type="submit" disabled={loading || !cinema}>
              {loading ? 'Calculating...' : 'Find my bundle combination'} <ArrowRight size={17} />
            </button>
            <p className="form-footnote">EXACT SEATS ONLY · NO EMPTY SEATS · FEWEST BUNDLES</p>
          </form>
        </section>

        <section className="booking-result">
          <div className="result-top">
            <span className="field-kicker">YOUR BOOKING QUOTE</span>
            <span className="result-live"><span /> READY WHEN YOU ARE</span>
          </div>

          {quote === undefined ? (
            <div className="result-placeholder">
              <div className="placeholder-ticket"><Ticket size={38} /></div>
              <h2>Your seats, sorted.</h2>
              <p>Choose a cinema, set your group size and we'll find the smallest exact bundle combination.</p>
              <div className="placeholder-decoration"><span /><span /><span /><span /><span /><span /><span /></div>
            </div>
          ) : !quote.possible ? (
            <div className="result-placeholder">
              <AlertCircle size={38} />
              <h2>Not possible</h2>
              <p>{quote.cinemaName} can't make exactly {quote.groupSize} seats from its bundle sizes. Try a different group size or cinema.</p>
            </div>
          ) : (
            <div className="result-content">
              <div className="success-mark"><CheckCircle2 size={28} /></div>
              <h2>{quote.totalBundles} {quote.totalBundles === 1 ? 'bundle' : 'bundles'}</h2>
              <p>for {quote.groupSize} {quote.groupSize === 1 ? 'guest' : 'guests'} at {quote.cinemaName}. Every seat is filled.</p>
              <div className="bundle-result-list">
                {quote.breakdown.map((b) => (
                  <div key={b.size}><span>{b.size}-seat bundle</span><b>× {b.count}</b></div>
                ))}
              </div>
            </div>
          )}

          <div className="result-bottom"><Armchair size={16} /> YOUR CREW. YOUR MOVIE. YOUR NIGHT.</div>
        </section>
      </div>

      {modal && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && setModal(false)}>
          <form className="modal" onSubmit={submitCinema} noValidate>
            <div className="modal-head">
              <div><div className="eyebrow muted">NEW CINEMA</div><h2>Add a cinema</h2></div>
              <button type="button" className="icon-btn" onClick={() => !saving && setModal(false)}><X /></button>
            </div>
            {cinemaError && <div className="form-error">{cinemaError}</div>}
            <label>
              Cinema name
              <input autoFocus value={cinemaName} onChange={(e) => setCinemaName(e.target.value)} placeholder="e.g. Star Cineplex" />
            </label>
            <label>
              Bundle sizes <span className="label-hint">1–10 different sizes, each 1–500, separated by commas</span>
              <input value={sizesText} onChange={(e) => setSizesText(e.target.value)} placeholder="e.g. 2, 5" />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => !saving && setModal(false)}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add cinema'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="note-banner">
        <Ticket size={18} />
        <p><b>How it works.</b> The booking feature finds the fewest available bundles that add up to your exact group size. No one gets stuck paying for an empty seat.</p>
      </div>
    </>
  );
}
