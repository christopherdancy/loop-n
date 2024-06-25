'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';
import { TokenListProvider, TokenInfo } from '@solana/spl-token-registry';
import { useEffect, useMemo } from "react";
import { PriceFeed, PriceServiceConnection } from '@pythnetwork/price-service-client';
import { SupportedTokens } from '../drift/drift-exports';
// import { PythConnection } from "@pythnetwork/client";


export function useGetBalance({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getBalance(address),
  });
}

export function useGetSignatures({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getConfirmedSignaturesForAddress2(address),
  });
}

export function useGetPythPrices() {
  const queryClient = useQueryClient();
  const pythConnection = useMemo(() => new PriceServiceConnection("https://hermes.pyth.network"), []);
  const PYTH_PRICES_QUERY_KEY = 'pyth-prices';
  const priceIds = SupportedTokens.map((token) => token.pythId)


  // React Query to fetch the initial prices
  const { data } = useQuery({
    queryKey: [PYTH_PRICES_QUERY_KEY] as const,
    queryFn: async () => {
      const priceFeeds: PriceFeed[] | undefined = await pythConnection.getLatestPriceFeeds(priceIds);
      if (!priceFeeds) return;
      return priceFeeds.reduce<Record<string, {conf: string, expo: number, price: string, publishTime: number} | undefined>>((acc, feed) => {
        acc[feed.id.toString()] = feed.getPriceNoOlderThan(60);
        return acc;
      }, {});
    },
    refetchInterval: 60000, // Refetch prices every minute
  });

  useEffect(() => {
    let isMounted = true;

    const setupSubscription = async () => {
      const handleUpdate = (priceFeed: PriceFeed) => {
        if (!isMounted) return;
        const updatedPrice = priceFeed.getPriceNoOlderThan(60);
        queryClient.setQueryData<Record<string, {conf: string, expo: number, price: string, publishTime: number} | undefined>>([PYTH_PRICES_QUERY_KEY], (oldData) => ({
          ...oldData,
          [priceFeed.id.toString()]: updatedPrice,
        }));
      };

      await pythConnection.subscribePriceFeedUpdates(priceIds, handleUpdate);
    };

    setupSubscription();

    // Clean up the subscription when the component unmounts
    return () => {
      isMounted = false;
      pythConnection.closeWebSocket(); // Close the WebSocket connection
    };
  }, [pythConnection, queryClient]);

  return { data };
}

export function useGetTokenAccounts({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: [
      'get-token-accounts',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      const [tokenAccounts, token2022Accounts, tokenList] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_PROGRAM_ID,
        }),
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        new TokenListProvider().resolve().then((tokens) => tokens.getList()),
      ]);

      const accounts = [...tokenAccounts.value, ...token2022Accounts.value];

      const tokenMap = new Map<string, TokenInfo>();
      tokenList.forEach((token) => {
        tokenMap.set(token.address, token);
      });

      return accounts.map((account) => {
        const mintAddress = account.account.data.parsed.info.mint;
        const tokenInfo = tokenMap.get(mintAddress);
        return {
          ...account,
          tokenInfo: tokenInfo ? {
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            logoURI: tokenInfo.logoURI,
          } : {
            name: mintAddress === "8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2" ? "USDC" : mintAddress === "9Su8ynv5xhMa12bfqQLkW1Y4aeSxQKD9EiaMNb1JQLay" ? "LINK" : 'Unknown Token',
            symbol: mintAddress === "8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2" ? "USDC" : mintAddress === "9Su8ynv5xhMa12bfqQLkW1Y4aeSxQKD9EiaMNb1JQLay" ? "LINK" : 'Unknown Token',
            logoURI: null,
          },
        };
      });
    },
  });
}

export function useTransferSol({ address }: { address: PublicKey }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'transfer-sol',
      { endpoint: connection.rpcEndpoint, address },
    ],
    mutationFn: async (input: { destination: PublicKey; amount: number }) => {
      let signature: TransactionSignature = '';
      try {
        const { transaction, latestBlockhash } = await createTransaction({
          publicKey: address,
          destination: input.destination,
          amount: input.amount,
          connection,
        });

        // Send transaction and await for signature
        signature = await wallet.sendTransaction(transaction, connection);

        // Send transaction and await for signature
        await connection.confirmTransaction(
          { signature, ...latestBlockhash },
          'confirmed'
        );

        console.log(signature);
        return signature;
      } catch (error: unknown) {
        console.log('error', `Transaction failed! ${error}`, signature);

        return;
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
      }
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-balance',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            'get-signatures',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
      ]);
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`);
    },
  });
}

export function useRequestAirdrop({ address }: { address: PublicKey }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['airdrop', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (amount: number = 1) => {
      const [latestBlockhash, signature] = await Promise.all([
        connection.getLatestBlockhash(),
        connection.requestAirdrop(address, amount * LAMPORTS_PER_SOL),
      ]);

      await connection.confirmTransaction(
        { signature, ...latestBlockhash },
        'confirmed'
      );
      return signature;
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-balance',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            'get-signatures',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
      ]);
    },
  });
}

async function createTransaction({
  publicKey,
  destination,
  amount,
  connection,
}: {
  publicKey: PublicKey;
  destination: PublicKey;
  amount: number;
  connection: Connection;
}): Promise<{
  transaction: VersionedTransaction;
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number };
}> {
  // Get the latest blockhash to use in our transaction
  const latestBlockhash = await connection.getLatestBlockhash();

  // Create instructions to send, in this case a simple transfer
  const instructions = [
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: destination,
      lamports: amount * LAMPORTS_PER_SOL,
    }),
  ];

  // Create a new TransactionMessage with version and compile it to legacy
  const messageLegacy = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToLegacyMessage();

  // Create a new VersionedTransaction which supports legacy and v0
  const transaction = new VersionedTransaction(messageLegacy);

  return {
    transaction,
    latestBlockhash,
  };
}
