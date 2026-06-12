interface ValidationResult {
  valid: boolean
  message?: string
}

export const validateRequired = (value: string): ValidationResult => {
  const valid = value.trim().length > 0
  return { valid, message: valid ? undefined : 'This field is required' }
}

export const validateEmail = (value: string): ValidationResult => {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  return { valid, message: valid ? undefined : 'Enter a valid email address' }
}

export const validatePhone = (value: string): ValidationResult => {
  const trimmed = value.trim()
  if (trimmed.length === 0) return { valid: true }
  const valid = trimmed.length >= 8 && trimmed.length <= 20 && /^\+?[\d\s\-()]+$/.test(trimmed)
  return { valid, message: valid ? undefined : 'Phone must be 8–20 characters' }
}

export const validatePassword = (value: string): ValidationResult => {
  const valid =
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  return {
    valid,
    message: valid
      ? undefined
      : 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  }
}

export const validateMinLength = (value: string, min: number): ValidationResult => {
  const valid = value.trim().length >= min
  return { valid, message: valid ? undefined : `Must be at least ${min} characters` }
}

export const validateMaxLength = (value: string, max: number): ValidationResult => {
  const valid = value.length <= max
  return { valid, message: valid ? undefined : `Must be ${max} characters or fewer` }
}

export const validateConfirmPassword = (password: string, confirm: string): ValidationResult => {
  const valid = password === confirm
  return { valid, message: valid ? undefined : 'Passwords do not match' }
}

/** Accepts any number > 0. Use for price fields where zero is not meaningful. */
export const validatePositiveNumber = (value: string | number): ValidationResult => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  const valid = !isNaN(num) && num > 0
  return { valid, message: valid ? undefined : 'Must be a positive number' }
}

/** Accepts zero and above. Use for stock/quantity fields where zero is a valid state. */
export const validateNonNegativeNumber = (value: string | number): ValidationResult => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  const valid = !isNaN(num) && num >= 0
  return { valid, message: valid ? undefined : 'Must be a non-negative number' }
}
