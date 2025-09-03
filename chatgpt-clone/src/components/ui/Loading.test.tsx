import { render, screen } from '@testing-library/react'
import Loading from './Loading'

describe('Loading Component', () => {
  describe('when rendered with default props', () => {
    it('should render loading spinner', () => {
      render(<Loading />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should have default accessibility label', () => {
      render(<Loading />)
      expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    })
  })

  describe('when text prop is provided', () => {
    it('should display loading text', () => {
      render(<Loading text="Please wait..." />)
      expect(screen.getByText('Please wait...')).toBeInTheDocument()
    })
  })

  describe('when size prop is provided', () => {
    it('should apply small size styling', () => {
      render(<Loading size="sm" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('w-4', 'h-4')
    })

    it('should apply large size styling', () => {
      render(<Loading size="lg" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('w-8', 'h-8')
    })
  })

  describe('when centered prop is true', () => {
    it('should apply centered styling', () => {
      render(<Loading centered />)
      const container = screen.getByRole('status').parentElement
      expect(container).toHaveClass('flex', 'justify-center', 'items-center')
    })
  })

  describe('when color prop is provided', () => {
    it('should apply custom color', () => {
      render(<Loading color="red" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('text-red-600')
    })
  })
})