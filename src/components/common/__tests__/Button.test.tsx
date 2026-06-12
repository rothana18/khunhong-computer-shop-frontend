import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('shows loading spinner and label when isLoading', () => {
    render(
      <Button isLoading loadingLabel="Saving...">
        Save
      </Button>
    )
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows children as loading label when no loadingLabel', () => {
    render(<Button isLoading>Save</Button>)
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Click</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when loading', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button isLoading onClick={onClick}>
        Save
      </Button>
    )
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
