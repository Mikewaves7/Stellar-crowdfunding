# Orbit Fund — Stellar Crowdfunding

A React + TypeScript crowdfunding frontend connected to **Stellar Testnet**. Built with Vite, the Stellar JavaScript SDK, and Freighter.

## Features

- Responsive crowdfunding dashboard with campaign discovery and category filtering.
- Create a campaign using a connected Freighter wallet.
- Connect Freighter and verify the selected network is Stellar Testnet.
- Read the connected account's XLM testnet balance from Horizon.
- Contribute native XLM through a Freighter-reviewed and signed Stellar Testnet payment.
- Add a short campaign reference in the transaction memo.
- Show successful contribution hashes with Stellar Expert testnet links.
- GitHub Actions workflow for GitHub Pages deployment.

## Run locally

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Testnet setup

1. Install the [Freighter wallet](https://www.freighter.app/).
2. Switch Freighter to **Testnet**.
3. Fund your testnet account using the [Stellar Friendbot](https://friendbot.stellar.org/).
4. Open Orbit Fund and choose **Connect wallet**.
5. Create a campaign. The receiving wallet defaults to your connected public address.
6. Share your campaign details and public receiving address with supporters.
7. A supporter connects a funded Testnet wallet, chooses the campaign, enters an XLM amount, accepts the direct-payment notice, and approves the transaction in Freighter.
8. Verify the transaction on [Stellar Expert Testnet](https://stellar.expert/explorer/testnet).

## Important architecture notes

This repository currently provides a **testnet prototype**, not a production crowdfunding protocol.

- Campaign metadata is stored in the browser's localStorage. It is not yet published to a shared database or stored on-chain, so a campaign created in one browser will not automatically appear in another user's browser.
- Contributions are real Stellar Testnet native-XLM payments sent directly to the campaign's receiving public key. The platform does not custody funds.
- There is no escrow, milestone release, automatic refund, dispute resolution, or guarantee that a campaign reaches its goal. Contributors should only send testnet XLM to addresses they trust.
- Raised totals and activity history are kept locally in the browser after successful submission. A production release should index confirmed payments from Horizon and verify memo/campaign references before displaying global totals.
- Sample campaigns are illustrative and cannot accept payments.
- Testnet assets have no monetary value. Do not use mainnet funds or secrets with this prototype.

## Stack

- React 18 + TypeScript
- Vite
- `@stellar/stellar-sdk`
- `@stellar/freighter-api`
- Horizon Testnet: `https://horizon-testnet.stellar.org`
