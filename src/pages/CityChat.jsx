import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Footer } from '../components/Footer.jsx';
import { Eyebrow } from '../components/SectionHeading.jsx';
import { useI18n } from '../i18n/index.jsx';
import { useAtlasCities } from '../data/useAtlasData.js';
import { PLATFORMS_BY_ID } from '../data/platforms.js';
import { askCityChat, CITYCHAT_ENABLED, CityChatError, probeCityChat } from '../data/citychat.js';
import './Prose.css';
import './CityChat.css';

const PERSONAS = ['citizen', 'policy', 'research', 'press'];
// The city a suggestion names when none is chosen: the one published on
// every layer, so every suggestion has an answer.
const SUGGESTION_CITY = 'milan';
const COORD = { minimumFractionDigits: 3, maximumFractionDigits: 3 };

/**
 * CityChat: questions about the layers, answered from the published data.
 *
 * The page is a client of server/citychat/, which holds the model and the
 * tools; nothing here computes a figure. Persona and city live in the query
 * string, so a city view can link straight into a conversation about itself.
 * The conversation does not: it is sent in full with each question and kept
 * nowhere else.
 */
export default function CityChat() {
  const { t, n, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const cities = useAtlasCities();

  const persona = PERSONAS.includes(params.get('persona')) ? params.get('persona') : 'citizen';
  const cityId = cities.some((c) => c.id === params.get('city')) ? params.get('city') : '';
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const cityName = (id) => {
    const city = cities.find((c) => c.id === id);
    return city ? (lang === 'it' ? city.nameIt || city.name : city.name) : id;
  };

  // Whether the service is there, and which model it runs.
  const [service, setService] = useState({
    status: CITYCHAT_ENABLED ? 'checking' : 'disabled',
    provider: null,
  });
  useEffect(() => {
    if (!CITYCHAT_ENABLED) return undefined;
    const controller = new AbortController();
    probeCityChat({ signal: controller.signal }).then((provider) => {
      if (!controller.signal.aborted) setService({ status: provider ? 'online' : 'offline', provider });
    });
    return () => controller.abort();
  }, []);

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(null); // { tools: [], checking }
  const abortRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, pending]);

  const ask = async (text) => {
    const question = text.trim();
    if (!question || pending) return;
    const history = [...messages.filter((m) => !m.error), { role: 'user', text: question }];
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setDraft('');
    setPending({ tools: [], checking: false });

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const answer = await askCityChat({
        messages: history.map(({ role, text: body }) => ({ role, text: body })),
        persona,
        city: cityId,
        lang,
        signal: controller.signal,
        onEvent: (event) => {
          if (event.type === 'tool') setPending((p) => p && { ...p, tools: [...p.tools, event] });
          if (event.type === 'status') setPending((p) => p && { ...p, checking: true });
        },
      });
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: answer.text,
          links: answer.links ?? [],
          tools: answer.tools ?? [],
          unverified: answer.unverified ?? [],
        },
      ]);
    } catch (error) {
      if (error?.name !== 'AbortError') {
        const code = error instanceof CityChatError ? error.code : 'unavailable';
        setMessages((m) => [...m, { role: 'assistant', error: code }]);
      }
    } finally {
      abortRef.current = null;
      setPending(null);
      inputRef.current?.focus();
    }
  };

  const stop = () => abortRef.current?.abort();
  const reset = () => {
    stop();
    setMessages([]);
  };

  const suggestions = useMemo(() => {
    const list = t(`citychat.suggestions.${persona}`);
    const name = cityName(cityId || SUGGESTION_CITY);
    return Array.isArray(list) ? list.map((s) => s.replace('{city}', name)) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona, cityId, cities, lang, t]);

  const offline = service.status === 'offline' || service.status === 'disabled';

  return (
    <div className="aa-page">
      <main className="aa-main" id="main">
        <section className="aa-shell aa-prose__intro aa-chat__intro">
          <Eyebrow>{t('citychat.eyebrow')}</Eyebrow>
          <h1 className="aa-prose__headline">
            {t('citychat.headline')} <span className="aa-accent">{t('citychat.headlineAccent')}</span>
          </h1>
          <p className="aa-prose__lede">{t('citychat.lede')}</p>
        </section>

        <section className="aa-shell aa-block">
          <div className="aa-card aa-chat">
            <div className="aa-chat__controls">
              <div className="aa-chat__personas" role="group" aria-label={t('citychat.persona.label')}>
                <span className="aa-chat__label">{t('citychat.persona.label')}</span>
                {PERSONAS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={`aa-chip aa-chip--icon${persona === id ? ' aa-chip--active' : ''}`}
                    aria-pressed={persona === id}
                    onClick={() => setParam('persona', id === 'citizen' ? null : id)}
                  >
                    {t(`citychat.persona.${id}`)}
                  </button>
                ))}
              </div>
              <label className="aa-chat__city">
                <span className="aa-chat__label">{t('citychat.city.label')}</span>
                <select value={cityId} onChange={(e) => setParam('city', e.target.value || null)}>
                  <option value="">{t('citychat.city.any')}</option>
                  {[...cities]
                    .sort((a, b) => cityName(a.id).localeCompare(cityName(b.id), lang))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {cityName(c.id)}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <div className="aa-chat__log" ref={listRef} aria-live="polite">
              {messages.length === 0 && !pending && (
                <div className="aa-chat__empty">
                  <div className="aa-chat__label">{t('citychat.suggestionsTitle')}</div>
                  <div className="aa-chat__suggestions">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="aa-chat__suggestion"
                        disabled={offline}
                        onClick={() => ask(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="aa-chat__msg aa-chat__msg--user">
                    <div className="aa-chat__who">{t('citychat.you')}</div>
                    <div className="aa-chat__bubble">{m.text}</div>
                  </div>
                ) : (
                  <div key={i} className="aa-chat__msg aa-chat__msg--bot">
                    <div className="aa-chat__who">{t('citychat.assistant')}</div>
                    {m.error ? (
                      <div className="aa-chat__bubble aa-chat__bubble--error">{t(`citychat.errors.${m.error}`)}</div>
                    ) : (
                      <div className="aa-chat__bubble">
                        <Answer text={m.text} />
                        {m.unverified.length > 0 && (
                          <p className="aa-chat__warn">
                            {t('citychat.unverified', { list: m.unverified.join(', ') })}
                          </p>
                        )}
                        {m.links.length > 0 && (
                          <div className="aa-chat__links">
                            {m.links.map((link) => (
                              <Link key={link.href} to={link.href} className="aa-chip">
                                {t('citychat.showOnMap')} · {cityName(link.city)}
                                {link.layer && ` · ${PLATFORMS_BY_ID[link.layer]?.name ?? link.layer}`}
                                {link.cell && ` · ${t('citychat.cell')}`}
                                {link.cell && Number.isFinite(link.lat) && (
                                  <span className="aa-chat__coord">
                                    {n(link.lat, COORD)}, {n(link.lon, COORD)}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                        {m.tools.length > 0 && <ToolTrace tools={m.tools} cityName={cityName} />}
                      </div>
                    )}
                  </div>
                ),
              )}

              {pending && (
                <div className="aa-chat__msg aa-chat__msg--bot">
                  <div className="aa-chat__who">{t('citychat.assistant')}</div>
                  <div className="aa-chat__bubble aa-chat__bubble--pending">
                    <span className="aa-chat__dots" aria-hidden="true" />
                    {pending.checking ? t('citychat.checking') : t('citychat.working')}
                    {pending.tools.length > 0 && <ToolTrace tools={pending.tools} cityName={cityName} live />}
                  </div>
                </div>
              )}
            </div>

            <form
              className="aa-chat__composer"
              onSubmit={(e) => {
                e.preventDefault();
                ask(draft);
              }}
            >
              <textarea
                ref={inputRef}
                value={draft}
                rows={2}
                maxLength={1500}
                placeholder={t('citychat.placeholder')}
                aria-label={t('citychat.placeholder')}
                disabled={offline}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    ask(draft);
                  }
                }}
              />
              <div className="aa-chat__actions">
                {pending ? (
                  <button type="button" className="aa-btn aa-btn--ghost" onClick={stop}>
                    {t('citychat.stop')}
                  </button>
                ) : (
                  <button type="submit" className="aa-btn aa-btn--solid" disabled={offline || !draft.trim()}>
                    {t('citychat.send')}
                  </button>
                )}
                {messages.length > 0 && !pending && (
                  <button type="button" className="aa-btn aa-btn--ghost" onClick={reset}>
                    {t('citychat.reset')}
                  </button>
                )}
              </div>
            </form>

            <div className="aa-chat__foot">
              <span className={`aa-chat__status aa-chat__status--${service.status}`}>
                {t(`citychat.status.${service.status}`, { provider: service.provider })}
              </span>
              <p className="aa-chat__disclaimer">{t('citychat.disclaimer')}</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/** Which data an answer was computed from, as the tools were called. */
function ToolTrace({ tools, cityName, live = false }) {
  const { t } = useI18n();
  const label = (tool) => {
    const args = tool.args ?? {};
    const bits = [t(`citychat.tools.${tool.name}`)];
    if (args.city) bits.push(cityName(args.city));
    const layer = args.layer ?? args.platform;
    if (layer) bits.push(PLATFORMS_BY_ID[layer]?.name ?? layer);
    if (args.metric) bits.push(args.metric);
    return bits.join(' · ');
  };
  return (
    <div className={`aa-chat__trace${live ? ' aa-chat__trace--live' : ''}`}>
      <span className="aa-chat__label">{t('citychat.consulted')}</span>
      {tools.map((tool, i) => (
        <span key={i} className="aa-chat__tool">
          {label(tool)}
        </span>
      ))}
    </div>
  );
}

/**
 * The model's answer, with the little formatting it is asked to use:
 * paragraphs, "- " lists and **bold**. Built as elements, never as HTML, so
 * nothing the model writes can become markup.
 */
function Answer({ text }) {
  const blocks = String(text ?? '').split(/\n{2,}/);
  return blocks.map((block, i) => {
    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.length && lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l))) {
      return (
        <ul key={i} className="aa-chat__ul">
          {lines.map((l, j) => (
            <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ''))}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i} className="aa-chat__p">
        {lines.map((l, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {inline(l)}
          </Fragment>
        ))}
      </p>
    );
  });
}

function inline(line) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}
