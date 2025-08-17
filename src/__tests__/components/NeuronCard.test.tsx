import { render, screen, fireEvent } from '@testing-library/react';
import { NeuronCard } from '@/components/(public)/NeuronCard';
import { useAuth } from '@/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockNeuron = {
  id: '1',
  slug: 'test-neuron',
  title: 'Test Neuron',
  summary: 'This is a test neuron summary for testing purposes',
  required_tier: 'architect' as const,
  price_cents: 2900,
  category: 'test',
  tags: ['test', 'example', 'ai'],
  depth_score: 7,
  pattern_complexity: 3,
  created_at: '2024-01-01T00:00:00Z'
};

describe('NeuronCard', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      userTier: 'free',
      activePlan: null,
      entitlements: [],
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshUserData: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders neuron information correctly', () => {
    render(<NeuronCard neuron={mockNeuron} />);
    
    expect(screen.getByText('Test Neuron')).toBeInTheDocument();
    expect(screen.getByText('This is a test neuron summary for testing purposes')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('example')).toBeInTheDocument();
    expect(screen.getByText('Arhitect')).toBeInTheDocument();
    expect(screen.getByText('29.00€')).toBeInTheDocument();
  });

  it('shows correct tier badge with proper styling', () => {
    render(<NeuronCard neuron={mockNeuron} />);
    
    const tierBadge = screen.getByText('Arhitect');
    expect(tierBadge).toBeInTheDocument();
    expect(tierBadge).toHaveClass('bg-blue-500');
  });

  it('displays depth score and pattern complexity when available', () => {
    render(<NeuronCard neuron={mockNeuron} />);
    
    expect(screen.getByText('Profunzime: 7/10')).toBeInTheDocument();
    expect(screen.getByText('Complexitate: 3/5')).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    render(<NeuronCard neuron={mockNeuron} />);
    
    // Should display date in Romanian format
    expect(screen.getByText('1 ian. 2024')).toBeInTheDocument();
  });

  it('shows upgrade plan button for inaccessible tier', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userTier: 'free',
      activePlan: null,
      entitlements: [],
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshUserData: jest.fn(),
    });

    render(<NeuronCard neuron={mockNeuron} />);
    
    expect(screen.getByText('Necesită plan Arhitect')).toBeInTheDocument();
    expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
  });

  it('shows preview and full access buttons for accessible tier', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as any,
      userTier: 'architect',
      activePlan: null,
      entitlements: [],
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshUserData: jest.fn(),
    });

    render(<NeuronCard neuron={mockNeuron} />);
    
    expect(screen.getByText('Vezi Preview')).toBeInTheDocument();
    expect(screen.getByText('Acces Complet')).toBeInTheDocument();
  });

  it('shows preview button only for free tier when user is not authenticated', () => {
    render(<NeuronCard neuron={{ ...mockNeuron, required_tier: 'free' }} />);
    
    expect(screen.getByText('Vezi Preview')).toBeInTheDocument();
    expect(screen.queryByText('Acces Complet')).not.toBeInTheDocument();
  });

  it('handles hover state correctly', () => {
    render(<NeuronCard neuron={mockNeuron} />);
    
    const card = screen.getByText('Test Neuron').closest('div');
    expect(card).toBeInTheDocument();
    
    if (card) {
      fireEvent.mouseEnter(card);
      expect(card).toHaveClass('transform -translate-y-1');
      
      fireEvent.mouseLeave(card);
      expect(card).not.toHaveClass('transform -translate-y-1');
    }
  });

  it('displays correct number of tags with overflow indicator', () => {
    render(<NeuronCard neuron={mockNeuron} />);
    
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('example')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument(); // 3 tags total, showing 2 + indicator
  });

  it('shows free price correctly', () => {
    render(<NeuronCard neuron={{ ...mockNeuron, price_cents: 0 }} />);
    
    expect(screen.getByText('Gratuit')).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalNeuron = {
      ...mockNeuron,
      depth_score: undefined,
      pattern_complexity: undefined,
    };
    
    render(<NeuronCard neuron={minimalNeuron} />);
    
    expect(screen.queryByText(/Profunzime:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Complexitate:/)).not.toBeInTheDocument();
  });

  it('applies correct styling for different tiers', () => {
    const { rerender } = render(<NeuronCard neuron={mockNeuron} />);
    
    // Architect tier
    expect(screen.getByText('Arhitect')).toHaveClass('bg-blue-500');
    
    // Elite tier
    rerender(<NeuronCard neuron={{ ...mockNeuron, required_tier: 'elite' }} />);
    expect(screen.getByText('Elite')).toHaveClass('bg-yellow-500');
    
    // Initiate tier
    rerender(<NeuronCard neuron={{ ...mockNeuron, required_tier: 'initiate' }} />);
    expect(screen.getByText('Inițiat')).toHaveClass('bg-purple-500');
    
    // Free tier
    rerender(<NeuronCard neuron={{ ...mockNeuron, required_tier: 'free' }} />);
    expect(screen.getByText('Free')).toHaveClass('bg-green-500');
  });

  it('can hide actions when showActions is false', () => {
    render(<NeuronCard neuron={mockNeuron} showActions={false} />);
    
    expect(screen.queryByText('Vezi Preview')).not.toBeInTheDocument();
    expect(screen.queryByText('Upgrade Plan')).not.toBeInTheDocument();
  });
});
