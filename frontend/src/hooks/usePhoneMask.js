/**
 * Formata string para (XX) XXXXX-XXXX ou (XX) XXXX-XXXX conforme digita
 */
export function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/**
 * Handler para usar em onChange de inputs de telefone.
 * Uso: <input onChange={handlePhoneChange(setValue, 'phone')} />
 */
export function handlePhoneChange(onChange) {
  return (e) => {
    const formatted = formatPhone(e.target.value)
    e.target.value = formatted
    onChange(formatted)
  }
}
