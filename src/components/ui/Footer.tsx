import Image from 'next/image'
import Link from 'next/link'
import './Footer.css'

const WA_PHONE   = '573216252325'
const WA_MESSAGE = encodeURIComponent('Hola 👋 Me comunico desde la página web de Dental Company. Me gustaría agendar una cita. ¿Podrían indicarme disponibilidad? 🦷')

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Link href="/" className="footer__logo">
            <Image src="/logo-png.png" alt="Dental Company" width={140} height={40} className="footer__logo-img" style={{ width: 'auto', height: '36px', objectFit: 'contain' }} />
            <span className="footer__logo-text">
              Dental <em>Company</em>
            </span>
          </Link>
          <p className="footer__tagline">
            Donde las sonrisas se hacen realidad ✨<br />
            Especialistas en Rehabilitación Oral y Estética Dental.
          </p>
          <div className="footer__socials">
            <a href="https://www.instagram.com/dentalcompany.co" target="_blank" rel="noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
              </svg>
            </a>
            <a href={`https://wa.me/${WA_PHONE}?text=${WA_MESSAGE}`} target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="footer__col">
          <h4>Navegación</h4>
          <ul>
            <li><Link href="/">Inicio</Link></li>
            <li><Link href="/sobre-nosotros">Sobre Nosotros</Link></li>
            <li><Link href="/citas">Agendar Cita</Link></li>
            <li><Link href="/login">Área de Staff</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4>Servicios</h4>
          <ul>
            <li>Limpieza y Profilaxis</li>
            <li>Blanqueamiento Dental</li>
            <li>Ortodoncia</li>
            <li>Diseño de Sonrisa</li>
            <li>Implantes Dentales</li>
          </ul>
        </div>

        <div className="footer__col">
          <h4>Contacto</h4>
          <ul className="footer__contact">
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 01.01 2.2 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              +57 321 6252325
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              dentalcompany.calendar@gmail.com
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Calle 19 #22-12 Barrio La Esperanza,<br />Arauca, Arauca 810001
            </li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <p>© {year} Dental Company — Dra. Cindy Ortiz. Todos los derechos reservados.</p>
          <p>Diseñado con ♥ para el bienestar de tu sonrisa.</p>
        </div>
      </div>
    </footer>
  )
}
