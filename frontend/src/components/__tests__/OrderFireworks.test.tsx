import { act, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import OrderFireworks from '../OrderFireworks';
import fs from 'fs';
import path from 'path';

describe('OrderFireworks', () => {
  test('shows a big animated pet-family celebration when an order completes', () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
    render(<OrderFireworks active />);
    expect(screen.getByText("It's done")).toBeInTheDocument();
    expect(screen.getByText('Your order is placed')).toBeInTheDocument();
    expect(screen.getByText('Your pet family is celebrating with you.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Celebrating pet family' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('stays hidden until an order actually completes', () => {
    const { container } = render(<OrderFireworks active={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('stays on screen past the first couple of seconds', () => {
    vi.useFakeTimers();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
    render(<OrderFireworks active />);
    expect(screen.getByRole('img', { name: 'Celebrating pet family' })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.getByRole('img', { name: 'Celebrating pet family' })).toBeInTheDocument();
    expect(screen.getByText('Your order is placed')).toBeInTheDocument();
    vi.useRealTimers();
  });

  test('fades away and disappears after the celebration', () => {
    vi.useFakeTimers();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
    const onDone = vi.fn();
    const { container } = render(<OrderFireworks active onDone={onDone} />);
    expect(screen.getByRole('img', { name: 'Celebrating pet family' })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(7200);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(container).toBeEmptyDOMElement();
    vi.useRealTimers();
  });
});

describe('checkout celebration handoff', () => {
  test('signed-in and guest success both open the fireworks screen', () => {
    const checkout = fs.readFileSync(
      path.resolve(__dirname, '../../pages/Checkout.tsx'),
      'utf8'
    );
    expect(checkout).toContain("navigate(`/orders/${orderId}?newOrder=true`)");
    expect(checkout).toContain("navigate(`/track-order?order=${order.orderNumber || orderId}&newOrder=true`)");
    expect(checkout).toContain('rememberGoogleReviewOptIn');
    expect(checkout).toContain('rememberGuestCheckoutAccount');
  });

  test('order confirmation and guest tracking render the fireworks blast', () => {
    const orderDetail = fs.readFileSync(
      path.resolve(__dirname, '../../pages/OrderDetail.tsx'),
      'utf8'
    );
    const track = fs.readFileSync(
      path.resolve(__dirname, '../../pages/TrackOrder.tsx'),
      'utf8'
    );
    expect(orderDetail).toContain('OrderFireworks');
    expect(orderDetail).toContain('GoogleCustomerReviewsOptIn');
    expect(track).toContain('OrderFireworks');
    expect(track).toContain('GoogleCustomerReviewsOptIn');
    expect(track).toContain("searchParams.get('newOrder') === 'true'");
    expect(orderDetail).toContain("searchParams.get('newOrder') === 'true'");
  });

  test('guest tracking tells the shopper how to create a password', () => {
    const track = fs.readFileSync(
      path.resolve(__dirname, '../../pages/TrackOrder.tsx'),
      'utf8'
    );
    expect(track).toContain('There is no password yet');
    expect(track).toContain('guestSetPasswordPath');
    expect(track).toContain('Create a password');
  });
});
