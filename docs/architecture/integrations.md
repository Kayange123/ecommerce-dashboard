# Integrations

## Current state: no provider abstraction

- **Stripe** — `lib/stripe.ts` exports a bare SDK client, imported
  directly by the checkout route and webhook handler.
- **Cloudinary** — `components/ui/ImageUpload.tsx` couples product/
  billboard forms directly to `next-cloudinary`'s `CldUploadWidget`.

Neither is a bug by itself — introducing an interface before there's a
second implementation to design it against tends to produce the wrong
abstraction. But it does mean today: swapping Cloudinary for S3 means
touching every form component, not one file, and adding a second payment
provider means touching the checkout route and webhook handler directly.

## Where this is headed

[ROADMAP.md](../../ROADMAP.md) v0.4 introduces:

```ts
interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<PaymentSession>;
  verifyPayment(reference: string): Promise<PaymentStatus>;
  refundPayment(input: RefundInput): Promise<RefundResult>;
}

interface StorageProvider {
  upload(file: File): Promise<{ url: string }>;
  delete(url: string): Promise<void>;
}
```

Stripe and Cloudinary become the first implementations of each. v0.7 adds
more `PaymentProvider` implementations (M-Pesa, PayPal, Paystack,
Flutterwave, Pesapal) — each is a good, scoped "add an integration" issue
once the interface exists (see
[docs/contributing/good-first-issues.md](../contributing/good-first-issues.md)).

## Adding an integration before the interface exists

If you're adding integration code now, isolate provider-specific calls
(SDK usage, webhook payload parsing) behind a small module with a narrow
surface, so wiring it into the eventual interface is a mechanical move
rather than a rewrite — see
[CONTRIBUTING.md](../../CONTRIBUTING.md#adding-an-integration-payment-provider-storage-provider-etc).
