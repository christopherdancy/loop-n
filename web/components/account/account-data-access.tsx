'use client';

import { useConnection } from '@solana/wallet-adapter-react';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  Connection,
  PublicKey,
} from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { TokenListProvider, TokenInfo } from '@solana/spl-token-registry';

export function useGetBalance({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getBalance(address),
  });
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
            name: mintAddress === "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" ? "WIF" : mintAddress === "9Su8ynv5xhMa12bfqQLkW1Y4aeSxQKD9EiaMNb1JQLay" ? "LINK" : 'Unknown Token',
            symbol: mintAddress === "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" ? "WIF" : mintAddress === "9Su8ynv5xhMa12bfqQLkW1Y4aeSxQKD9EiaMNb1JQLay" ? "LINK" : 'Unknown Token',
            logoURI: null,
          },
        };
      });
    },
  });
}

export async function getUSDCAccount(connection: Connection, address: PublicKey): Promise<PublicKey> {
  const tokenAccounts = await connection.getTokenAccountsByOwner(address, {
    mint: new PublicKey('8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2'), // todo: adjust by cluster
    programId: TOKEN_PROGRAM_ID,
  });

  if (!tokenAccounts.value.length) {
    throw new Error('User does not have a USDC token account');
  }

  // Assuming the user has only one USDC account
  return tokenAccounts.value[0].pubkey;
}