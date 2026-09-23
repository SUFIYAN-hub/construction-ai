"use client"
import Script from "next/script"

export default function PricingPage() {
  async function upgrade() {
    const res = await fetch("/api/razorpay/subscribe", { method: "POST" })
    const data = await res.json()
    if (data.error) return alert(data.error)

    const options = {
      key: data.keyId,
      subscription_id: data.subscriptionId,
      name: "Construction AI",
      description: "Pro Subscription",
      handler: function () {
        window.location.href = "/?upgraded=true"
      },
      theme: { color: "#1E4FBF" },
    }
    // @ts-ignore
    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div style={{ maxWidth: 420, margin: "100px auto", textAlign: "center", padding: "0 24px" }}>
        <div className="display" style={{ fontSize: 22 }}>Construction AI Pro</div>
        <div className="chalk-line" style={{ margin: "10px auto 20px" }} />
        <p style={{ color: "var(--steel)", marginBottom: 28, fontSize: 14, lineHeight: 1.6 }}>
          Unlimited questions, floor plans, and priority support — grounded in real NBC citations, not guesses.
        </p>
        <button onClick={upgrade} style={{
          background: "var(--blue)", color: "white", border: "none",
          padding: "12px 28px", fontWeight: 600, cursor: "pointer", fontSize: 14
        }}>
          Upgrade — ₹499/month
        </button>
      </div>
    </>
  )
}