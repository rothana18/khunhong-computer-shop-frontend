import React, { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from '@/hooks/useForm'
import FormInput from '@/components/common/FormInput'
import Button from '@/components/common/Button'
import Alert from '@/components/common/Alert'
import { validateEmail, validateRequired } from '@/utils/validation'
import { usePageTitle } from '@/hooks/usePageTitle'

interface LoginValues {
  email: string
  password: string
}

const LoginPage: React.FC = () => {
  usePageTitle('Sign In')
  const { login, state, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  useEffect(() => {
    clearError()
  }, [clearError])

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } =
    useForm<LoginValues>({
      initialValues: { email: '', password: '' },
      validate: (vals) => {
        const errs: Record<string, string> = {}
        const emailResult = validateEmail(vals.email)
        if (!emailResult.valid) errs.email = emailResult.message!
        const passResult = validateRequired(vals.password)
        if (!passResult.valid) errs.password = passResult.message!
        return errs
      },
      onSubmit: async (vals) => {
        await login(vals.email, vals.password)
        navigate(from, { replace: true })
      },
    })

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Sign in to your account</h2>
      <Alert type="error" message={state.error} />
      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
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
          label="Password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          touched={touched.password}
          required
          autoComplete="current-password"
          showPasswordToggle
        />
        <Button type="submit" fullWidth isLoading={isSubmitting} loadingLabel="Signing in...">
          Sign in
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link to="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">
          Register
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
