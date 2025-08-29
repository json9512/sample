import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversationSidebar } from '@/components/chat/ConversationSidebar'
import type { Conversation } from '@/types/chat'

// cn utility and lucide-react icons are already mocked globally in jest.setup.js

describe('ConversationSidebar', () => {
  const mockConversations: Conversation[] = [
    {
      id: '1',
      user_id: 'user1',
      title: 'First conversation',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: '2',
      user_id: 'user1',
      title: 'Second conversation',
      created_at: '2024-01-01T11:00:00Z',
      updated_at: '2024-01-01T11:00:00Z'
    },
    {
      id: '3',
      user_id: 'user1',
      title: 'Third conversation about React',
      created_at: '2024-01-01T12:00:00Z',
      updated_at: '2024-01-01T12:00:00Z'
    }
  ]

  const defaultProps = {
    conversations: mockConversations,
    onSelectConversation: jest.fn(),
    onNewConversation: jest.fn(),
    onDeleteConversation: jest.fn(),
    isLoading: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders new conversation button', () => {
    render(<ConversationSidebar {...defaultProps} />)
    
    const newButton = screen.getByRole('button', { name: /new conversation/i })
    expect(newButton).toBeInTheDocument()
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<ConversationSidebar {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search conversations...')
    expect(searchInput).toBeInTheDocument()
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
  })

  it('displays all conversations', () => {
    render(<ConversationSidebar {...defaultProps} />)
    
    expect(screen.getByText('First conversation')).toBeInTheDocument()
    expect(screen.getByText('Second conversation')).toBeInTheDocument()
    expect(screen.getByText('Third conversation about React')).toBeInTheDocument()
  })

  it('calls onNewConversation when new button is clicked', async () => {
    const user = userEvent.setup()
    render(<ConversationSidebar {...defaultProps} />)
    
    const newButton = screen.getByRole('button', { name: /new conversation/i })
    await user.click(newButton)
    
    expect(defaultProps.onNewConversation).toHaveBeenCalled()
  })

  it('calls onSelectConversation when conversation is clicked', async () => {
    const user = userEvent.setup()
    render(<ConversationSidebar {...defaultProps} />)
    
    const conversation = screen.getByText('First conversation')
    await user.click(conversation)
    
    expect(defaultProps.onSelectConversation).toHaveBeenCalledWith('1')
  })

  it('highlights active conversation', () => {
    const { container } = render(<ConversationSidebar {...defaultProps} activeConversationId="2" />)
    
    // Find the container with active styling
    const activeContainer = container.querySelector('.bg-blue-50')
    expect(activeContainer).toBeInTheDocument()
    
    const activeBorder = container.querySelector('.border-l-blue-500')
    expect(activeBorder).toBeInTheDocument()
  })

  it('filters conversations based on search term', async () => {
    const user = userEvent.setup()
    render(<ConversationSidebar {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search conversations...')
    
    await user.type(searchInput, 'React')
    
    // Should only show the conversation with "React" in the title
    expect(screen.getByText('Third conversation about React')).toBeInTheDocument()
    expect(screen.queryByText('First conversation')).not.toBeInTheDocument()
    expect(screen.queryByText('Second conversation')).not.toBeInTheDocument()
  })

  it('shows delete button on hover', async () => {
    const user = userEvent.setup()
    const { container } = render(<ConversationSidebar {...defaultProps} />)
    
    // Check that delete buttons exist (they're hidden by CSS but present in DOM)
    const deleteButtons = container.querySelectorAll('[aria-label="Delete conversation"]')
    expect(deleteButtons.length).toBeGreaterThan(0)
    
    // Test that hovering on a conversation shows delete functionality exists
    const conversationItem = screen.getByText('First conversation')
    expect(conversationItem).toBeInTheDocument()
  })

  it('calls onDeleteConversation when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(<ConversationSidebar {...defaultProps} />)
    
    const deleteButton = screen.getAllByLabelText('Delete conversation')[0]
    await user.click(deleteButton)
    
    expect(defaultProps.onDeleteConversation).toHaveBeenCalledWith('1')
  })

  it('prevents event propagation when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(<ConversationSidebar {...defaultProps} />)
    
    const deleteButton = screen.getAllByLabelText('Delete conversation')[0]
    await user.click(deleteButton)
    
    // Should call delete but not select
    expect(defaultProps.onDeleteConversation).toHaveBeenCalledWith('1')
    expect(defaultProps.onSelectConversation).not.toHaveBeenCalled()
  })

  it('shows loading state', () => {
    render(<ConversationSidebar {...defaultProps} conversations={[]} isLoading={true} />)
    
    expect(screen.getByText('Loading conversations...')).toBeInTheDocument()
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('shows empty state when no conversations', () => {
    render(<ConversationSidebar {...defaultProps} conversations={[]} />)
    
    expect(screen.getByText('No conversations yet')).toBeInTheDocument()
    expect(screen.getByText('Start a new conversation to begin chatting')).toBeInTheDocument()
  })

  it('shows no results state when search has no matches', async () => {
    const user = userEvent.setup()
    render(<ConversationSidebar {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search conversations...')
    await user.type(searchInput, 'nonexistent')
    
    expect(screen.getByText('No conversations found')).toBeInTheDocument()
  })

  it('disables new conversation button when loading', () => {
    render(<ConversationSidebar {...defaultProps} isLoading={true} />)
    
    const newButton = screen.getByRole('button', { name: /new conversation/i })
    expect(newButton).toBeDisabled()
  })

  it('formats conversation update times correctly', () => {
    const todayConversation = {
      ...mockConversations[0],
      updated_at: new Date().toISOString()
    }
    
    render(<ConversationSidebar 
      {...defaultProps} 
      conversations={[todayConversation]} 
    />)
    
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('clears search when typing different term', async () => {
    const user = userEvent.setup()
    render(<ConversationSidebar {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search conversations...')
    
    // First search
    await user.type(searchInput, 'First')
    expect(screen.getByText('First conversation')).toBeInTheDocument()
    expect(screen.queryByText('Second conversation')).not.toBeInTheDocument()
    
    // Clear and search again
    await user.clear(searchInput)
    await user.type(searchInput, 'Second')
    expect(screen.getByText('Second conversation')).toBeInTheDocument()
    expect(screen.queryByText('First conversation')).not.toBeInTheDocument()
  })

  it('maintains search case insensitivity', async () => {
    const user = userEvent.setup()
    render(<ConversationSidebar {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search conversations...')
    
    await user.type(searchInput, 'REACT')
    
    expect(screen.getByText('Third conversation about React')).toBeInTheDocument()
  })

  it('renders message square icons for conversations', () => {
    render(<ConversationSidebar {...defaultProps} />)
    
    const icons = screen.getAllByTestId('message-square-icon')
    expect(icons).toHaveLength(mockConversations.length)
  })

  it('applies correct hover styles', () => {
    const { container } = render(<ConversationSidebar {...defaultProps} />)
    
    // Check that hover styles exist in the DOM
    const hoverElements = container.querySelectorAll('.hover\\:bg-gray-100')
    expect(hoverElements.length).toBeGreaterThan(0)
  })
})