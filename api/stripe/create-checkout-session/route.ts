import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with the secret key
const getStripeClient = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing Stripe secret key");
  }
  return new Stripe(key, {
    apiVersion: "2022-11-15",
    appInfo: {
      name: "next-stripe-subscription",
      version: "0.1.0"
    }
  });
};

// Get the app URL from environment variables
const getAppUrl = () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8080";
  return appUrl;
};

export async function POST(req: Request) {
  const stripe = getStripeClient();
  const body = await req.json();
  const { priceId, planTitle, isAnnual, customerEmail } = body;

  // Validate priceId
  if (!priceId) {
    return NextResponse.json(
      { error: { message: "Missing priceId" } },
      { status: 400 }
    );
  }

  // Convert plan title to a simple string for metadata
  const planName = planTitle.replace(/\s+/g, "-").toLowerCase();
  const appUrl = getAppUrl();

  try {
    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: customerEmail, // Pre-fill email if available
      line_items: [{ 
        price: priceId, 
        quantity: 1
      }],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: `${appUrl}/home?payment_success=true&plan=${planName}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment?payment_cancelled=true`,
      metadata: { planName, isAnnual: isAnnual ? "true" : "false" },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 400 }
    );
  }
}
