// Lazily inject the Razorpay checkout script once, then resolve.
export const loadRazorpay = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(script)
  })
}

// Open the Razorpay checkout for an order created on our backend.
//
// `key` and `orderId` come from POST /payments/razorpay/order. On success the
// gateway hands back razorpay_payment_id / razorpay_order_id / razorpay_signature,
// which the caller must POST to /payments/razorpay/verify before trusting it.
export const openRazorpayCheckout = async ({
  key,
  orderId,
  amountInPaise,
  name,
  description,
  email,
  onSuccess,
  onFailure,
}) => {
  const loaded = await loadRazorpay().catch(() => false)
  if (!loaded) {
    onFailure?.(new Error('Could not load the payment gateway. Check your connection.'))
    return
  }
  if (!key || !orderId) {
    onFailure?.(new Error('Payment could not be started. Please try again.'))
    return
  }

  const options = {
    key,
    order_id: orderId,
    amount: amountInPaise,
    currency: 'INR',
    name: name || 'Telemedical Platform',
    description: description || 'Consultation Fee',
    prefill: { email },
    handler: (response) => onSuccess?.(response),
    modal: {
      ondismiss: () => onFailure?.(new Error('Payment cancelled')),
    },
    theme: { color: '#5F6FFF' },
  }

  const rzp = new window.Razorpay(options)
  // surface gateway-reported failures (e.g. declined card) to the caller
  rzp.on?.('payment.failed', (resp) => {
    onFailure?.(new Error(resp?.error?.description || 'Payment failed'))
  })
  rzp.open()
}
