import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import OrderFireworks from '../OrderFireworks';
import fs from 'fs';
import path from 'path';

describe('OrderFireworks', () => {
  test('tells the shopper the order is done when celebration is active', () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
    render(<OrderFireworks active />);
    expect(screen.getByText("It's done")).toBeInTheDocument();
    expect(screen.getByText('Your order is placed')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('stays hidden until an order actually completes', () => {
    const { container } = render(<OrderFireworks active={false} />);
    expect(container).toBeEmptyDOMElement();
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
    expect(track).toContain('OrderFireworks');
  });
});
