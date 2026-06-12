import React, { useId, useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

interface FormInputProps {
  label: string
  name: string
  type?: React.HTMLInputTypeAttribute
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  error?: string
  touched?: boolean
  required?: boolean
  placeholder?: string
  disabled?: boolean
  autoComplete?: string
  showPasswordToggle?: boolean
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  placeholder,
  disabled,
  autoComplete,
  showPasswordToggle,
}) => {
  const id = useId()
  const errorId = `${id}-error`
  const showError = Boolean(error && touched)
  const [showPassword, setShowPassword] = useState(false)

  const withToggle = showPasswordToggle && type === 'password'
  const effectiveType = withToggle ? (showPassword ? 'text' : 'password') : type

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          name={name}
          type={effectiveType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={showError}
          aria-describedby={showError ? errorId : undefined}
          className={[
            'block w-full rounded-md border-gray-300 shadow-sm sm:text-sm',
            'focus:border-primary-500 focus:ring-primary-500',
            showError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '',
            disabled ? 'cursor-not-allowed bg-gray-50' : '',
            withToggle ? 'pr-10' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        {withToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <FiEyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <FiEye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {showError && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default FormInput
