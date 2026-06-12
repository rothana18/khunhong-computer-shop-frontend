import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormInput from '../FormInput'

const noop = () => {}

describe('FormInput', () => {
  it('renders with label', () => {
    render(<FormInput label="Email" name="email" value="" onChange={noop} />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('does not show error when not touched', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        value=""
        onChange={noop}
        error="Required"
        touched={false}
      />
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows error when touched and error are both set', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        value=""
        onChange={noop}
        error="Required"
        touched={true}
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
  })

  it('sets aria-invalid when error and touched', () => {
    render(
      <FormInput label="Email" name="email" value="" onChange={noop} error="Bad" touched={true} />
    )
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true')
  })

  it('does not set aria-invalid when no error', () => {
    render(<FormInput label="Email" name="email" value="" onChange={noop} />)
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'false')
  })

  it('fires onChange when user types', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FormInput label="Email" name="email" value="" onChange={onChange} />)
    await user.type(screen.getByLabelText(/email/i), 'a')
    expect(onChange).toHaveBeenCalled()
  })

  it('fires onBlur when field loses focus', async () => {
    const user = userEvent.setup()
    const onBlur = vi.fn()
    render(
      <>
        <FormInput label="Email" name="email" value="" onChange={noop} onBlur={onBlur} />
        <button>Other</button>
      </>
    )
    await user.click(screen.getByLabelText(/email/i))
    await user.click(screen.getByRole('button'))
    expect(onBlur).toHaveBeenCalled()
  })
})
