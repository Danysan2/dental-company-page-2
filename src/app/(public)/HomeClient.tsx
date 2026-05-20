'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useReveal } from '@/hooks/useReveal'
import './Home.css'

const WA_PHONE = '573216252325'
const WA_MESSAGE = encodeURIComponent('Hola 👋 Me comunico desde la página web de Dental Company. Me gustaría agendar una cita. ¿Podrían indicarme disponibilidad? 🦷')

const services = [
  {
    num: '01', tag: 'Estética',
    title: 'Rehabilitación Oral y Estética Dental',
    desc: 'Restauramos y diseñamos sonrisas con materiales de última generación, logrando resultados naturales, armónicos y duraderos.',
    subs: ['Diseños de sonrisa en cerámica: carillas cerámicas y lentes cerámicos', 'Diseños de sonrisa en resina de alta estética', 'Carillas directas e indirectas', 'Incrustaciones (inlays/onlays)', 'Coronas totalmente cerámicas y metal-cerámica', 'Prótesis fijas', 'Prótesis sobre implantes', 'Prótesis totales', 'Prótesis removibles'],
  },
  {
    num: '02', tag: 'ATM',
    title: 'Manejo de la Articulación Temporomandibular (ATM)',
    desc: 'Enfoque especializado en el diagnóstico y tratamiento del dolor orofacial.',
    subs: ['Trastornos de la ATM', 'Placas neuromiorelajantes de alta precisión'],
  },
  {
    num: '03', tag: 'Salud',
    title: 'Endodoncia',
    desc: 'Tratamientos enfocados en la conservación dental y alivio del dolor.',
    subs: ['Endodoncia en dientes unirradiculares y multirradiculares', 'Retratamientos endodónticos', 'Manejo de infecciones pulpares'],
  },
  {
    num: '04', tag: 'Encías',
    title: 'Periodoncia',
    desc: 'Salud y mantenimiento de los tejidos de soporte dental.',
    subs: ['Tratamiento de enfermedad periodontal (gingivitis y periodontitis)', 'Frenilectomías', 'Terapias de mantenimiento periodontal'],
  },
  {
    num: '05', tag: 'Estética',
    title: 'Ortodoncia',
    desc: 'Brackets, alineadores y aparatología fija o removible para una sonrisa bien alineada a cualquier edad.',
    subs: ['Ortodoncia convencional', 'Ortodoncia de autoligado', 'Ortodoncia estética (brackets de zafiro)', 'Ortodoncia invisible (alineadores transparentes)'],
  },
  {
    num: '06', tag: 'General',
    title: 'Odontología General',
    desc: 'Prevención y restauración con enfoque estético.',
    subs: ['Restauraciones en resina de alta estética', 'Reemplazo de amalgamas por materiales estéticos', 'Tratamientos preventivos y de mantenimiento'],
  },
]

const testimonials = [
  {
    front: { quote: 'La atención es increíble. Desde que entré me sentí en buenas manos. Mi sonrisa cambió completamente.', name: 'María F. R.', since: '2022' },
    back: { quote: 'Me hicieron el diseño de sonrisa y quedé sin palabras. Profesionalismo y calidez al mismo nivel.', name: 'Daniela M.', since: '2024' },
  },
  {
    front: { quote: 'El proceso de blanqueamiento fue indoloro y el resultado superó mis expectativas. Totalmente recomendado.', name: 'Carlos A.', since: '2023' },
    back: { quote: 'El equipo explica todo con paciencia. Salí con la confianza que necesitaba para sonreír sin pena.', name: 'Andrés P.', since: '2023' },
  },
  {
    front: { quote: 'Por fin un odontólogo que explica cada paso. Me dan confianza y eso vale mucho.', name: 'Valentina S.', since: '2021' },
    back: { quote: 'Los implantes quedaron perfectos. Tardé poco en adaptarme y la atención post-tratamiento fue excelente.', name: 'Jorge L.', since: '2022' },
  },
]

const marqueeItems = [
  'Estética Dental', '✦', 'Ortodoncia', '✦', 'Implantes', '✦', 'Blanqueamiento', '✦',
  'Diseño de Sonrisa', '✦', 'Odontopediatría', '✦', 'Radiografía Digital', '✦',
  'Estética Dental', '✦', 'Ortodoncia', '✦', 'Implantes', '✦', 'Blanqueamiento', '✦',
  'Diseño de Sonrisa', '✦', 'Odontopediatría', '✦', 'Radiografía Digital', '✦',
]

function TestiCard({ t, delay }: { t: typeof testimonials[0]; delay: number }) {
  return (
    <div className={`testi-flip reveal d${delay}`}>
      <div className="testi-flip__inner">
        <div className="testi-flip__face testi-flip__face--front">
          <div className="testi-card">
            <div className="testi-card__stars">
              {[1, 2, 3, 4, 5].map(s => <span key={s} className="testi-star">★</span>)}
            </div>
            <blockquote>"{t.front.quote}"</blockquote>
            <footer>
              <strong>{t.front.name}</strong>
              <span>Paciente desde {t.front.since}</span>
            </footer>
            <span className="testi-flip__hint">Pasa el cursor →</span>
          </div>
        </div>
        <div className="testi-flip__face testi-flip__face--back">
          <div className="testi-card">
            <div className="testi-card__stars">
              {[1, 2, 3, 4, 5].map(s => <span key={s} className="testi-star">★</span>)}
            </div>
            <blockquote>"{t.back.quote}"</blockquote>
            <footer>
              <strong>{t.back.name}</strong>
              <span>Paciente desde {t.back.since}</span>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [activeService, setActiveService] = useState<number | null>(null)

  useReveal()

  return (
    <main className="home">
      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero__grain" aria-hidden="true" />
        <div className="hero__deco-letter" aria-hidden="true">O</div>

        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow hero__eyebrow">Clínica Odontológica</p>

            <h1 className="hero__title">
              <span className="hero__title-line">Tu</span>
              <span className="hero__title-line hero__title-line--em">Sonrisa</span>
              <span className="hero__title-line hero__title-line--thin">Merece lo mejor</span>
            </h1>

            <p className="hero__sub">
              Cuidado dental de excelencia con calidez humana, tecnología de punta y un equipo dedicado a transformar tu salud oral en una experiencia memorable.
            </p>

            <div className="hero__actions">
              <Link href="/citas" className="btn btn-primary hero__cta">
                Agendar cita
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
              <Link href="/sobre-nosotros" className="btn btn-ghost hero__link">
                Conoce el equipo
              </Link>
            </div>

            <div className="hero__stats">
              {[['10+', 'años'], ['800+', 'pacientes'], ['98%', 'satisfacción']].map(([v, l]) => (
                <div key={l} className="hero__stat">
                  <span className="hero__stat-val">{v}</span>
                  <span className="hero__stat-lbl">{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero__panel">
            <div className="hero__panel-bg" aria-hidden="true" />
            <img
              src="/IMAGEN HERO.png"
              alt="Dra. Cindy Ortiz"
              className="hero__doctor"
            />
            <div className="hero__card">
              <span className="hero__card-badge">Reserva tu espacio</span>
              <p className="hero__card-title">¿Cuándo quieres venir?</p>
              <ul className="hero__card-list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Lun – Vie &nbsp;<strong>8:00 – 18:00</strong>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  Sáb &nbsp;<strong>8:00 – 12:00</strong>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 01.01 2.2 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                  +57 3216252325
                </li>
              </ul>
              <Link href="/citas" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}>
                Reservar ahora →
              </Link>
            </div>

            <div className="hero__blob hero__blob--a" aria-hidden="true" />
            <div className="hero__blob hero__blob--b" aria-hidden="true" />
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════
          MARQUEE TICKER
      ══════════════════════════════════════════ */}
      <div className="marquee-strip" aria-hidden="true">
        <div className="marquee-track">
          {marqueeItems.map((item, i) => (
            <span key={i} className="marquee-item">{item}</span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SERVICES
      ══════════════════════════════════════════ */}
      <section className="services" id="servicios">
        <div className="container">
          <div className="services__header">
            <div className="reveal">
              <p className="eyebrow">Nuestros Servicios</p>
              <h2 className="services__title">
                Soluciones completas<br />
                <em>para tu sonrisa</em>
              </h2>
            </div>
            <p className="services__intro reveal d2">
              Tratamientos personalizados con los mejores materiales y la tecnología más avanzada del mercado.
            </p>
          </div>

          <div className="services__grid">
            {services.map((s, i) => {
              const isOpen = activeService === i
              return (
                <button
                  type="button"
                  key={s.title}
                  className={`svc-card reveal d${i + 1}${isOpen ? ' svc-card--open' : ''}`}
                  onClick={() => setActiveService(current => current === i ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`svc-subcats-${i}`}
                >
                  <div className="svc-card__num">{s.num}</div>
                  <div className="svc-card__body">
                    <span className="svc-card__tag">{s.tag}</span>
                    <h3 className="svc-card__title">{s.title}</h3>
                    <p className="svc-card__desc">{s.desc}</p>
                    <div id={`svc-subcats-${i}`} className="svc-card__subcats" aria-hidden={!isOpen}>
                      <span className="svc-card__subcats-title">Subcategorías</span>
                      <ul>
                        {s.subs.map(sub => <li key={sub}>{sub}</li>)}
                      </ul>
                    </div>
                  </div>
                  <span className="svc-card__arrow" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DIFERENCIA
      ══════════════════════════════════════════ */}
      <section className="difference">
        <div className="difference__grain" aria-hidden="true" />
        <div className="container difference__inner">
          <div className="difference__left reveal-left">
            <p className="eyebrow" style={{ color: 'var(--c-accent-lt)' }}>¿Por qué elegirnos?</p>
            <h2 className="difference__title">
              Ciencia con<br />
              <em>alma de artesano</em>
            </h2>
            <p className="difference__text">
              Combinamos la precisión de la odontología digital con la calidez de un trato genuinamente humano. Cada tratamiento es diseñado a tu medida.
            </p>
            <ul className="difference__list">
              {[
                'Sin lista de espera — citas programadas',
                'Equipo con formación continua',
                'Materiales biocompatibles premium',
                'Tecnología de diagnóstico 3D',
              ].map((f, i) => (
                <li key={i}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/sobre-nosotros" className="btn btn-outline difference__btn" style={{ borderColor: 'var(--c-warm-1)', color: 'var(--c-warm-1)', marginTop: '2.5rem' }}>
              Conoce más sobre nosotros
            </Link>
          </div>

          <div className="difference__right reveal-right">
            <div className="difference__big-num">10<span>+</span></div>
            <p className="difference__big-lbl">años transformando<br />sonrisas en Colombia</p>
            <div className="difference__pills">
              {['Biocompatible', 'Digital 3D', 'Sin dolor', 'Personalizado'].map(p => (
                <span key={p} className="difference__pill">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PROCESO
      ══════════════════════════════════════════ */}
      <section className="process">
        <div className="container">
          <div className="process__header reveal">
            <p className="eyebrow">Cómo funciona</p>
            <h2 className="process__title">Tu camino hacia<br /><em>la sonrisa ideal</em></h2>
          </div>
          <div className="process__steps">
            {[
              { n: '01', title: 'Agenda tu cita', desc: 'Elige servicio, fecha y hora desde nuestra plataforma en minutos.' },
              { n: '02', title: 'Consulta inicial', desc: 'Evaluamos tu salud oral y diseñamos un plan personalizado.' },
              { n: '03', title: 'Tratamiento', desc: 'Ejecutamos con la más alta tecnología y total cuidado.' },
              { n: '04', title: 'Seguimiento', desc: 'Te acompañamos después para garantizar resultados duraderos.' },
            ].map((s, i) => (
              <div key={i} className={`process__step reveal d${i + 1}`}>
                <div className="process__step-num">{s.n}</div>
                <div className="process__step-connector" aria-hidden="true" />
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALES
      ══════════════════════════════════════════ */}
      <section className="testimonials">
        <div className="testimonials__bg-word" aria-hidden="true">Sonrisas</div>
        <div className="container">
          <div className="testimonials__header reveal">
            <p className="eyebrow">Testimonios</p>
            <h2 className="testimonials__title">Lo que dicen<br /><em>nuestros pacientes</em></h2>
          </div>
          <div className="testimonials__grid">
            {testimonials.map((t, i) => (
              <TestiCard key={i} t={t} delay={i + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════ */}
      <section className="cta-final">
        <div className="cta-final__grain" aria-hidden="true" />
        <div className="cta-final__deco" aria-hidden="true">✦</div>
        <div className="container cta-final__inner">
          <div className="reveal">
            <p className="eyebrow" style={{ color: 'var(--c-accent-lt)' }}>¿Listo para comenzar?</p>
            <h2 className="cta-final__title">
              Agenda hoy y<br />
              <em>transforma tu sonrisa</em>
            </h2>
            <p className="cta-final__sub">
              Tu primera consulta es personalizada. Reserva en línea en menos de 2 minutos o escríbenos por WhatsApp.
            </p>
            <div className="cta-final__btns">
              <Link href="/citas" className="btn btn-primary cta-final__btn">
                Reservar en línea
              </Link>
              <a href={`https://wa.me/${WA_PHONE}?text=${WA_MESSAGE}`} target="_blank" rel="noreferrer" className="btn cta-final__wa">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
