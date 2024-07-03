'use client';

import { 
  encodeName, 
} from './utils/user-utils';
import { 
  convertUSDCtoSmallestUnit,
} from './utils/math-utils';
import { 
  DEFAULT_USER_NAME,
  PRICE_PRECISION,
} from './utils/constants';
import { 
  findAllMarkets,
} from './utils/perp-utils';
import { 
  getDriftStateAccountPublicKey,
  getUserStatsAccountPublicKey,
  getSpotMarketVaultPublicKey,
  getDriftSignerPublicKey,
  getUserAccountPublicKey,
  getDriftProgramId
} from './utils/program-utils';
import { calculateInitUserFee, getRentExemptBalance, getRentCost } from './utils/state-utils';
import { getOrderParams, getTriggerLimitOrderParams } from './utils/order-utils';
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
import DriftIDL from './idl.json'
import { FeeTier, MarketType, OrderTriggerCondition, PerpMarketAccount, PositionDirection, StateAccount, UserAccount } from './types';

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
export function useDriftProgramMarketData() {
  const { 
    program,
    connection
   } = useDriftProgram();
  const [perpMarkets, setPerpMarkets] = useState<PerpMarketAccount[] | undefined>(undefined);
  const [fees, setFees] = useState<{initUserFee: string, rentFee: number, rentExemptBalance: number,  tradeFees: FeeTier} | undefined>(undefined)

  const fetchPerpMarkets = async () => {
    try {
      const markets = (await findAllMarkets(program)).perpMarkets
      setPerpMarkets(markets);
    } catch (fetchError) {
      console.log(new Error("Perp accounts does not exist." + fetchError));
    }
  };

  const fetchMarketFees = async () => {
    try {
      const stateAccountPublicKey = await getDriftStateAccountPublicKey(program.programId);
      const stateAccountData = await program.account.state.fetch(stateAccountPublicKey) as StateAccount;
      setFees(
        {
          initUserFee: calculateInitUserFee(stateAccountData), 
          rentFee: await getRentCost(connection, program.account.user.size + program.account.userStats.size, 2), 
          rentExemptBalance: await getRentExemptBalance(connection, program.account.user.size), 
          tradeFees:stateAccountData.perpFeeStructure.feeTiers[0]
        }
      )
    } catch (fetchError) {
      console.log(new Error("State account does not exist." + fetchError));
    }
  };


  useEffect(() => {
    fetchPerpMarkets();
    fetchMarketFees()
  }, [program.programId]);
  

  return {
    perpMarkets,
    fees
  };
}

export function useDriftProgramAccount(account?: PublicKey) {
  const transactionToast = useTransactionToast();
  const { 
    program, 
    provider, 
    cluster, 
    connection
   } = useDriftProgram();
  const [userPublicKey, setUserPublicKey] = useState<PublicKey | undefined>(undefined);
  const [userStatsPublicKey, setUserStatsPublicKey] = useState<PublicKey | undefined>(undefined);
  const [statePublicKey, setStatePublicKey] = useState<PublicKey | undefined>(undefined);
  const [vaultPublicKey, setVaultPublicKey] = useState<PublicKey | undefined>(undefined);
  const [signerPublicKey, setSignerPublicKey] = useState<PublicKey | undefined>(undefined);
  const [userAccount, setUserAccount] = useState<UserAccount | undefined>(undefined);
  const [, setIsLoadingPublicKeys] = useState(true);
  const [isLoadingUserAccount, setIsLoadingUserAccount] = useState(true);

  // todo: this is the token account
  const pub = { pubkey: new PublicKey("EW3XKFY7ftPJJeRQPzvmk17Lzi4Azyqt3BJBX4rSDB1A"), isWritable: true, isSigner: false };

  const fetchPublicKeys = async () => {
    if (!account) return;
    setIsLoadingPublicKeys(true);
    try {
      setUserPublicKey(await getUserAccountPublicKey(program.programId, account, 0));
      setUserStatsPublicKey(getUserStatsAccountPublicKey(program.programId, account))
      setStatePublicKey(await getDriftStateAccountPublicKey(program.programId));
      setVaultPublicKey(await getSpotMarketVaultPublicKey(program.programId, 0));
      setSignerPublicKey(await getDriftSignerPublicKey(program.programId));
      
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingPublicKeys(false);
    }
  };
  

  const fetchUserAccount = async () => {
    if (!account) return;
    setIsLoadingUserAccount(true);
    try {
      const user = await getUserAccountPublicKey(program.programId, account, 0);
      const userAccountData = await program.account.user.fetch(user) as UserAccount;
      setUserAccount(userAccountData);
    } catch (fetchError) {
      console.error("User account does not exist.")
      setUserAccount(undefined);
    } finally {
      setIsLoadingUserAccount(false);
    }
  };


  useEffect(() => {
    if (account) {
      fetchPublicKeys();
      fetchUserAccount();
    }
  }, [program.programId, account]);
  

  // change function to a limit order + stop loss
  const loopnHedgeMutation = useMutation({
    mutationKey: ['drift', 'initializeUserAndStats', { cluster, account }],
    mutationFn: async ({ usdcDeposit, baseAssetAmount, marketIndex, price, stopLossPrice, simulate }:{ usdcDeposit: number, baseAssetAmount: number, marketIndex: number, price: number, stopLossPrice: number, simulate: boolean } ) => {
      if (!account) {
        throw new Error("Account is not connected.");
      };

      if (!userPublicKey || !statePublicKey || !userStatsPublicKey) {
        throw new Error("Public keys are not ready.");
      }
  
      const initializeUserStatsIx = await createInitializeUserStatsIx(program, statePublicKey, userStatsPublicKey, account);
      const initializeUserIx = await createInitializeUserIx(program, statePublicKey, userPublicKey, userStatsPublicKey, account);
      const depositIx = await createDepositIx(program, statePublicKey, vaultPublicKey, userPublicKey, userStatsPublicKey, pub, account, usdcDeposit);
      const hedgeIx = await createHedgeIx(program, statePublicKey, vaultPublicKey, userPublicKey, userStatsPublicKey, account, baseAssetAmount, marketIndex, price);
      const stopLossIx = await createStopLossIx(program, statePublicKey, vaultPublicKey, userPublicKey, userStatsPublicKey, account, baseAssetAmount, marketIndex, price, stopLossPrice);
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
          .add(hedgeIx)
          .add(stopLossIx);
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
  
  const cancelOrderMutation = useMutation({
    mutationKey: ['drift', 'closeHedge', { cluster, account }],
    mutationFn: async ({ orderId, simulate }:{ orderId: number, simulate: boolean } ) => {
      if (!account) {
        throw new Error("Account is not connected.");
      };

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
      if (!account) {
        throw new Error("Account is not connected.");
      };
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
    cancelOrderMutation,
    userAccount,
    isLoadingUserAccount,
    userPublicKey
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
      { pubkey: new PublicKey("Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("E4v1BBgoso9s64TQvmyownAVJbhbEPGyzA3qn4n46qj9"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"), isWritable: true, isSigner: false },
      { pubkey: new PublicKey("Mr2XZwj1NisUur3WZWdERdqnEUMoa9F9pUr52vqHyqj"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("8UJgxaiQx5nTrdDgph5FiahMmzduuLTLf5WmsPegYA6W"), isWritable: false, isSigner: false },
    ])
    .instruction();
};

// better price percision + test actual fill rates - lots of configuration to be done
const createHedgeIx = async (program: Program<any>, statePublicKey: anchor.web3.PublicKey, vaultPublicKey: anchor.web3.PublicKey | undefined, userPublicKey: anchor.web3.PublicKey, userStatsPublicKey: anchor.web3.PublicKey, account: anchor.web3.PublicKey, baseAssetAmount: number, marketIndex: number, price: number) => {
  return await program.methods.placePerpOrder(
    getOrderParams(
      getTriggerLimitOrderParams({
        marketIndex,
        direction: PositionDirection.SHORT,
        baseAssetAmount: baseAssetAmount,
        price: new anchor.BN(price).mul(PRICE_PRECISION),
        auctionStartPrice: new anchor.BN(price).mul(PRICE_PRECISION),
        triggerCondition: OrderTriggerCondition.BELOW,
        triggerPrice: new anchor.BN(price + 1).mul(PRICE_PRECISION)
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
      { pubkey: new PublicKey("Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("E4v1BBgoso9s64TQvmyownAVJbhbEPGyzA3qn4n46qj9"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("Mr2XZwj1NisUur3WZWdERdqnEUMoa9F9pUr52vqHyqj"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("8UJgxaiQx5nTrdDgph5FiahMmzduuLTLf5WmsPegYA6W"), isWritable: true, isSigner: false },
    ])
    .instruction();
};

const createStopLossIx = async (program: Program<any>, statePublicKey: anchor.web3.PublicKey, vaultPublicKey: anchor.web3.PublicKey | undefined, userPublicKey: anchor.web3.PublicKey, userStatsPublicKey: anchor.web3.PublicKey, account: anchor.web3.PublicKey, baseAssetAmount: number, marketIndex: number, price: number, stopLossPrice: number) => {
  return await program.methods.placePerpOrder(
    getOrderParams(
      getTriggerLimitOrderParams({
        marketIndex,
        direction: PositionDirection.LONG,
        baseAssetAmount: baseAssetAmount,
        price: new anchor.BN(stopLossPrice).mul(PRICE_PRECISION),
        auctionStartPrice: new anchor.BN(price).mul(PRICE_PRECISION),
        triggerCondition: OrderTriggerCondition.ABOVE,
        triggerPrice: new anchor.BN(price).mul(PRICE_PRECISION),
        reduceOnly: true
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
      { pubkey: new PublicKey("Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("E4v1BBgoso9s64TQvmyownAVJbhbEPGyzA3qn4n46qj9"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("Mr2XZwj1NisUur3WZWdERdqnEUMoa9F9pUr52vqHyqj"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("8UJgxaiQx5nTrdDgph5FiahMmzduuLTLf5WmsPegYA6W"), isWritable: true, isSigner: false },
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

