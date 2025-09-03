import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Input from './Input'

describe('Input Component', () => {
  describe('when rendered with default props', () => {
    it('should render input element', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should have default styling', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-gray-300', 'rounded-md')
    })
  })

  describe('when placeholder prop is provided', () => {
    it('should display placeholder text', () => {
      render(<Input placeholder="Enter text here" />)
      expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument()
    })
  })

  describe('when value and onChange props are provided', () => {
    it('should display value and update on change', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()
      
      render(<Input value="test" onChange={handleChange} />)
      const input = screen.getByRole('textbox') as HTMLInputElement
      
      expect(input.value).toBe('test')
      
      await user.clear(input)
      await user.type(input, 'new value')
      
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('when disabled prop is true', () => {
    it('should disable the input', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('should apply disabled styling', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('opacity-50', 'cursor-not-allowed')
    })
  })

  describe('when error prop is provided', () => {
    it('should apply error styling', () => {
      render(<Input error="This field is required" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-red-500')
    })

    it('should display error message', () => {
      render(<Input error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })
  })

  describe('when type prop is provided', () => {
    it('should set input type to password', () => {
      render(<Input type="password" data-testid="password-input" />)
      const input = screen.getByTestId('password-input')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('should set input type to email', () => {
      render(<Input type="email" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })
  })

  describe('when onKeyDown prop is provided', () => {
    it('should call onKeyDown when Enter is pressed', async () => {
      const user = userEvent.setup()
      const handleKeyDown = jest.fn()
      
      render(<Input onKeyDown={handleKeyDown} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, '{Enter}')
      
      expect(handleKeyDown).toHaveBeenCalled()
    })
  })

  describe('when fullWidth prop is true', () => {
    it('should apply full width styling', () => {
      render(<Input fullWidth />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('w-full')
    })
  })
})