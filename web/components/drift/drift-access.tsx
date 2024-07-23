'use client';

import { 
  encodeName, 
} from './utils/user-utils';
import { 
  convertUSDCtoSmallestUnit,
} from './utils/math-utils';
import { 
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
import { Cluster, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useCluster } from '../cluster/cluster-data-access';
import { useAnchorProvider } from '../solana/solana-provider';
import { useTransactionToast } from '../ui/ui-layout';
import DriftIDL from './idl.json'
import { FeeTier, MarketType, OrderTriggerCondition, PerpMarketAccount, PositionDirection, StateAccount, UserAccount, UserStatsAccount } from './types';
import { getUSDCAccount } from '../account/account-data-access';

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
      // console.log(new Error("Perp accounts does not exist." + fetchError));
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
  const [userStatsPublicKey, setUserStatsPublicKey] = useState<PublicKey | undefined>(undefined);
  const [userPublicKey, setUserPublicKey] = useState<PublicKey | undefined>(undefined);
  const [statePublicKey, setStatePublicKey] = useState<PublicKey | undefined>(undefined);
  const [vaultPublicKey, setVaultPublicKey] = useState<PublicKey | undefined>(undefined);
  const [subAccountId, setSubAccountId] = useState(0);
  const [signerPublicKey, setSignerPublicKey] = useState<PublicKey | undefined>(undefined);

  const [subAccountData, setSubAccountData] = useState<UserAccount[] | undefined>(undefined);
  
  const fetchPublicKeys = async () => {
    if (!account) return;
    try {
      const userStatsPublicKey = getUserStatsAccountPublicKey(program.programId, account)
      setUserStatsPublicKey(userStatsPublicKey)
      let subAccountId;
      try {
        subAccountId = (await program.account.userStats.fetch(userStatsPublicKey) as UserStatsAccount).numberOfSubAccounts;
      } catch {
        subAccountId = 0
      }
      setSubAccountId(subAccountId)
      // user account public key should be based on new subAccount
      setUserPublicKey(await getUserAccountPublicKey(program.programId, account, subAccountId));
      setStatePublicKey(await getDriftStateAccountPublicKey(program.programId));
      setVaultPublicKey(await getSpotMarketVaultPublicKey(program.programId, 0));
      setSignerPublicKey(await getDriftSignerPublicKey(program.programId));
      
    } catch (err) {
      console.error(err)
    } finally {
    }
  };

  const fetchSubAccountData = async () => {
    if (!account) return;
    try {
      const userStatsPublicKey = getUserStatsAccountPublicKey(program.programId, account)
      const userStatsData = await program.account.userStats.fetch(userStatsPublicKey) as UserStatsAccount;
      let userSubAccounts: UserAccount[] = [];
      for (let i = 0; i < userStatsData.numberOfSubAccountsCreated; i++) {
        const subAccount = await getUserAccountPublicKey(program.programId, account, i);
        const subAccountData = await program.account.user.fetch(subAccount) as UserAccount;
        userSubAccounts.push(subAccountData);
      }
      
      setSubAccountData(userSubAccounts);
    } catch (fetchError) {
      console.error("Positions do not exist.")
      setSubAccountData(undefined);
    } finally {
    }
  };


  useEffect(() => {
    if (account) {
      fetchPublicKeys();
      fetchSubAccountData();
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
      const initializeUserIx = await createInitializeUserIx(program, statePublicKey, userPublicKey, userStatsPublicKey, account, subAccountId);
      const depositIx = await createDepositIx(program, statePublicKey, vaultPublicKey, userPublicKey, userStatsPublicKey, account, usdcDeposit, connection);
      const hedgeIx = await createHedgeIx(program, statePublicKey, vaultPublicKey, userPublicKey, userStatsPublicKey, account, baseAssetAmount, marketIndex, price);
      const stopLossIx = await createStopLossIx(program, statePublicKey, vaultPublicKey, userPublicKey, userStatsPublicKey, account, baseAssetAmount, marketIndex, price, stopLossPrice);
      let tx = new Transaction();
      if (subAccountId === 0 && !(await checkIfAccountExists(account, connection))) {
        tx.add(initializeUserStatsIx)
      } 
        tx
        .add(initializeUserIx)
        .add(depositIx)
        .add(hedgeIx)
        .add(stopLossIx);

      tx.feePayer = provider.wallet.publicKey;
      if (false) {
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
      fetchSubAccountData();
    },
    onError: (error) => {
      console.error("Failed to create hedge:", error);
    },
  });
  
  // todo: return collateral(deposit) + remove all orders + return claimable rent
  const cancelOrderMutation = useMutation({
    mutationKey: ['drift', 'cancelOrder', { cluster, account }],
    mutationFn: async ({ openId, closeId, subAccountId, simulate }:{ openId: number, closeId: number, subAccountId: number, simulate: boolean } ) => {
      if (!account) {
        throw new Error("Account is not connected.");
      };
      // reinit userpubkey with proper subaccountId
      const userPublicKey = await getUserAccountPublicKey(program.programId, account, subAccountId)

      if (!userPublicKey || !statePublicKey || !userStatsPublicKey) {
        throw new Error("Public keys are not ready.");
      }
      const cancelOpenIx = await createCancelOrderIx(program, statePublicKey, userPublicKey, account, openId);
      const cancelCloseIx = await createCancelOrderIx(program, statePublicKey, userPublicKey, account, closeId);
      
      const tx = new Transaction()
          .add(cancelOpenIx)
          .add(cancelCloseIx);

      tx.feePayer = provider.wallet.publicKey;
      if (false) {
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
      fetchSubAccountData();
    },
    onError: (error) => {
      console.error("Failed to cancel order:", error);
    },
  });

  return {
    loopnHedgeMutation,
    cancelOrderMutation,
    subAccountData
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

const createInitializeUserIx = async (program: Program<any>, statePublicKey: anchor.web3.PublicKey, userPublicKey: anchor.web3.PublicKey, userStatsPublicKey: anchor.web3.PublicKey, account: anchor.web3.PublicKey, id: number) => {
  return await program.methods.initializeUser(
    id, // subAccountId
    encodeName(`subaccount:${id}`) // userName
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

const createDepositIx = async (program: Program<any>, statePublicKey: anchor.web3.PublicKey, vaultPublicKey: anchor.web3.PublicKey | undefined, userPublicKey: anchor.web3.PublicKey, userStatsPublicKey: anchor.web3.PublicKey, account: anchor.web3.PublicKey, usdcDeposit: number, connection: Connection) => {
  const userUSDCAccount = await getUSDCAccount(connection, account)
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
      userTokenAccount: userUSDCAccount,
      authority: account,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts([
      { pubkey: new PublicKey("5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("6bEp2MiyoiiiDxcVqE8rUHQWwHirXUXtKfAEATTVqNzT"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("Gwvob7yoLMgQRVWjScCRyQFMsgpRKrSAYisYEyjDJwEp"), isWritable: true, isSigner: false },
      { pubkey: new PublicKey("BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"), isWritable: true, isSigner: false },
      { pubkey: new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"), isWritable: true, isSigner: false },
      { pubkey: new PublicKey("25Eax9W8SA3wpCQFhJEGyHhQ2NDHEshZEDzyMNtthR8D"), isWritable: true, isSigner: false },
      { pubkey: new PublicKey("3a7HAEqxzwvJEAViYKhDtHk85mrFf1dU2HCsffgXxUj8"), isWritable: true, isSigner: false },
      { pubkey: new PublicKey("8UJgxaiQx5nTrdDgph5FiahMmzduuLTLf5WmsPegYA6W"), isWritable: true, isSigner: false },
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
      { pubkey: new PublicKey("5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("6bEp2MiyoiiiDxcVqE8rUHQWwHirXUXtKfAEATTVqNzT"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("Gwvob7yoLMgQRVWjScCRyQFMsgpRKrSAYisYEyjDJwEp"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"), isWritable: true, isSigner: false },
      { pubkey: new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"), isWritable: true, isSigner: false },
      { pubkey: new PublicKey("25Eax9W8SA3wpCQFhJEGyHhQ2NDHEshZEDzyMNtthR8D"), isWritable: true, isSigner: false },
      { pubkey: new PublicKey("3a7HAEqxzwvJEAViYKhDtHk85mrFf1dU2HCsffgXxUj8"), isWritable: true, isSigner: false },
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
      { pubkey: new PublicKey("5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("6bEp2MiyoiiiDxcVqE8rUHQWwHirXUXtKfAEATTVqNzT"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("Gwvob7yoLMgQRVWjScCRyQFMsgpRKrSAYisYEyjDJwEp"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"), isWritable: true, isSigner: false },
      { pubkey: new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"), isWritable: true, isSigner: false },
      { pubkey: new PublicKey("25Eax9W8SA3wpCQFhJEGyHhQ2NDHEshZEDzyMNtthR8D"), isWritable: true, isSigner: false },
      { pubkey: new PublicKey("3a7HAEqxzwvJEAViYKhDtHk85mrFf1dU2HCsffgXxUj8"), isWritable: true, isSigner: false },
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
      { pubkey: new PublicKey("6bEp2MiyoiiiDxcVqE8rUHQWwHirXUXtKfAEATTVqNzT"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("Gwvob7yoLMgQRVWjScCRyQFMsgpRKrSAYisYEyjDJwEp"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("25Eax9W8SA3wpCQFhJEGyHhQ2NDHEshZEDzyMNtthR8D"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("3a7HAEqxzwvJEAViYKhDtHk85mrFf1dU2HCsffgXxUj8"), isWritable: false, isSigner: false },
      { pubkey: new PublicKey("8UJgxaiQx5nTrdDgph5FiahMmzduuLTLf5WmsPegYA6W"), isWritable: false, isSigner: false },
    ])
    .instruction();
};

const  checkIfAccountExists = async (account: PublicKey, connection: Connection): Promise<boolean> => {
    const accountInfo = await connection.getAccountInfo(account);

    if (accountInfo?.owner.toBase58() === new PublicKey("11111111111111111111111111111111").toBase58()){
      return false
    }
     return true
}

