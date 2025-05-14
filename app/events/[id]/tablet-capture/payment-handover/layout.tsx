import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Payment Confirmation | Lucky Draw',
  description: 'Confirm your payment to complete your entry',
}

export default function PaymentHandoverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="payment-handover-layout">
      {children}
    </div>
  )
} 