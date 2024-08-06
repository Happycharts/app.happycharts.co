## 😜 Happybase: Endlessly flexible paywall for indie makers and ceiling breakers 

![Happybase](./public/banner.png)

*"Happybase stands firmly with the people of Occupied Palestine, as we have from the beginning. We are a community of technologists, designers, and developers who are committed to using our skills and talents to create a better world for all. 🇵🇸🇵🇸🇵🇸"*



Welcome to Happybase, the fair-source universal paywall that allows you to gate your knowledge, calendars, CRM, or almost anything else, and then sell access to your audience.

### 🤔 Why tho?

While Happybase in many ways is a simple tool, the flexibility it provides is what makes it so powerful. We also believe that the value compared to other alternatives is bar-none. When we started Happybase, we had a few goals in mind:

- **Build something that is easy to use and maintain.**
- **Build a platform that is so flexible it can be used for almost multiple use cases.**
- **Provide users with a way to monetize their content being stuck to one tool.**

Happybase is built around the idea of a portal. A portal is the looking glass into the content you want to share. It's a way to gate your content in a secure and easy to use way.

### 🤓 How does it work?

The internals of Happybase are built around a few key concepts:

- **IFrame Portals**: Happybase uses IFrames to create a paywall over the content you share.
- **App Router**: App Router is used to create the dynamic gated and ungated content layers.
- **Stripe Connect**: Stripe Connect is used to enable merchants to monetize their data.

#### Commerce: Stripe Connect

To enable user to monetize their data, we we've added in Stripe Connect for cross-party commerce. This allows you as a merchant to monetize your data by charging a fee for access to their data.

- **Account Setup:** Users can easily set up a Stripe Connect account through the Happybase platform. This account will be used to manage all financial transactions related to data sharing.
- **Payment Processing:** When a user purchases data or access to a portal, Stripe Connect handles the payment processing. This ensures that transactions are secure and compliant with global payment standards.
- **Payout Management:** Stripe Connect also manages payouts to data providers. Users can set up automatic payouts to their bank accounts, ensuring they receive their earnings promptly and securely.

> **_NOTE:_**  Per the terms of the FSL license, the Stripe Connect features are not available for commercial use.

### 🚀 Getting Started

To get started contributing to Happybase, you'll need to install the following dependencies:

- [Node.js](https://nodejs.org/en/)
- [Pnpm](https://pnpm.io/)

Once you have the dependencies installed, you can run the following commands to start the development server:
```bash
pnpm install
pnpm run dev
