import { renderHook, act } from '@testing-library/react'
import { useForm } from '../useForm'

describe('useForm', () => {
  it('initialises with provided values', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: { name: 'test' }, onSubmit: async () => {} })
    )
    expect(result.current.values.name).toBe('test')
  })

  it('updates value on handleChange', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: { name: '' }, onSubmit: async () => {} })
    )
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'Jane' },
      } as React.ChangeEvent<HTMLInputElement>)
    })
    expect(result.current.values.name).toBe('Jane')
  })

  it('marks field as touched on handleBlur', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: { email: '' }, onSubmit: async () => {} })
    )
    expect(result.current.touched.email).toBeFalsy()
    act(() => {
      result.current.handleBlur({
        target: { name: 'email' },
      } as React.FocusEvent<HTMLInputElement>)
    })
    expect(result.current.touched.email).toBe(true)
  })

  it('runs validation on blur and sets errors', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '' },
        validate: (v) => (v.email ? ({} as Record<string, string>) : { email: 'Required' }),
        onSubmit: async () => {},
      })
    )
    act(() => {
      result.current.handleBlur({ target: { name: 'email' } } as React.FocusEvent<HTMLInputElement>)
    })
    expect(result.current.errors.email).toBe('Required')
  })

  it('marks all fields touched and shows errors on submit', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: '' },
        validate: (v) => (v.name ? ({} as Record<string, string>) : { name: 'Required' }),
        onSubmit,
      })
    )
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: () => {},
      } as React.FormEvent)
    })
    expect(result.current.touched.name).toBe(true)
    expect(result.current.errors.name).toBe('Required')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit when validation passes', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: 'Jane' },
        validate: (v) => (v.name ? ({} as Record<string, string>) : { name: 'Required' }),
        onSubmit,
      })
    )
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent)
    })
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Jane' })
  })

  it('resets to initial values', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: { name: '' }, onSubmit: async () => {} })
    )
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'Jane' },
      } as React.ChangeEvent<HTMLInputElement>)
    })
    expect(result.current.values.name).toBe('Jane')
    act(() => {
      result.current.reset()
    })
    expect(result.current.values.name).toBe('')
    expect(result.current.touched).toEqual({})
    expect(result.current.errors).toEqual({})
  })
})
