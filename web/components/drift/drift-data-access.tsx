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
  UserAccount,
  findAllMarkets,
  PerpMarketAccount,
  PositionDirection,
  getMarketOrderParams,
  MarketType,
  getOrderParams,
  StateAccount,
  FeeTier
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
    // connection
   } = useDriftProgram();
  const [userPublicKey, setUserPublicKey] = useState<PublicKey | undefined>(undefined);
  const [statePublicKey, setStatePublicKey] = useState<PublicKey | undefined>(undefined);
  const [vaultPublicKey, setVaultPublicKey] = useState<PublicKey | undefined>(undefined);
  const [signerPublicKey, setSignerPublicKey] = useState<PublicKey | undefined>(undefined);
  const [userAccount, setUserAccount] = useState<UserAccount | undefined>(undefined);
  const [perpMarkets, setPerpMarkets] = useState<PerpMarketAccount[] | undefined>(undefined);
  const [fees, setFees] = useState<FeeTier | undefined>(undefined)
  const [, setIsLoadingPublicKeys] = useState(true);
  const [isLoadingPerpMarkets, setIsLoadingPerpMarkets] = useState(true);
  const [isLoadingUserAccount, setIsLoadingUserAccount] = useState(true);
  const [, setError] = useState<Error | undefined>(undefined);
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
      const stateAccountFetch = await program.account.state.fetch(stateAccount) as StateAccount
      setFees(stateAccountFetch.perpFeeStructure.feeTiers[0])
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


  const initializeUserAccountMutation = useMutation({
    mutationKey: ['drift', 'initializeUserAndStats', { cluster, account }],
    mutationFn: async () => {
      // Ensure keys are ready before proceeding
      if (!userPublicKey || !statePublicKey || !userStatsPublicKey) {
        throw new Error("Public keys are not ready.");
      }
      

      // Initialize User Stats transaction instruction
      const initializeUserStatsIx = await program.methods.initializeUserStats()
      .accounts({
        userStats: userStatsPublicKey,
        authority: account,
        payer: account,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        state: statePublicKey,
      })
      .instruction();

      // Initialize User transaction instruction
      const initializeUserIx = await program.methods.initializeUser(
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


      // Combine both instructions in a single transaction
      const tx = new Transaction()
      .add(initializeUserStatsIx) // If user has an account, skip
      .add(initializeUserIx);

      // Send the transaction
      const txSig = await provider.sendAndConfirm(tx);
      return txSig;
    },
    onSuccess: (txSig) => {
      transactionToast(txSig);
      fetchUserAccount();
    },
    onError: (error) => {
      console.error("Failed to initialize user and stats:", error);
    },
  });

  const depositMutation = useMutation({
    mutationKey: ['drift', 'depositFunds', { cluster, account }],
    mutationFn: async () => {
      // Create deposit instruction
      const depositInstruction = await program.methods.deposit(
        "0", // 0 usdc, 1 sol
        convertUSDCtoSmallestUnit(100), // setup conversion
        false
        ) // replace with actual 'reduceOnly' logic as needed
        .accounts({
            state: statePublicKey,
            spotMarketVault: vaultPublicKey,
            user: userPublicKey,
            userStats: userStatsPublicKey,
            userTokenAccount: pub.pubkey,
            authority: account,
            tokenProgram: TOKEN_PROGRAM_ID,
        }
        )
        .remainingAccounts([
          { pubkey: new PublicKey("5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7"), isWritable: false, isSigner: false }, 
          { pubkey: new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"), isWritable: true, isSigner: false }
        ]) 
        .instruction();

      const tx = new Transaction().add(depositInstruction);
      tx.feePayer = provider.wallet.publicKey;
      const txSig = await provider.sendAndConfirm(tx);
      return txSig;

    },
    onSuccess: (txSig) => {
      transactionToast(txSig);
      fetchUserAccount();
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

  // I will need to know the users collateral requirements and current collateral to make sure the trade goes through
  // I will need to pass the baseAssetAmount
  // I will need to pass the marketIndex
  // the ui will need to know the basic questions around expected collateral and blah blah blah
  const openHedgeMutation = useMutation({
    mutationKey: ['drift', 'openHedge', { cluster, account }],
    mutationFn: async ({ baseAssetAmount, marketIndex }: {baseAssetAmount: number, marketIndex: number}) => {
      const orderParams = getMarketOrderParams({
        baseAssetAmount: baseAssetAmount,
        direction: PositionDirection.SHORT,
        marketIndex: marketIndex,
      });
      // Create deposit instruction
      const openHedgeInstruction = await program.methods.placePerpOrder(
        getOrderParams(orderParams, { MarketType: MarketType.PERP})
        ) // replace with actual 'reduceOnly' logic as needed
        .accounts({
            state: statePublicKey,
            spotMarketVault: vaultPublicKey,
            user: userPublicKey,
            userStats: userStatsPublicKey,
            authority: account,
        }
        )
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

      const tx = new Transaction().add(openHedgeInstruction);
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
    },
    onError: (error) => {
      console.error("Failed to deposit funds:", error);
    },
  });

  const closeHedgeMutation = useMutation({
    mutationKey: ['drift', 'closeHedge', { cluster, account }],
    mutationFn: async () => {
      const orderParams = getMarketOrderParams({
        baseAssetAmount: new anchor.BN(1).mul(BASE_PRECISION),
        direction: PositionDirection.LONG,
        marketIndex: 16,
        reduceOnly: true,
      });
      // Create deposit instruction
      const openHedgeInstruction = await program.methods.placePerpOrder(
        getOrderParams(orderParams, { MarketType: MarketType.PERP})
        ) // replace with actual 'reduceOnly' logic as needed
        .accounts({
            state: statePublicKey,
            spotMarketVault: vaultPublicKey,
            user: userPublicKey,
            userStats: userStatsPublicKey,
            authority: account,
        }
        )
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

      const tx = new Transaction().add(openHedgeInstruction);
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
    },
    onError: (error) => {
      console.error("Failed to deposit funds:", error);
    },
  });

  return {
    initializeUserAccountMutation,
    depositMutation,
    withdrawMutation,
    openHedgeMutation,
    closeHedgeMutation,
    userAccount,
    perpMarkets,
    isLoadingUserAccount,
    isLoadingPerpMarkets,
    refetchPerpMarkets: fetchPerpMarkets,
    refetchUserAccount: fetchUserAccount, 
    fees
  };
}
