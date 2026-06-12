import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from '@/hooks/useForm'
import FormInput from '@/components/common/FormInput'
import Button from '@/components/common/Button'
import Alert from '@/components/common/Alert'
import {
  validateConfirmPassword,
  validateEmail,
  validateMaxLength,
  validatePassword,
  validatePhone,
  validateRequired,
} from '@/utils/validation'
import { usePageTitle } from '@/hooks/usePageTitle'

interface RegisterValues {
  first_name: string
  last_name: string
  email: string
  phone: string
  password: string
  password_confirmation: string
}

const RegisterPage: React.FC = () => {
  usePageTitle('Register')
  const { register, state, clearError } = useAuth()

  useEffect(() => {
    clearError()
  }, [clearError])
  const navigate = useNavigate()

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } =
    useForm<RegisterValues>({
      initialValues: {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
      },
      validate: (vals) => {
        const errs: Record<string, string> = {}

        const fn = validateRequired(vals.first_name)
        if (!fn.valid) errs.first_name = fn.message!
        else {
          const fnMax = validateMaxLength(vals.first_name, 50)
          if (!fnMax.valid) errs.first_name = fnMax.message!
        }

        const ln = validateRequired(vals.last_name)
        if (!ln.valid) errs.last_name = ln.message!
        else {
          const lnMax = validateMaxLength(vals.last_name, 50)
          if (!lnMax.valid) errs.last_name = lnMax.message!
        }

        const em = validateEmail(vals.email)
        if (!em.valid) errs.email = em.message!

        const ph = validatePhone(vals.phone)
        if (!ph.valid) errs.phone = ph.message!

        const pw = validatePassword(vals.password)
        if (!pw.valid) errs.password = pw.message!

        const cp = validateConfirmPassword(vals.password, vals.password_confirmation)
        if (!cp.valid) errs.password_confirmation = cp.message!

        return errs
      },
      onSubmit: async (vals) => {
        await register({
          first_name: vals.first_name,
          last_name: vals.last_name,
          email: vals.email,
          phone: vals.phone || undefined,
          password: vals.password,
          password_confirmation: vals.password_confirmation,
        })
        navigate('/', { replace: true })
      },
    })

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Create your account</h2>
      <Alert type="error" message={state.error} />
      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="First name"
            name="first_name"
            value={values.first_name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.first_name}
            touched={touched.first_name}
            required
            autoComplete="given-name"
          />
          <FormInput
            label="Last name"
            name="last_name"
            value={values.last_name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.last_name}
            touched={touched.last_name}
            required
            autoComplete="family-name"
          />
        </div>
        <FormInput
          label="Email address"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          touched={touched.email}
          required
          autoComplete="email"
        />
        <FormInput
          label="Phone (optional)"
          name="phone"
          type="tel"
          value={values.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.phone}
          touched={touched.phone}
          autoComplete="tel"
        />
        <FormInput
          label="Password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          touched={touched.password}
          required
          autoComplete="new-password"
          showPasswordToggle
        />
        <FormInput
          label="Confirm password"
          name="password_confirmation"
          type="password"
          value={values.password_confirmation}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password_confirmation}
          touched={touched.password_confirmation}
          required
          autoComplete="new-password"
          showPasswordToggle
        />
        <Button type="submit" fullWidth isLoading={isSubmitting} loadingLabel="Creating account...">
          Create account
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
