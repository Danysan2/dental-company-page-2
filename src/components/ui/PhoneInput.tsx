'use client'

import { useState, useEffect } from 'react'

export const SA_COUNTRIES = [
  { code: '54',  flag: '🇦🇷', name: 'Argentina'  },
  { code: '591', flag: '🇧🇴', name: 'Bolivia'    },
  { code: '55',  flag: '🇧🇷', name: 'Brasil'     },
  { code: '56',  flag: '🇨🇱', name: 'Chile'      },
  { code: '57',  flag: '🇨🇴', name: 'Colombia'   },
  { code: '593', flag: '🇪🇨', name: 'Ecuador'    },
  { code: '592', flag: '🇬🇾', name: 'Guyana'     },
  { code: '595', flag: '🇵🇾', name: 'Paraguay'   },
  { code: '51',  flag: '🇵🇪', name: 'Perú'       },
  { code: '597', flag: '🇸🇷', name: 'Surinam'    },
  { code: '598', flag: '🇺🇾', name: 'Uruguay'    },
  { code: '58',  flag: '🇻🇪', name: 'Venezuela'  },
]

// Ordenado por longitud desc para detectar "593" antes de "59"
const SORTED = [...SA_COUNTRIES].sort((a, b) => b.code.length - a.code.length)

/** Separa el número completo (solo dígitos) en {prefix, local} */
export function splitPhone(digits: string): { prefix: string; local: string } {
  for (const c of SORTED) {
    if (digits.startsWith(c.code)) {
      return { prefix: c.code, local: digits.slice(c.code.length) }
    }
  }
  return { prefix: '57', local: digits }
}

/** Devuelve true si el número (con código de país incluido) tiene suficientes dígitos */
export function isPhoneComplete(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 9
}

// ─────────────────────────────────────────────────────────────────────────────

interface PhoneInputProps {
  value: string           // número completo con código de país, solo dígitos, ej: "573001234567"
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  maxLocalLength?: number
  id?: string
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = 'Ej: 3001234567',
  disabled,
  maxLocalLength = 12,
  id,
}: PhoneInputProps) {
  const fullDigits = value.replace(/\D/g, '')
  const detected   = splitPhone(fullDigits)

  const [prefix, setPrefix] = useState(detected.prefix)

  // Sincronizar prefijo si el padre cambia el valor externamente (ej: cargar cliente existente)
  useEffect(() => {
    const d = value.replace(/\D/g, '')
    if (!d) return
    const { prefix: p } = splitPhone(d)
    if (p !== prefix) setPrefix(p)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const localDigits = fullDigits.startsWith(prefix)
    ? fullDigits.slice(prefix.length)
    : fullDigits

  const handlePrefix = (newPrefix: string) => {
    setPrefix(newPrefix)
    onChange(newPrefix + localDigits)
  }

  const handleLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, '')
    onChange(prefix + d)
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
      <select
        value={prefix}
        onChange={e => handlePrefix(e.target.value)}
        disabled={disabled}
        aria-label="Prefijo de país"
        style={{ flex: '0 0 auto', minWidth: '150px', maxWidth: '170px', cursor: 'pointer' }}
      >
        {SA_COUNTRIES.map(c => (
          <option key={c.code} value={c.code}>
            {c.flag}  +{c.code} {c.name}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        value={localDigits}
        onChange={handleLocal}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLocalLength}
        style={{ flex: 1, minWidth: 0 }}
      />
    </div>
  )
}
