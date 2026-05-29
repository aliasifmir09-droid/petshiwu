// ══════════════════════════════════════════════════════════════════════════════
// INSTRUCTIONS:
// In orderController.ts, find the createOrder function and replace it entirely
// with this one. Also replace createOrderPaymentIntent with the one at the bottom.
// Everything else in the file stays the same.
// ══════════════════════════════════════════════════════════════════════════════

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      donationAmount,
      totalPrice,
      notes,
      guestEmail // GUEST CHECKOUT: email from guest user
    } = req.body;

    // GUEST CHECKOUT: user is optional
    const isGuest = !req.user?._id;
    const customerEmail = isGuest
      ? (guestEmail || shippingAddress?.email || '').trim()
      : null;

    // Guests must provide an email
    if (isGuest && !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address to receive your order confirmation'
      });
    }

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is incomplete',
        errors: ['Street, city, state, and zip code are required']
      });
    }
    if (!shippingAddress.firstName?.trim() || !shippingAddress.lastName?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your first and last name for delivery',
        errors: ['First name and last name are required for shipping']
      });
    }
    if (!shippingAddress.phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a phone number for delivery contact',
        errors: ['Phone number is required for delivery']
      });
    }

    // Normalize product IDs
    const normalizedItems = items.map((item: OrderItemInput): NormalizedOrderItem => {
      let productId: string | null = null;
      const rawProductId = item.product;
      if (!rawProductId) throw new Error(`Product ID is missing for item: ${item.name || 'Unknown'}`);
      productId = safeToString(rawProductId);
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error(`Invalid product ID for item: ${item.name || 'Unknown'}`);
      }
      return { ...item, product: productId };
    });

    const useTransactions = process.env.NODE_ENV !== 'test';
    let session: mongoose.ClientSession | null = null;
    if (useTransactions) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('replica set')) { session = null; } else { throw error; }
      }
    }

    try {
      // Step 1: Verify stock
      const stockUpdates: Array<{ productId: string; quantity: number; variantSku?: string }> = [];

      for (const item of normalizedItems) {
        const productId = item.product;
        const quantity = item.quantity || 1;
        const product = session ? await Product.findById(productId).session(session) : await Product.findById(productId);
        if (!product) throw new Error(`Product ${item.name || productId} not found`);
        if (!product.inStock) throw new Error(`Product "${item.name}" is currently out of stock`);

        if (item.variant && item.variant.sku) {
          const decodeSku = (s: string) =>
            s.replace(/&amp;amp;/g, '&').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"');
          const normalizedCartSku = decodeSku(item.variant.sku);
          const variant = product.variants.find(
            (v) => v.sku === item.variant?.sku || v.sku === normalizedCartSku || decodeSku(v.sku || '') === normalizedCartSku
          );
          if (!variant) {
            if (product.totalStock < quantity)
              throw new Error(`Insufficient stock for product "${item.name}". Available: ${product.totalStock}, Requested: ${quantity}`);
            stockUpdates.push({ productId, quantity });
          } else {
            if (variant.stock < quantity)
              throw new Error(`Insufficient stock for variant "${item.variant.sku}" of product "${item.name}". Available: ${variant.stock}, Requested: ${quantity}`);
            stockUpdates.push({ productId, quantity, variantSku: variant.sku });
          }
        } else {
          if (product.totalStock < quantity)
            throw new Error(`Insufficient stock for product "${item.name}". Available: ${product.totalStock}, Requested: ${quantity}`);
          stockUpdates.push({ productId, quantity });
        }
      }

      // Step 2: Update stock atomically
      for (const update of stockUpdates) {
        if (update.variantSku) {
          const variantUpdateResult = await Product.updateOne(
            { _id: update.productId, 'variants.sku': update.variantSku, 'variants.stock': { $gte: update.quantity } },
            { $inc: { 'variants.$.stock': -update.quantity, totalStock: -update.quantity } },
            session ? { session } : {}
          );
          if (variantUpdateResult.matchedCount === 0)
            throw new Error(`Insufficient stock for variant SKU "${update.variantSku}"`);
        } else {
          const productUpdateResult = await Product.updateOne(
            { _id: update.productId, totalStock: { $gte: update.quantity } },
            { $inc: { totalStock: -update.quantity } },
            session ? { session } : {}
          );
          if (productUpdateResult.matchedCount === 0) {
            const p = session ? await Product.findById(update.productId).session(session) : await Product.findById(update.productId);
            throw new Error(`Insufficient stock for product. Available: ${p?.totalStock || 0}, Requested: ${update.quantity}`);
          }
        }
        await Product.updateOne(
          { _id: update.productId },
          [{ $set: { inStock: { $gt: ['$totalStock', 0] } } }],
          session ? { session } : {}
        );
      }

      // Step 3: Verify payment
      let paymentIntentId: string | undefined = undefined;
      let paypalOrderId: string | undefined = undefined;
      let isPaymentVerified = false;

      if (paymentMethod !== 'cod') {
        const { paymentIntentId: intentId, paypalOrderId: paypalId } = req.body;
        if (paymentMethod === 'paypal') {
          if (!paypalId) throw new Error('PayPal Order ID is required for PayPal payments');
          paypalOrderId = paypalId;
          isPaymentVerified = true;
          logger.info(`PayPal payment received: Order ID ${paypalId}`);
        } else {
          if (!intentId) throw new Error('Payment Intent ID is required for online payment methods');
          if (stripe) {
            try {
              const paymentIntent = await stripe.paymentIntents.retrieve(intentId);
              if (paymentIntent.status !== 'succeeded')
                throw new Error(`Payment not completed. Status: ${paymentIntent.status}`);
              const expectedAmount = Math.round(totalPrice * 100);
              if (paymentIntent.amount !== expectedAmount)
                throw new Error(`Payment amount mismatch. Expected: $${totalPrice}, Got: $${paymentIntent.amount / 100}`);
              paymentIntentId = intentId;
              isPaymentVerified = true;
            } catch (stripeError: unknown) {
              logger.error('Payment verification error:', stripeError);
              const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
              throw new Error(`Payment verification failed: ${errorMessage}`);
            }
          } else {
            throw new Error('Payment processing not configured. Please use Cash on Delivery (COD) or configure Stripe.');
          }
        }
      } else {
        isPaymentVerified = true;
      }

      // Step 4: Create order — user is optional for guest checkout
      const newOrder = new Order({
        ...(req.user?._id ? { user: req.user._id } : {}),
        ...(isGuest ? { guestEmail: customerEmail } : {}),
        items: normalizedItems,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        paymentMethod,
        paymentIntentId,
        paypalOrderId,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : (isPaymentVerified ? 'paid' : 'pending'),
        isPaid: paymentMethod !== 'cod' && isPaymentVerified ? true : false,
        paidAt: paymentMethod !== 'cod' && isPaymentVerified ? new Date() : undefined,
        itemsPrice,
        shippingPrice,
        taxPrice,
        donationAmount: donationAmount || 0,
        totalPrice,
        notes: notes || undefined
      });

      const savedOrder = await newOrder.save(session ? { session } : {});
      const order = [savedOrder];

      if (session) await session.commitTransaction();

      let normalizedOrder = normalizeOrderId(order[0]);

      if (!normalizedOrder && order[0]) {
        logger.warn(`normalizeOrderId returned null for order ${order[0]._id} — using direct fallback`);
        try {
          const doc = order[0];
          normalizedOrder = {
            _id: String(doc._id),
            orderNumber: doc.orderNumber || '',
            user: doc.user ? String(doc.user) : undefined,
            items: (doc.items || []).map((item) => ({ ...item, product: String(item.product) })) as NormalizedOrderItem[],
            shippingAddress: doc.shippingAddress as unknown as Record<string, unknown>,
            paymentMethod: doc.paymentMethod,
            paymentStatus: doc.paymentStatus,
            orderStatus: doc.orderStatus,
            itemsPrice: doc.itemsPrice,
            shippingPrice: doc.shippingPrice,
            taxPrice: doc.taxPrice,
            totalPrice: doc.totalPrice,
            createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: (doc as any).updatedAt ? (doc as any).updatedAt.toISOString() : new Date().toISOString(),
          } as NormalizedOrder;
        } catch (fallbackErr) {
          logger.error(`Fallback normalization also failed: ${fallbackErr}`);
        }
      }

      if (!normalizedOrder) {
        logger.error(`Order created (id=${order[0]?._id}) but normalization failed completely`);
        return res.status(500).json({
          success: false,
          message: 'Order was placed but we had a technical issue fetching the details. Please check your email and order history.'
        });
      }

      // Real-time notification (non-blocking)
      try {
        const { notifyNewOrder } = await import('../utils/orderNotifications');
        const fullOrder = await Order.findById(normalizedOrder._id).populate('user', 'firstName lastName email').lean();
        if (fullOrder) notifyNewOrder(fullOrder);
      } catch (notificationError) {
        logger.error('Error sending order notification:', notificationError);
      }

      // Send confirmation email — works for both logged-in and guest users
      try {
        let emailAddress: string | undefined;
        let firstName: string = 'Customer';

        if (isGuest) {
          emailAddress = customerEmail || undefined;
          firstName = shippingAddress.firstName || 'Customer';
        } else {
          const userDoc = await User.findById(req.user!._id).select('email firstName lastName').lean();
          emailAddress = userDoc?.email;
          firstName = userDoc?.firstName || 'Customer';
        }

        if (emailAddress) {
          const fullOrder = await Order.findById(normalizedOrder._id).lean();
          if (fullOrder && fullOrder.orderNumber) {
            const orderIdStr = String(fullOrder._id);
            await addEmailJob(
              'order-confirmation',
              {
                email: emailAddress,
                firstName,
                orderNumber: fullOrder.orderNumber,
                orderData: {
                  orderId: orderIdStr,
                  items: fullOrder.items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price, image: item.image })),
                  totalPrice: fullOrder.totalPrice,
                  itemsPrice: fullOrder.itemsPrice,
                  shippingPrice: fullOrder.shippingPrice,
                  taxPrice: fullOrder.taxPrice,
                  donationAmount: fullOrder.donationAmount,
                  shippingAddress: fullOrder.shippingAddress,
                  paymentMethod: fullOrder.paymentMethod,
                  orderStatus: fullOrder.orderStatus,
                  createdAt: fullOrder.createdAt
                }
              },
              async () => {
                await sendOrderConfirmationEmail(emailAddress!, firstName, fullOrder.orderNumber, {
                  orderId: orderIdStr,
                  items: fullOrder.items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price, image: item.image })),
                  totalPrice: fullOrder.totalPrice,
                  itemsPrice: fullOrder.itemsPrice,
                  shippingPrice: fullOrder.shippingPrice,
                  taxPrice: fullOrder.taxPrice,
                  donationAmount: fullOrder.donationAmount,
                  shippingAddress: fullOrder.shippingAddress,
                  paymentMethod: fullOrder.paymentMethod,
                  orderStatus: fullOrder.orderStatus,
                  createdAt: fullOrder.createdAt
                });
              }
            );
          }
        }
      } catch (emailError) {
        logger.error('Error queuing order confirmation email:', emailError);
      }

      // Admin notification (fire-and-forget)
      try {
        const fullOrderForAdmin = await Order.findById(normalizedOrder._id).lean();
        let adminCustomerEmail = '';
        let adminFirstName = shippingAddress.firstName || 'Guest';
        let adminLastName = shippingAddress.lastName || '';

        if (!isGuest && req.user?._id) {
          const userDoc = await User.findById(req.user._id).select('email firstName lastName').lean();
          adminCustomerEmail = userDoc?.email || '';
          adminFirstName = userDoc?.firstName || adminFirstName;
          adminLastName = userDoc?.lastName || adminLastName;
        } else {
          adminCustomerEmail = customerEmail || '';
        }

        if (fullOrderForAdmin) {
          sendAdminNewOrderEmail({
            orderNumber: fullOrderForAdmin.orderNumber,
            orderId: String(fullOrderForAdmin._id),
            customerFirstName: adminFirstName,
            customerLastName: adminLastName,
            customerEmail: adminCustomerEmail,
            items: fullOrderForAdmin.items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
            totalPrice: fullOrderForAdmin.totalPrice,
            itemsPrice: fullOrderForAdmin.itemsPrice,
            shippingPrice: fullOrderForAdmin.shippingPrice,
            taxPrice: fullOrderForAdmin.taxPrice,
            paymentMethod: fullOrderForAdmin.paymentMethod,
            shippingAddress: fullOrderForAdmin.shippingAddress
          }).catch((err) => logger.error('Admin notification email failed silently:', err));
        }
      } catch (adminEmailError) {
        logger.error('Error sending admin order notification:', adminEmailError);
      }

      res.status(201).json({ success: true, data: normalizedOrder });

    } catch (error: unknown) {
      if (session) await session.abortTransaction();
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not found') || errorMessage.includes('out of stock') || errorMessage.includes('Insufficient stock')) {
        return res.status(400).json({ success: false, message: errorMessage });
      }
      throw error;
    } finally {
      if (session) session.endSession();
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as { errors?: Record<string, { message: string }> };
      const messages = Object.values(validationError.errors || {}).map((err) => err.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
    }
    next(error);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// Also replace createOrderPaymentIntent with this version (works without auth)
// ══════════════════════════════════════════════════════════════════════════════

export const createOrderPaymentIntent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { totalPrice, paymentMethod } = req.body;

    if (!totalPrice || totalPrice < 0.5) {
      return res.status(400).json({ success: false, message: 'Order total must be at least $0.50' });
    }

    const validMethods = ['credit_card', 'paypal', 'apple_pay', 'google_pay'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method. Use credit_card, paypal, apple_pay, or google_pay' });
    }

    if (!stripe) {
      return res.status(500).json({ success: false, message: 'Payment processing not configured. Please set STRIPE_SECRET_KEY in environment variables.' });
    }

    const amountInCents = Math.round(totalPrice * 100);

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        payment_method_types: paymentMethod === 'credit_card'
          ? ['card']
          : paymentMethod === 'apple_pay'
          ? ['card', 'apple_pay']
          : paymentMethod === 'google_pay'
          ? ['card', 'google_pay']
          : ['card'],
        metadata: {
          order: 'true',
          // GUEST CHECKOUT: works for both guests (no user) and logged-in users
          userId: String(req.user?._id || 'guest'),
          userEmail: req.user?.email || '',
          userName: req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : 'Guest'
        }
      });

      res.status(200).json({
        success: true,
        data: { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id }
      });
    } catch (stripeError: unknown) {
      logger.error('Stripe error:', stripeError);
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
      return res.status(500).json({ success: false, message: 'Payment processing error: ' + errorMessage });
    }
  } catch (error: unknown) {
    logger.error('Payment intent error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment intent' });
  }
};
