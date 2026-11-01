import {
  Asset, Horizon, Memo, Networks, Operation, TransactionBuilder,
} from '@stellar/stellar-sdk';
import { getNetwork, isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const server = new Horizon.Server(HORIZON_URL);

export async function connectWallet(): Promise<{ address: string; balance: string }> {
  const installed = await isConnected();
  if (!installed.isConnected) {
    throw new Error('Freighter was not detected. Install the Freighter wallet extension and reload this page.');
  }
  const access = await requestAccess();
  if (access.error) throw new Error(access.error.message);
  if (!access.address) throw new Error('Wallet access was not granted.');

  const network = await getNetwork();
  if (network.error) throw new Error(network.error.message);
  if (String(network.network).toUpperCase() !== 'TESTNET') {
    throw new Error('Switch Freighter to Stellar Testnet, then connect again. This app never sends mainnet transactions.');
  }

  const account = await server.loadAccount(access.address);
  const native = account.balances.find((b) => b.asset_type === 'native');
  return { address: access.address, balance: native && 'balance' in native ? native.balance : '0' };
}

export async function refreshBalance(address: string): Promise<string> {
  const account = await server.loadAccount(address);
  const native = account.balances.find((b) => b.asset_type === 'native');
  return native && 'balance' in native ? native.balance : '0';
}

export async function contributeOnTestnet(
  sender: string,
  receiver: string,
  amount: number,
  campaignId: string,
): Promise<string> {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
    throw new Error('Enter a valid contribution amount in XLM.');
  }
  if (!/^G[A-Z2-7]{55}$/.test(receiver)) {
    throw new Error('This campaign does not have a valid Stellar receiving address.');
  }
  if (sender === receiver) throw new Error('You cannot contribute to your own wallet.');

  const source = await server.loadAccount(sender);
  const fee = await server.fetchBaseFee();
  const shortId = campaignId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'campaign';
  const transaction = new TransactionBuilder(source, {
    fee: String(fee),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.payment({
      destination: receiver,
      asset: Asset.native(),
      amount: amount.toFixed(7).replace(/0+$/, '').replace(/\.$/, ''),
    }))
    .addMemo(Memo.text(`orbit:${shortId}`))
    .setTimeout(180)
    .build();

  const signed = await signTransaction(transaction.toXDR(), {
    networkPassphrase: Networks.TESTNET,
    address: sender,
  });
  if (signed.error) throw new Error(signed.error.message);
  if (!signed.signedTxXdr) throw new Error('Freighter did not return a signed transaction.');

  const signedTransaction = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    Networks.TESTNET,
  );
  const result = await server.submitTransaction(signedTransaction);
  return result.hash;
}

export const TESTNET_EXPLORER = 'https://stellar.expert/explorer/testnet';
export const TESTNET_FAUCET = 'https://friendbot.stellar.org';
