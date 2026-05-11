'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useReveal } from '@/hooks/useReveal'
import './About.css'

const WA_PHONE   = '573000000000'
const WA_MESSAGE = encodeURIComponent('Hola 👋 Me comunico desde la página web de Dental Company. Me gustaría agendar una cita. ¿Podrían indicarme disponibilidad? 🦷')

const valores = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
    title: 'Calidez humana',
    desc: 'Cada paciente es recibido con empatía y un trato genuino. Tu bienestar emocional es tan importante como tu salud oral.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Excelencia clínica',
    desc: 'Protocolos actualizados, materiales de primera calidad y formación continua en las técnicas más avanzadas de odontología.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    ),
    title: 'Transparencia',
    desc: 'Te explicamos cada paso del tratamiento con claridad para que puedas tomar decisiones informadas sobre tu salud.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Innovación',
    desc: 'Adoptamos las últimas tecnologías en diagnóstico y tratamiento para resultados más precisos, cómodos y duraderos.',
  },
]

const logros = [
  { num: '10+', lbl: 'Años de experiencia' },
  { num: '800+', lbl: 'Pacientes atendidos' },
  { num: '98%', lbl: 'Satisfacción' },
  { num: '100%', lbl: 'Compromiso' },
]

export default function About() {
  useReveal()

  useEffect(() => {
    if (document.querySelector('script[src*="elfsightcdn.com/platform.js"]')) return
    const script = document.createElement('script')
    script.src = 'https://elfsightcdn.com/platform.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  return (
    <main className="about">

      {/* ── HERO ── */}
      <section className="about-hero">
        <div className="about-hero__grain" aria-hidden="true" />
        <div className="container about-hero__inner">
          <p className="eyebrow reveal" style={{ color: 'var(--c-accent-lt)' }}>Sobre Nosotros</p>
          <h1 className="about-hero__title reveal d1">
            Donde las sonrisas<br />
            <em>se hacen realidad</em>
          </h1>
          <p className="about-hero__sub reveal d2">
            Somos una clínica odontológica especializada en Rehabilitación Oral y Estética Dental, ubicada en Arauca. Transformamos sonrisas con profesionalismo, tecnología y sobre todo, con un trato genuinamente humano.
          </p>
          <div className="about-hero__stats reveal d3">
            {logros.map((s, i) => (
              <div key={i} className="about-hero__stat">
                <span className="about-hero__stat-val">{s.num}</span>
                <span className="about-hero__stat-lbl">{s.lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOCTORA ── */}
      <section className="doctor-section">
        <div className="container doctor-section__inner">
          <div className="doctor-card reveal-left">
            <div className="doctor-card__avatar">
              <img src="/doctora-cindy.png" alt="Dra. Cindy Ortiz" className="doctor-card__photo" />
              <div className="doctor-card__avatar-ring" />
            </div>
            <div className="doctor-card__badge">Especialista</div>
          </div>
          <div className="doctor-info reveal-right">
            <p className="eyebrow">El Equipo</p>
            <h2 className="doctor-info__name">Dra. Cindy Ortiz</h2>
            <span className="doctor-info__title">Especialista en Rehabilitación Oral y Estética Dental 🦷</span>
            <p className="doctor-info__bio">
              Con más de 10 años de experiencia transformando sonrisas en la región de Arauca, la Dra. Cindy Ortiz es reconocida por su enfoque artístico y técnico en cada tratamiento. Especializada en Rehabilitación Oral y Estética Dental, combina el conocimiento científico con una mirada estética única para crear resultados naturales e impactantes.
            </p>
            <p className="doctor-info__bio">
              Su misión es clara: que cada paciente salga de la clínica no solo con una sonrisa más bella, sino con mayor confianza y bienestar. Un trato cercano, honesto y profesional en cada consulta.
            </p>
            <div className="doctor-info__tags">
              {['Rehabilitación Oral', 'Estética Dental', 'Diseño de Sonrisa', 'Carillas de Porcelana', 'Implantes'].map(t => (
                <span key={t} className="doctor-tag">{t}</span>
              ))}
            </div>
            <Link href="/citas" className="btn btn-primary" style={{ marginTop: '2rem', alignSelf: 'flex-start' }}>
              Agendar con la doctora →
            </Link>
          </div>
        </div>
      </section>

      {/* ── MISIÓN / VISIÓN / VALORES ── */}
      <section className="mv">
        <div className="container">
          <div className="mv__header reveal">
            <p className="eyebrow">Nuestra Esencia</p>
            <h2 className="section-title">Lo que nos define</h2>
          </div>
          <div className="mv__grid">
            <div className="mv__card reveal d1">
              <div className="mv__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                  <line x1="12" y1="2" x2="12" y2="5"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                  <line x1="2" y1="12" x2="5" y2="12"/>
                  <line x1="19" y1="12" x2="22" y2="12"/>
                </svg>
              </div>
              <h3>Misión</h3>
              <p>Proporcionar atención odontológica integral y de alta calidad, con un enfoque humano y preventivo, que mejore la salud bucal y la calidad de vida de cada uno de nuestros pacientes en Arauca.</p>
            </div>
            <div className="mv__card reveal d2">
              <div className="mv__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <h3>Visión</h3>
              <p>Ser la clínica odontológica de referencia en Arauca y la región, reconocida por excelencia clínica, innovación tecnológica y el compromiso genuino con el bienestar de cada paciente.</p>
            </div>
            <div className="mv__card reveal d3">
              <div className="mv__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <h3>Valores</h3>
              <p>Integridad, calidez, excelencia y actualización continua son los pilares que guían cada decisión clínica y cada interacción con nuestros pacientes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PILARES / VALORES ── */}
      <section className="values">
        <div className="container">
          <div className="values__header reveal">
            <p className="eyebrow">Nuestros Pilares</p>
            <h2 className="section-title">Por qué elegirnos</h2>
          </div>
          <div className="values__grid">
            {valores.map((v, i) => (
              <div key={i} className={`value-card reveal d${i + 1}`}>
                <div className="value-card__icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UBICACIÓN ── */}
      <section className="location-section">
        <div className="container">
          <div className="location-section__header reveal">
            <p className="eyebrow">Visítanos</p>
            <h2 className="section-title">¿Dónde estamos?</h2>
            <p className="location-section__sub">
              Estamos ubicados en el corazón de Arauca, listos para recibirte.<br />
              <strong>Calle 19 #22-12 Barrio La Esperanza, Arauca 810001</strong>
            </p>
          </div>
          <div className="location-section__content reveal d2">
            <div className="location-map">
              <iframe
                title="Ubicación Dental Company"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3968.456987654321!2d-71.18!3d6.89!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e2c3d1d1d1d1d1d%3A0x1d1d1d1d1d1d1d1d!2sCalle%2019%20%2322-12%2C%20Barrio%20La%20Esperanza%2C%20Arauca!5e0!3m2!1ses!2sco!4v1234567890"
                width="100%"
                height="380"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="location-info">
              <div className="location-info__item">
                <div className="location-info__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div>
                  <strong>Dirección</strong>
                  <span>Calle 19 #22-12<br />Barrio La Esperanza<br />Arauca, Arauca 810001</span>
                </div>
              </div>
              <div className="location-info__item">
                <div className="location-info__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div>
                  <strong>Horarios</strong>
                  <span>Lunes – Viernes: 8:00 – 18:00<br />Sábados: 8:00 – 12:00</span>
                </div>
              </div>
              <div className="location-info__item">
                <div className="location-info__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 01.01 2.2 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                </div>
                <div>
                  <strong>WhatsApp</strong>
                  <span>
                    <a href={`https://wa.me/${WA_PHONE}?text=${WA_MESSAGE}`} target="_blank" rel="noreferrer" className="location-wa-link">
                      +57 300 000 0000 →
                    </a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INSTAGRAM FEED ── */}
      <section className="about-instagram">
        <div className="container" style={{ maxWidth: '1600px' }}>
          <p className="eyebrow" style={{ textAlign: 'center' }}>Redes Sociales</p>
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Síguenos en Instagram</h2>
          <a
            href="https://www.instagram.com/dentalcompany.co"
            target="_blank"
            rel="noreferrer"
            className="about-instagram__handle"
          >
            @dentalcompany.co
          </a>
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div
              className="elfsight-app-101f3bc2-f6fb-496d-a4e7-6f2cf6a81223"
              data-elfsight-app-lazy
            />
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="about-cta">
        <div className="about-cta__grain" aria-hidden="true" />
        <div className="container about-cta__inner reveal">
          <p className="eyebrow" style={{ color: 'var(--c-accent-lt)' }}>¿Listo para comenzar?</p>
          <h2>Agenda tu cita hoy</h2>
          <p>Descubre por qué cientos de pacientes en Arauca confían en nosotros para transformar su sonrisa.</p>
          <div className="about-cta__btns">
            <Link href="/citas" className="btn btn-primary">Reservar en línea</Link>
            <a
              href={`https://wa.me/${WA_PHONE}?text=${WA_MESSAGE}`}
              target="_blank" rel="noreferrer"
              className="btn about-cta__wa"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </section>

    </main>
  )
}
