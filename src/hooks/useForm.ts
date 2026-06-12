import { useState } from 'react'

// Record<keyof T, unknown> is intentionally looser than Record<string, unknown>.
// The latter requires an explicit index signature on T, which plain interfaces
// like `{ email: string; password: string }` don't have. The mapped-type form
// only requires that T's own keys map to unknown-compatible values, which any
// interface whose values extend `unknown` (i.e. all of them) satisfies.
interface UseFormOptions<T extends Record<keyof T, unknown>> {
  initialValues: T
  validate?: (values: T) => Record<string, string>
  onSubmit: (values: T) => Promise<void>
}

export function useForm<T extends Record<keyof T, unknown>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target
    const value =
      e.target instanceof HTMLInputElement && e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value
    // `name` is a runtime string, not statically `keyof T`, so the spread result
    // can't be inferred as T without an assertion.
    setValues((prev) => ({ ...prev, [name]: value }) as T)
    if (touched[name] && validate) {
      const newErrors = validate({ ...values, [name]: value } as T)
      setErrors((prev) => ({ ...prev, [name]: newErrors[name] ?? '' }))
    }
  }

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    if (validate) {
      const newErrors = validate(values)
      setErrors((prev) => ({ ...prev, [name]: newErrors[name] ?? '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Record<string, boolean>
    )
    setTouched(allTouched)

    const validationErrors = validate ? validate(values) : {}
    setErrors(validationErrors)

    if (Object.values(validationErrors).some(Boolean)) return

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch {
      // onSubmit is responsible for its own error handling (e.g. dispatching to
      // auth state). We catch here only to prevent an unhandled promise rejection
      // from propagating out of handleSubmit.
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }

  const setValue = (name: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }) as T)
  }

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValue,
  }
}
