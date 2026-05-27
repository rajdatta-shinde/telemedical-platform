import React, { useEffect, useMemo, useState } from 'react'
import { IoClose } from 'react-icons/io5'
import {
  FaRegCreditCard, FaMobileAlt, FaUniversity,
  FaCheckCircle, FaLock, FaExclamationTriangle, FaChevronDown, FaBolt,
} from 'react-icons/fa'
import api from '../utils/axios'
import { openRazorpayCheckout } from '../utils/razorpay'

// Where the money would settle - shown on the QR / UPI intent.
const MERCHANT_VPA = 'telemedical.health@okaxis'
const MERCHANT_NAME = 'Telemedical Platform'

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', bg: '#ffffff', fg: '#1a73e8', bd: '#dadce0' },
  { id: 'phonepe', name: 'PhonePe', bg: '#5f259f', fg: '#ffffff', bd: '#5f259f' },
  { id: 'paytm', name: 'Paytm', bg: '#ffffff', fg: '#00baf2', bd: '#bfe9fb' },
  { id: 'bhim', name: 'BHIM UPI', bg: '#ffffff', fg: '#00427a', bd: '#c3d4e3' },
]

const BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda',
  'Yes Bank', 'IDFC FIRST Bank', 'Union Bank of India', 'Canara Bank',
]

const usd = (n) => `$${Number(n || 0).toLocaleString('en-US')}`

const detectNetwork = (digits) => {
  if (/^4/.test(digits)) return 'VISA'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'AMEX'
  if (/^(60|65|81|82|508)/.test(digits)) return 'RuPay'
  return ''
}

// Luhn check so an obviously wrong card number is caught before submitting.
const luhnOk = (digits) => {
  if (digits.length < 12) return false
  let sum = 0
  let dbl = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (dbl) { d *= 2; if (d > 9) d -= 9 }
    sum += d
    dbl = !dbl
  }
  return sum % 10 === 0
}

const UPI_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/

const PaymentModal = ({ open, appointment, onClose, onSuccess }) => {
  // step: loading | select | processing | success | error
  const [step, setStep] = useState('loading')
  const [order, setOrder] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [processingMsg, setProcessingMsg] = useState('Processing your payment')

  // which method panel is expanded
  const [openMethod, setOpenMethod] = useState('upi')
  const [upiTab, setUpiTab] = useState('apps') // apps | id | qr

  // form fields
  const [vpa, setVpa] = useState('')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [bank, setBank] = useState('')

  // create the order whenever the modal is opened for an appointment
  useEffect(() => {
    if (!open || !appointment) return
    let cancelled = false
    setStep('loading')
    setReceipt(null)
    setErrorMsg('')
    setOpenMethod('upi')
    setUpiTab('apps')
    setVpa('')
    setCard({ number: '', name: '', expiry: '', cvv: '' })
    setBank('')

    api.post('/payments/create-order', { appointmentId: appointment.id })
      .then(res => { if (!cancelled) { setOrder(res.data); setStep('select') } })
      .catch(err => {
        if (cancelled) return
        setErrorMsg(err.response?.data?.error || 'Could not start the payment. Please try again.')
        setStep('error')
      })

    return () => { cancelled = true }
  }, [open, appointment])

  const amount = order?.amount || appointment?.fees || 0

  const upiIntentUrl = useMemo(() => {
    const params = new URLSearchParams({
      pa: MERCHANT_VPA,
      pn: MERCHANT_NAME,
      am: String(amount),
      cu: 'INR',
      tn: `Consultation - ${appointment?.doctorName || 'Doctor'}`,
    })
    return `upi://pay?${params.toString()}`
  }, [amount, appointment])

  const qrUrl = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(upiIntentUrl)}`,
    [upiIntentUrl],
  )

  if (!open || !appointment) return null

  // run the verify call against the backend, with a short realistic delay
  const processPayment = async (method, details, msg) => {
    if (!order) return
    setProcessingMsg(msg || 'Processing your payment')
    setStep('processing')
    try {
      await new Promise(r => setTimeout(r, 2200))
      const res = await api.post('/payments/verify', {
        orderId: order.orderId,
        method,
        details,
      })
      setReceipt(res.data)
      setStep('success')
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Payment could not be completed. Please try again.')
      setStep('error')
    }
  }

  const payWithUpiApp = (app) => {
    // on a phone this hands off to the real UPI app; harmless on desktop
    try { window.location.href = upiIntentUrl } catch { /* ignore */ }
    processPayment('upi', { mode: 'intent', app: app.id }, `Approve the request in ${app.name}`)
  }

  const payWithUpiId = () => {
    if (!UPI_RE.test(vpa.trim())) {
      setErrorMsg('Enter a valid UPI ID, e.g. name@bank')
      return
    }
    setErrorMsg('')
    processPayment('upi', { vpa: vpa.trim() }, `Collecting ${usd(amount)} from ${vpa.trim()}`)
  }

  const payWithQr = () => processPayment('upi', { mode: 'qr' }, 'Confirming your UPI payment')

  const cardDigits = card.number.replace(/\D/g, '')
  const cardNetwork = detectNetwork(cardDigits)

  const payWithCard = () => {
    if (!luhnOk(cardDigits)) { setErrorMsg('Please enter a valid card number'); return }
    if (!card.name.trim()) { setErrorMsg('Enter the name on the card'); return }
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) { setErrorMsg('Enter a valid expiry (MM/YY)'); return }
    if (!/^\d{3,4}$/.test(card.cvv)) { setErrorMsg('Enter a valid CVV'); return }
    setErrorMsg('')
    processPayment('card', {
      number: cardDigits, name: card.name.trim(), expiry: card.expiry, cvv: card.cvv,
    }, 'Authorising your card payment')
  }

  const payWithNetbanking = () => {
    if (!bank) { setErrorMsg('Please select your bank'); return }
    setErrorMsg('')
    processPayment('netbanking', { bank }, `Redirecting to ${bank}`)
  }

  // Real Razorpay gateway: create a Razorpay order, open their checkout, then
  // verify the signed response on our backend before showing success.
  const payWithRazorpay = async () => {
    setErrorMsg('')
    setProcessingMsg('Opening secure Razorpay checkout')
    setStep('processing')
    try {
      const { data } = await api.post('/payments/razorpay/order', {
        appointmentId: appointment.id,
      })
      await openRazorpayCheckout({
        key: data.keyId,
        orderId: data.razorpayOrderId,
        amountInPaise: data.amountInPaise,
        name: MERCHANT_NAME,
        description: `Consultation - ${appointment?.doctorName || 'Doctor'}`,
        email: appointment?.patientEmail,
        onSuccess: async (resp) => {
          setProcessingMsg('Verifying your payment')
          setStep('processing')
          try {
            const verify = await api.post('/payments/razorpay/verify', {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            })
            setReceipt(verify.data)
            setStep('success')
          } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Payment verification failed. Please contact support.')
            setStep('error')
          }
        },
        onFailure: (err) => {
          setErrorMsg(err?.message || 'Payment was not completed.')
          setStep('error')
        },
      })
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Could not start the payment. Please try again.')
      setStep('error')
    }
  }

  const handleClose = () => {
    if (step === 'processing') return // don't let them bail mid-transaction
    if (step === 'success') onSuccess?.(receipt)
    else onClose?.()
  }

  // -- card input formatters -------------------------------------------------
  const onCardNumber = (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 16)
    setCard(c => ({ ...c, number: d.replace(/(.{4})/g, '$1 ').trim() }))
  }
  const onExpiry = (e) => {
    let d = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (d.length >= 3) d = `${d.slice(0, 2)}/${d.slice(2)}`
    setCard(c => ({ ...c, expiry: d }))
  }

  // ==========================================================================
  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4'
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className='bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col'>

        {/* header */}
        <div className='flex items-center justify-between px-5 py-4 bg-primary text-white'>
          <div>
            <p className='text-sm/none opacity-80'>Telemedical Secure Checkout</p>
            <p className='text-lg font-semibold mt-1'>{usd(amount)}</p>
          </div>
          <button onClick={handleClose} aria-label='Close' className='p-1 rounded-full hover:bg-white/20 transition-colors'>
            <IoClose size={22} />
          </button>
        </div>

        {/* order summary */}
        {appointment && (
          <div className='px-5 py-3 bg-indigo-50 text-sm flex items-center justify-between gap-3'>
            <div className='min-w-0'>
              <p className='font-medium text-gray-800 truncate'>{appointment.doctorName}</p>
              <p className='text-gray-500 text-xs truncate'>
                {appointment.speciality || order?.speciality || 'Consultation fee'}
              </p>
            </div>
            <span className='text-xs text-gray-500 whitespace-nowrap'>Order #{(order?.orderId || '').slice(-8) || '—'}</span>
          </div>
        )}

        <div className='overflow-y-auto'>
          {step === 'loading' && (
            <div className='py-16 flex flex-col items-center gap-3 text-gray-500'>
              <span className='h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin' />
              <p className='text-sm'>Setting up secure payment…</p>
            </div>
          )}

          {step === 'processing' && (
            <div className='py-16 px-6 flex flex-col items-center gap-4 text-center'>
              <span className='h-12 w-12 border-[3px] border-primary border-t-transparent rounded-full animate-spin' />
              <p className='font-medium text-gray-800'>{processingMsg}…</p>
              <p className='text-xs text-gray-500'>Please do not press back or close this window.</p>
            </div>
          )}

          {step === 'success' && (
            <div className='py-12 px-6 flex flex-col items-center gap-3 text-center'>
              <FaCheckCircle className='text-green-500' size={56} />
              <p className='text-xl font-semibold text-gray-800'>Payment Successful</p>
              <p className='text-2xl font-bold text-gray-900'>{usd(receipt?.amount)}</p>
              <div className='w-full mt-2 text-sm bg-gray-50 rounded-lg p-3 space-y-1'>
                <Row label='Transaction ID' value={receipt?.txnId} />
                <Row label='Payment ID' value={receipt?.paymentId} />
                <Row label='Method' value={(receipt?.method || '').toUpperCase()} />
                <Row label='Paid on' value={receipt?.paidAt ? new Date(receipt.paidAt).toLocaleString('en-IN') : '—'} />
              </div>
              <button
                onClick={() => onSuccess?.(receipt)}
                className='mt-4 w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors'
              >
                Done
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className='py-12 px-6 flex flex-col items-center gap-3 text-center'>
              <FaExclamationTriangle className='text-red-500' size={48} />
              <p className='text-lg font-semibold text-gray-800'>Payment Failed</p>
              <p className='text-sm text-gray-500'>{errorMsg}</p>
              <div className='flex gap-3 w-full mt-3'>
                <button onClick={onClose} className='flex-1 border border-gray-300 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50'>
                  Cancel
                </button>
                {order && (
                  <button
                    onClick={() => { setErrorMsg(''); setStep('select') }}
                    className='flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90'
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'select' && (
            <div className='p-4 space-y-3'>
              {errorMsg && (
                <p className='text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2'>{errorMsg}</p>
              )}

              {/* ---- Razorpay (real gateway) ---- */}
              <Method
                icon={<FaBolt />}
                title='Pay with Razorpay'
                subtitle='Card, UPI, Net Banking & Wallets'
                expanded={openMethod === 'razorpay'}
                onToggle={() => setOpenMethod(openMethod === 'razorpay' ? '' : 'razorpay')}
              >
                <div className='space-y-2'>
                  <p className='text-xs text-gray-500'>
                    You'll complete the payment in Razorpay's secure checkout window.
                  </p>
                  <button onClick={payWithRazorpay} className='w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90'>
                    Pay {usd(amount)} with Razorpay
                  </button>
                </div>
              </Method>

              {/* ---- UPI ---- */}
              <Method
                icon={<FaMobileAlt />}
                title='UPI'
                subtitle='Google Pay, PhonePe, Paytm & more'
                expanded={openMethod === 'upi'}
                onToggle={() => setOpenMethod(openMethod === 'upi' ? '' : 'upi')}
              >
                <div className='flex gap-2 mb-3 text-xs'>
                  {[['apps', 'UPI Apps'], ['id', 'UPI ID'], ['qr', 'Scan QR']].map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => { setUpiTab(k); setErrorMsg('') }}
                      className={`px-3 py-1.5 rounded-full border transition-colors ${
                        upiTab === k ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {upiTab === 'apps' && (
                  <div className='grid grid-cols-2 gap-2'>
                    {UPI_APPS.map(app => (
                      <button
                        key={app.id}
                        onClick={() => payWithUpiApp(app)}
                        className='flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium hover:opacity-90 transition'
                        style={{ background: app.bg, color: app.fg, borderColor: app.bd }}
                      >
                        <FaMobileAlt /> {app.name}
                      </button>
                    ))}
                  </div>
                )}

                {upiTab === 'id' && (
                  <div className='space-y-2'>
                    <input
                      value={vpa}
                      onChange={(e) => setVpa(e.target.value)}
                      placeholder='yourname@bank'
                      className='w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary'
                    />
                    <button onClick={payWithUpiId} className='w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90'>
                      Verify & Pay {usd(amount)}
                    </button>
                  </div>
                )}

                {upiTab === 'qr' && (
                  <div className='flex flex-col items-center gap-2'>
                    <img src={qrUrl} alt='UPI QR code' className='w-44 h-44 rounded-lg border border-gray-200' />
                    <p className='text-xs text-gray-500 text-center'>Scan with any UPI app to pay {usd(amount)}</p>
                    <button onClick={payWithQr} className='w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90'>
                      I have completed the payment
                    </button>
                  </div>
                )}
              </Method>

              {/* ---- Card ---- */}
              <Method
                icon={<FaRegCreditCard />}
                title='Credit / Debit Card'
                subtitle='Visa, Mastercard, RuPay, Amex'
                expanded={openMethod === 'card'}
                onToggle={() => setOpenMethod(openMethod === 'card' ? '' : 'card')}
              >
                <div className='space-y-2'>
                  <div className='relative'>
                    <input
                      value={card.number}
                      onChange={onCardNumber}
                      inputMode='numeric'
                      placeholder='Card number'
                      className='w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary'
                    />
                    {cardNetwork && (
                      <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500'>{cardNetwork}</span>
                    )}
                  </div>
                  <input
                    value={card.name}
                    onChange={(e) => setCard(c => ({ ...c, name: e.target.value }))}
                    placeholder='Name on card'
                    className='w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary'
                  />
                  <div className='flex gap-2'>
                    <input
                      value={card.expiry}
                      onChange={onExpiry}
                      inputMode='numeric'
                      placeholder='MM/YY'
                      className='w-1/2 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary'
                    />
                    <input
                      value={card.cvv}
                      onChange={(e) => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      inputMode='numeric'
                      placeholder='CVV'
                      type='password'
                      className='w-1/2 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary'
                    />
                  </div>
                  <button onClick={payWithCard} className='w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90'>
                    Pay {usd(amount)}
                  </button>
                </div>
              </Method>

              {/* ---- Net Banking ---- */}
              <Method
                icon={<FaUniversity />}
                title='Net Banking'
                subtitle='All major Indian banks'
                expanded={openMethod === 'netbanking'}
                onToggle={() => setOpenMethod(openMethod === 'netbanking' ? '' : 'netbanking')}
              >
                <div className='space-y-2'>
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className='w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-white'
                  >
                    <option value=''>Select your bank</option>
                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <button onClick={payWithNetbanking} className='w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90'>
                    Pay {usd(amount)}
                  </button>
                </div>
              </Method>

              <p className='flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1'>
                <FaLock size={10} /> Secured payment · Your details are encrypted
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Row = ({ label, value }) => (
  <div className='flex justify-between gap-3'>
    <span className='text-gray-500'>{label}</span>
    <span className='text-gray-800 font-medium truncate max-w-[60%]'>{value || '—'}</span>
  </div>
)

const Method = ({ icon, title, subtitle, expanded, onToggle, children }) => (
  <div className={`border rounded-xl transition-colors ${expanded ? 'border-primary' : 'border-gray-200'}`}>
    <button onClick={onToggle} className='w-full flex items-center gap-3 px-3 py-3 text-left'>
      <span className='text-primary text-lg'>{icon}</span>
      <span className='flex-1'>
        <span className='block text-sm font-medium text-gray-800'>{title}</span>
        <span className='block text-xs text-gray-400'>{subtitle}</span>
      </span>
      <FaChevronDown className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} size={12} />
    </button>
    {expanded && <div className='px-3 pb-3'>{children}</div>}
  </div>
)

export default PaymentModal
