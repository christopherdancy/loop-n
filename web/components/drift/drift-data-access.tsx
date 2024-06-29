'use client';

import { 
  getDriftProgramId, 
  DEFAULT_USER_NAME, 
  encodeName, 
  getUserAccountPublicKey, 
  getDriftStateAccountPublicKey, 
  getUserStatsAccountPublicKey, 
  getSpotMarketVaultPublicKey, 
  convertUSDCtoSmallestUnit,
  getDriftSignerPublicKey,
  findAllMarkets,
  getMarketOrderParams,
  getOrderParams,
} from './drift-exports';
import { Program } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import { useConnection } from '@solana/wallet-adapter-react';
import { Cluster, PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useCluster } from '../cluster/cluster-data-access';
import { useAnchorProvider } from '../solana/solana-provider';
import { useTransactionToast } from '../ui/ui-layout';
import DriftIDL from './drift.json'
import { FeeTier, MarketType, PerpMarketAccount, PerpPosition, PositionDirection, StateAccount, UserAccount } from './types';
import { calculateInitUserFee, getRentExemptBalance, getRentCost } from './state';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function useDriftProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getDriftProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = new Program(JSON.parse(JSON.stringify(DriftIDL)), programId, provider);

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  return {
    program,
    programId,
    getProgramAccount,
    provider,
    cluster,
    connection
  };
}

// todo: deposit method + create short + close short (test functionality)
// todo: read account + balance + open position 
// todo: configure short and deposit based on sol balance + value (POC)
export function useDriftProgramAccount(account: PublicKey) {
  const transactionToast = useTransactionToast();
  const { 
    program, 
    provider, 
    cluster, 
    connection
   } = useDriftProgram();
  const [userPublicKey, setUserPublicKey] = useState<PublicKey | undefined>(undefined);
  const [statePublicKey, setStatePublicKey] = useState<PublicKey | undefined>(undefined);
  const [vaultPublicKey, setVaultPublicKey] = useState<PublicKey | undefined>(undefined);
  const [signerPublicKey, setSignerPublicKey] = useState<PublicKey | undefined>(undefined);
  const [userAccount, setUserAccount] = useState<UserAccount | undefined>(undefined);
  const [perpMarkets, setPerpMarkets] = useState<PerpMarketAccount[] | undefined>(undefined);
  const [fees, setFees] = useState<{initUserFee: string, rentFee: number, rentExemptBalance: number,  tradeFees: FeeTier} | undefined>(undefined)
  const [, setIsLoadingPublicKeys] = useState(true);
  const [isLoadingPerpMarkets, setIsLoadingPerpMarkets] = useState(true);
  const [isLoadingUserAccount, setIsLoadingUserAccount] = useState(true);
  const [error2, setError] = useState<Error | undefined>(undefined);
  const userStatsPublicKey = getUserStatsAccountPublicKey(program.programId, account);

  const pub = { pubkey: new PublicKey("BwBL7eWa9XABw4QzwAnDxeVPcgHWhtbbaNUYLmiThVmj"), isWritable: true, isSigner: false };

  const fetchPublicKeys = async () => {
    setIsLoadingPublicKeys(true);
    setError(undefined);
    try {
      const user = await getUserAccountPublicKey(program.programId, account, 0);
      const stateAccount = await getDriftStateAccountPublicKey(program.programId);
      const vault = await getSpotMarketVaultPublicKey(program.programId, 0);
      const signer = await getDriftSignerPublicKey(program.programId);
      const stateAccountFetch = await program.account.state.fetch(stateAccount) as StateAccount;
      setFees(
        {
          initUserFee: calculateInitUserFee(stateAccountFetch), 
          rentFee: await getRentCost(connection, program.account.user.size + program.account.userStats.size, 2), 
          rentExemptBalance: await getRentExemptBalance(connection, program.account.user.size), 
          tradeFees:stateAccountFetch.perpFeeStructure.feeTiers[0]
        }
      )
      setUserPublicKey(user);
      setStatePublicKey(stateAccount);
      setVaultPublicKey(vault);
      setSignerPublicKey(signer);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoadingPublicKeys(false);
    }
  };
  

  const fetchUserAccount = async () => {
    setIsLoadingUserAccount(true);
    setError(undefined);
    try {
      const user = await getUserAccountPublicKey(program.programId, account, 0);
      const userAccountData = await program.account.user.fetch(user) as UserAccount;
      setUserAccount(userAccountData);
    } catch (fetchError) {
      setError(new Error("User account does not exist."));
      setUserAccount(undefined);
    } finally {
      setIsLoadingUserAccount(false);
    }
  };

  const fetchPerpMarkets = async () => {
    setIsLoadingPerpMarkets(true);
    setError(undefined);
    try {
      const perpMarkets = (await findAllMarkets(program)).perpMarkets
      setPerpMarkets(perpMarkets);
    } catch (fetchError) {
      setError(new Error("Perp accounts does not exist."));
      setPerpMarkets(undefined);
    } finally {
      setIsLoadingPerpMarkets(false);
    }
  };


  useEffect(() => {
    fetchPublicKeys();
    fetchUserAccount();
    fetchPerpMarkets();
  }, [program.programId, account]);
  

  const loopnHedgeMutation = useMutation({
    mutationKey: ['drift', 'initializeUserAndStats', { cluster, account }],
    mutationFn: async ({ usdcDeposit, baseAssetAmount, marketIndex, simulate }:{ usdcDeposit: number, baseAssetAmount: number, marketIndex: number, simulate: boolean } ) => {
      if (!userPublicKey || !statePublicKey || !userStatsPublicKey) {
        throw new Error("Public keys are not ready.");
      }
  
      const initializeUserStatsIx = await createInitializeUserStatsIx(program, statePublicKey, userStatsPublicKey, account);
      const initializeUserIx = await createInitializeUserIx(program, statePublicKey, userPublicKey, userStatsPublicKey, account);
      const depositIx = await createDepositIx(program, statePublicKey, vaultPublicKey, userPublicKey, userStatsPublicKey, pub, account, usdcDeposit);
      const hedgeIx = await createHedgeIx(program, statePublicKey, vaultPublicKey, userPublicKey, userStatsPublicKey, account, baseAssetAmount, marketIndex, PositionDirection.SHORT);
  
      let tx;
      if (!userAccount) {
        tx = new Transaction()
          .add(initializeUserStatsIx)
          .add(initializeUserIx)
          .add(depositIx)
          .add(hedgeIx);
      } else {
        tx = new Transaction()
          .add(depositIx)
          .add(hedgeIx);
      }

      tx.feePayer = provider.wallet.publicKey;
      if (simulate) {
        const simulationResult = await connection.simulateTransaction(tx);
        if (simulationResult.value.err) {
          console.log("Simulation error:", simulationResult.value.logs);
        } else {
          console.log(simulationResult);
        }
      } else {
        const txSig = await provider.sendAndConfirm(tx);
        return txSig;
      }

      return "simulate" 
    },
    onSuccess: (txSig) => {
      transactionToast(txSig);
      fetchUserAccount()
    },
    onError: (error) => {
      console.error("Failed to initialize user and stats:", error);
    },
  });

  const closeHedgeMutation = useMutation({
    mutationKey: ['drift', 'closeHedge', { cluster, account }],
    mutationFn: async ({ pos, simulate }:{ pos: PerpPosition, simulate: boolean } ) => {
      if (!userPublicKey || !statePublicKey || !userStatsPublicKey) {
        throw new Error("Public keys are not ready.");
      }
      const hedgeIx = await createHedgeIx(program, statePublicKey, vaultPublicKey, userPublicKey, userStatsPublicKey, account, pos.baseAssetAmount, pos.marketIndex, PositionDirection.LONG);
      
      const tx = new Transaction()
          .add(hedgeIx);

      tx.feePayer = provider.wallet.publicKey;
      if (simulate) {
        const simulationResult = await connection.simulateTransaction(tx);
        if (simulationResult.value.err) {
          console.log("Simulation error:", simulationResult.value.logs);
        } else {
          console.log(simulationResult);
        }
      } else {
        const txSig = await provider.sendAndConfirm(tx);
        return txSig;
      }
      return "simulate"
    },
    onSuccess: (txSig) => {
      transactionToast(txSig);
    },
    onError: (error) => {
      console.error("Failed to deposit funds:", error);
    },
  });
  
  const cancelOrderMutation = useMutation({
    mutationKey: ['drift', 'closeHedge', { cluster, account }],
    mutationFn: async ({ orderId, simulate }:{ orderId: number, simulate: boolean } ) => {
      if (!userPublicKey || !statePublicKey || !userStatsPublicKey) {
        throw new Error("Public keys are not ready.");
      }
      const cancelIx = await createCancelOrderIx(program, statePublicKey, userPublicKey, account, orderId);
      
      const tx = new Transaction()
          .add(cancelIx);

      tx.feePayer = provider.wallet.publicKey;
      if (simulate) {
        const simulationResult = await connection.simulateTransaction(tx);
        if (simulationResult.value.err) {
          console.log("Simulation error:", simulationResult.value.logs);
        } else {
          console.log(simulationResult);
        }
      } else {
        const txSig = await provider.sendAndConfirm(tx);
        return txSig;
      }
      return "simulate"
    },
    onSuccess: (txSig) => {
      transactionToast(txSig);
    },
    onError: (error) => {
      console.error("Failed to deposit funds:", error);
    },
  });

  const withdrawMutation = useMutation({
    mutationKey: ['drift', 'withdrawFunds', { cluster, account }],
    mutationFn: async () => {
      // Create deposit instruction
      const withdrawInstruction = await program.methods.withdraw(
        "0", // 0 usdc, 1 sol
        convertUSDCtoSmallestUnit(100), // setup conversion
        true
        ) // replace with actual 'reduceOnly' logic as needed
        .accounts({
            state: statePublicKey,
            spotMarketVault: vaultPublicKey,
            user: userPublicKey,
            userStats: userStatsPublicKey,
            userTokenAccount: pub.pubkey,
            authority: account,
            tokenProgram: TOKEN_PROGRAM_ID,
            driftSigner: signerPublicKey,
        }
        )
        .remainingAccounts([
          { pubkey: new PublicKey("5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7"), isWritable: false, isSigner: false }, 
          { pubkey: new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"), isWritable: true, isSigner: false }, 
          { pubkey: new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"), isWritable: true, isSigner: false }, 
          { pubkey: new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"), isWritable: true, isSigner: false }
        ]) 
        .instruction();

      const tx = new Transaction().add(withdrawInstruction);
      tx.feePayer = provider.wallet.publicKey;
      const txSig = await provider.sendAndConfirm(tx);
      return txSig;

      // const simulationResult = await connection.simulateTransaction(tx);
      // if (simulationResult.value.err) {
      //   console.log("Simulation error:", simulationResult.value.logs);
      // }
    },
    onSuccess: (txSig) => {
      transactionToast(txSig);
      fetchUserAccount()
    },
    onError: (error) => {
      console.error("Failed to deposit funds:", error);
    },
  });

  return {
    loopnHedgeMutation,
    withdrawMutation,
    closeHedgeMutation,
    cancelOrderMutation,
    userAccount,
    perpMarkets,
    isLoadingUserAccount,
    isLoadingPerpMarkets,
    refetchPerpMarkets: fetchPerpMarkets,
    refetchUserAccount: fetchUserAccount, 
    fees
  };
}

const createInitializeUserStatsIx = async (program: Program<any>, statePublicKey: anchor.web3.PublicKey, userStatsPublicKey: anchor.web3.PublicKey, account: anchor.web3.PublicKey) => {
  return await program.methods.initializeUserStats()
    .accounts({
      userStats: userStatsPublicKey,
      authority: account,
      payer: account,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      state: statePublicKey,
    })
    .instruction();
};

const createInitializeUserIx = async (program: Program<any>, statePublicKey: anchor.web3.PublicKey, userPublicKey: anchor.web3.PublicKey, userStatsPublicKey: anchor.web3.PublicKey, account: anchor.web3.PublicKey) => {
  return await program.methods.initializeUser(
    0, // subAccountId
    encodeName(DEFAULT_USER_NAME) // userName
  )
    .accounts({
      user: userPublicKey,
      userStats: userStatsPublicKey,
      authority: account,
      payer: account,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      state: statePublicKey,
    })
    .instruction();
};

const createDepositIx = async (program: Program<any>, statePublicKey: anchor.web3.PublicKey, vaultPublicKey: anchor.web3.PublicKey | undefined, userPublicKey: anchor.web3.PublicKey, userStatsPublicKey: anchor.web3.PublicKey, pub: { pubkey: any; isWritable?: boolean; isSigner?: boolean; }, account: anchor.web3.PublicKey, usdcDeposit: number) => {
  return await program.methods.deposit(
    "0", // 0 usdc, 1 sol
    convertUSDCtoSmallestUnit(usdcDeposit), // setup conversion
    false // replace with actual 'reduceOnly' logic as needed
  )
    .accounts({
      state: statePublicKey,
      spotMarketVault: vaultPublicKey,
      user: userPublicKey,
      userStats: userStatsPublicKey,
      userTokenAccount: pub.pubkey,
      authority: account,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts([
      { pubkey: new PublicKey("5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"), isWritable: true, isSigner: false }
    ])
    .instruction();
};

const createCancelOrderIx = async (program: Program<any>, statePublicKey: anchor.web3.PublicKey, userPublicKey: anchor.web3.PublicKey, account: anchor.web3.PublicKey, orderId: number) => {
  return await program.methods.cancelOrder(
    orderId,
  )
    .accounts({
      state: statePublicKey,
      user: userPublicKey,
      authority: account,
    })
    .remainingAccounts([
      { pubkey: new PublicKey("5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("HNStfhaLnqwF2ZtJUizaA9uHDAVB976r2AgTUx9LrdEo"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("9sGidS4qUXS2WvHZFhzw4df1jNd5TvUGZXZVsSjXo7UF"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("25Eax9W8SA3wpCQFhJEGyHhQ2NDHEshZEDzyMNtthR8D"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("3a7HAEqxzwvJEAViYKhDtHk85mrFf1dU2HCsffgXxUj8"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("8UJgxaiQx5nTrdDgph5FiahMmzduuLTLf5WmsPegYA6W"), isWritable: false, isSigner: false },
    ])
    .instruction();
};

const createHedgeIx = async (program: Program<any>, statePublicKey: anchor.web3.PublicKey, vaultPublicKey: anchor.web3.PublicKey | undefined, userPublicKey: anchor.web3.PublicKey, userStatsPublicKey: anchor.web3.PublicKey, account: anchor.web3.PublicKey, baseAssetAmount: number, marketIndex: number, direction: PositionDirection) => {
  return await program.methods.placePerpOrder(
    getOrderParams(
      getMarketOrderParams({
        baseAssetAmount: baseAssetAmount,
        direction: direction,
        marketIndex: marketIndex,
      }),
      { MarketType: MarketType.PERP }
    )
  )
    .accounts({
      state: statePublicKey,
      spotMarketVault: vaultPublicKey,
      user: userPublicKey,
      userStats: userStatsPublicKey,
      authority: account,
    })
    .remainingAccounts([
      { pubkey: new PublicKey("5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("BM2UWqREbt7ktsPCA438dqAVqhU7UZFVg11CQyPXFr49"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("9sGidS4qUXS2WvHZFhzw4df1jNd5TvUGZXZVsSjXo7UF"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("HNStfhaLnqwF2ZtJUizaA9uHDAVB976r2AgTUx9LrdEo"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("4L6YhY8VvUgmqG5MvJkUJATtzB2rFqdrJwQCmFLv4Jzy"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("Mr2XZwj1NisUur3WZWdERdqnEUMoa9F9pUr52vqHyqj"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("8BbCGbxsQk1HYohgdn1TMUNs6RYcX4Hae3k8mt4rvnzf"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("3a7HAEqxzwvJEAViYKhDtHk85mrFf1dU2HCsffgXxUj8"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("25Eax9W8SA3wpCQFhJEGyHhQ2NDHEshZEDzyMNtthR8D"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("48R9ic9xgigVRqNPbABN8gTGoRV9wn6UUmcKYz3csbhR"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("8UJgxaiQx5nTrdDgph5FiahMmzduuLTLf5WmsPegYA6W"), isWritable: true, isSigner: false },
      { pubkey: new PublicKey("9vFnv3T4SdiKV4ecenKys4BZyYXE1CNSQH6rsVUngAgB"), isWritable: true, isSigner: false },
      { pubkey: new PublicKey("6HBFJwNouN5sFDQRXbZ7iEyWK3jkpCu6PPJUENdPP4wL"), isWritable: true, isSigner: false },
    ])
    .instruction();
};

