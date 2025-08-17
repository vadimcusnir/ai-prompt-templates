import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/Input';
import { Search, Eye, EyeOff } from 'lucide-react';

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders with label', () => {
    render(<Input label="Email Address" placeholder="Enter email" />);
    
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    
    // Check label association
    const input = screen.getByPlaceholderText('Enter email');
    const label = screen.getByText('Email Address');
    expect(input).toHaveAttribute('id');
    expect(label).toHaveAttribute('for', input.getAttribute('id'));
  });

  it('renders with different input types', () => {
    const { rerender } = render(<Input type="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" placeholder="Password" />);
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" placeholder="Age" />);
    expect(screen.getByPlaceholderText('Age')).toHaveAttribute('type', 'number');
  });

  it('shows error message', () => {
    render(<Input error="This field is required" placeholder="Required field" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-red-600');
    
    const input = screen.getByPlaceholderText('Required field');
    expect(input).toHaveClass('border-red-500');
  });

  it('shows helper text', () => {
    render(<Input helperText="This is helpful information" placeholder="Field with help" />);
    
    expect(screen.getByText('This is helpful information')).toBeInTheDocument();
    expect(screen.getByText('This is helpful information')).toHaveClass('text-gray-500');
  });

  it('does not show helper text when error is present', () => {
    render(
      <Input
        error="This field is required"
        helperText="This should not show"
        placeholder="Field with error"
      />
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.queryByText('This should not show')).not.toBeInTheDocument();
  });

  it('renders with left icon', () => {
    render(<Input leftIcon={<Search data-testid="search-icon" />} placeholder="Search" />);
    
    const searchIcon = screen.getByTestId('search-icon');
    expect(searchIcon).toBeInTheDocument();
    
    const input = screen.getByPlaceholderText('Search');
    expect(input).toHaveClass('pl-10');
  });

  it('renders with right icon', () => {
    render(<Input rightIcon={<Eye data-testid="eye-icon" />} placeholder="Password" />);
    
    const eyeIcon = screen.getByTestId('eye-icon');
    expect(eyeIcon).toBeInTheDocument();
    
    const input = screen.getByPlaceholderText('Password');
    expect(input).toHaveClass('pr-10');
  });

  it('renders with both icons', () => {
    render(
      <Input
        leftIcon={<Search data-testid="search-icon" />}
        rightIcon={<Eye data-testid="eye-icon" />}
        placeholder="Search with icons"
      />
    );
    
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    
    const input = screen.getByPlaceholderText('Search with icons');
    expect(input).toHaveClass('pl-10', 'pr-10');
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} placeholder="Changeable input" />);
    
    const input = screen.getByPlaceholderText('Changeable input');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: 'new value' })
      })
    );
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Ref input" />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className', () => {
    render(<Input className="custom-input-class" placeholder="Custom class" />);
    
    expect(screen.getByPlaceholderText('Custom class')).toHaveClass('custom-input-class');
  });

  it('handles disabled state', () => {
    render(<Input disabled placeholder="Disabled input" />);
    
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed');
  });

  it('handles required state', () => {
    render(<Input required placeholder="Required input" />);
    
    const input = screen.getByPlaceholderText('Required input');
    expect(input).toHaveAttribute('required');
  });

  it('generates unique IDs for multiple inputs', () => {
    render(
      <>
        <Input label="First Input" placeholder="First" />
        <Input label="Second Input" placeholder="Second" />
      </>
    );
    
    const firstInput = screen.getByPlaceholderText('First');
    const secondInput = screen.getByPlaceholderText('Second');
    
    expect(firstInput.getAttribute('id')).not.toBe(secondInput.getAttribute('id'));
  });

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(
      <Input
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Focus blur input"
      />
    );
    
    const input = screen.getByPlaceholderText('Focus blur input');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('maintains accessibility attributes', () => {
    render(
      <Input
        aria-label="Custom input label"
        aria-describedby="description"
        aria-invalid="true"
        data-testid="accessible-input"
        placeholder="Accessible input"
      />
    );
    
    const input = screen.getByTestId('accessible-input');
    expect(input).toHaveAttribute('aria-label', 'Custom input label');
    expect(input).toHaveAttribute('aria-describedby', 'description');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('handles complex icon scenarios', () => {
    const { rerender } = render(
      <Input
        leftIcon={<Search data-testid="left-icon" />}
        placeholder="Left icon only"
      />
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    
    rerender(
      <Input
        rightIcon={<EyeOff data-testid="right-icon" />}
        placeholder="Right icon only"
      />
    );
    
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
});
