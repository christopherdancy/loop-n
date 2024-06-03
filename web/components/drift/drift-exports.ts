// Here we export some useful types and functions for interacting with the Anchor program.
import { Cluster, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BN, Program, ProgramAccount } from '@coral-xyz/anchor';


// import type { Loopn } from '../target/types/loopn';
// import { IDL as LoopnIDL } from '../target/types/loopn';

// // Re-export the generated IDL and type
// export { Loopn, LoopnIDL };

// After updating your program ID (e.g. after running `anchor keys sync`) update the value below.
export const DRIFT_PROGRAM_ID = new PublicKey(
  'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH'
);

// This is a helper function to get the program ID for the Loopn program depending on the cluster.
export function getDriftProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta':
    default:
      return DRIFT_PROGRAM_ID;
  }
}

export const MAX_NAME_LENGTH = 32;

export const DEFAULT_USER_NAME = 'Main Account';
export const DEFAULT_MARKET_NAME = 'Default Market Name';

export function encodeName(name: string): number[] {
	if (name.length > MAX_NAME_LENGTH) {
		throw Error(`Name (${name}) longer than 32 characters`);
	}

	const buffer = Buffer.alloc(32);
	buffer.fill(name);
	buffer.fill(' ', name.length);

	return Array(...buffer);
}

export function decodeName(bytes: number[]): string {
	const buffer = Buffer.from(bytes);
	return buffer.toString('utf8').trim();
}

export async function getUserAccountPublicKey(programId: PublicKey, authority: PublicKey, subAccountId = 0) {
  // Prepare the seeds for finding the program address
  const seeds = [
      Buffer.from(anchor.utils.bytes.utf8.encode('user')),
      authority.toBuffer(),
      new BN(subAccountId).toArrayLike(Buffer, 'le', 2),
  ];

  // Use findProgramAddress to get the PDA
  const [userAccountPublicKey] = await PublicKey.findProgramAddress(seeds, programId);
  
  return userAccountPublicKey;
}
export function getUserStatsAccountPublicKey(
  programId: PublicKey,
  authority: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode('user_stats')),
      authority.toBuffer(),
    ],
    programId
  )[0];
}
export async function getDriftStateAccountPublicKey(programId: PublicKey) {
  // Prepare the seeds for finding the program address
  const seeds = [Buffer.from(anchor.utils.bytes.utf8.encode('drift_state'))];

  // Use findProgramAddress to get the PDA
  const [stateAccountPublicKey] = await PublicKey.findProgramAddress(seeds, programId);
  
  return stateAccountPublicKey;
}

export function getDriftSignerPublicKey(programId: PublicKey): PublicKey {
	return PublicKey.findProgramAddressSync(
		[Buffer.from(anchor.utils.bytes.utf8.encode('drift_signer'))],
		programId
	)[0];
}

export async function getSpotMarketPublicKey(
	programId: PublicKey,
	marketIndex: number
): Promise<PublicKey> {
	return (
		await PublicKey.findProgramAddress(
			[
				Buffer.from(anchor.utils.bytes.utf8.encode('spot_market')),
				new anchor.BN(marketIndex).toArrayLike(Buffer, 'le', 2),
			],
			programId
		)
	)[0];
}

export async function getSpotMarketVaultPublicKey(
	programId: PublicKey,
	marketIndex: number
): Promise<PublicKey> {
	return (
		await PublicKey.findProgramAddress(
			[
				Buffer.from(anchor.utils.bytes.utf8.encode('spot_market_vault')),
				new anchor.BN(marketIndex).toArrayLike(Buffer, 'le', 2),
			],
			programId
		)
	)[0];
}

  // Constants for the conversion
  export const SIX = new BN(6);  // Represents the decimal places
  export const precision = new BN(10).pow(SIX);  // This is 10^6 for USDC
  
  // Function to convert USDC to the smallest unit
  export function convertUSDCtoSmallestUnit(usdcAmount: number) {
      // Create a BN instance for the USDC amount
      const bnUsdcAmount = new BN(usdcAmount);
      
      // Multiply by the precision to get the amount in the smallest unit
      const smallestUnitAmount = bnUsdcAmount.mul(precision);
      
      return smallestUnitAmount;
  }

  export const BASE_PRECISION = new anchor.BN(10).pow(new anchor.BN(9));
  export class OrderType {
    static readonly LIMIT = { limit: {} };
    static readonly TRIGGER_MARKET = { triggerMarket: {} };
    static readonly TRIGGER_LIMIT = { triggerLimit: {} };
    static readonly MARKET = { market: {} };
    static readonly ORACLE = { oracle: {} };
  }
  export type NecessaryOrderParams = {
    orderType: OrderType;
    marketIndex: number;
    baseAssetAmount: BN;
    direction: PositionDirection;
  };
  export class MarketType {
    static readonly SPOT = { spot: {} };
    static readonly PERP = { perp: {} };
  }

  export class SpotBalanceType {
    static readonly DEPOSIT = { deposit: {} };
    static readonly BORROW = { borrow: {} };
  }

  export type SpotPosition = {
    marketIndex: number;
    balanceType: SpotBalanceType;
    scaledBalance: BN;
    openOrders: number;
    openBids: BN;
    openAsks: BN;
    cumulativeDeposits: BN;
  };
  export type PerpPosition = {
    baseAssetAmount: BN;
    lastCumulativeFundingRate: BN;
    marketIndex: number;
    quoteAssetAmount: BN;
    quoteEntryAmount: BN;
    quoteBreakEvenAmount: BN;
    openOrders: number;
    openBids: BN;
    openAsks: BN;
    settledPnl: BN;
    lpShares: BN;
    remainderBaseAssetAmount: number;
    lastBaseAssetAmountPerLp: BN;
    lastQuoteAssetAmountPerLp: BN;
    perLpBase: number;
  };

  export class OrderStatus {
    static readonly INIT = { init: {} };
    static readonly OPEN = { open: {} };
  }
  
  export type Order = {
    status: OrderStatus;
    orderType: OrderType;
    marketType: MarketType;
    slot: BN;
    orderId: number;
    userOrderId: number;
    marketIndex: number;
    price: BN;
    baseAssetAmount: BN;
    quoteAssetAmount: BN;
    baseAssetAmountFilled: BN;
    quoteAssetAmountFilled: BN;
    direction: PositionDirection;
    reduceOnly: boolean;
    triggerPrice: BN;
    triggerCondition: OrderTriggerCondition;
    existingPositionDirection: PositionDirection;
    postOnly: boolean;
    immediateOrCancel: boolean;
    oraclePriceOffset: number;
    auctionDuration: number;
    auctionStartPrice: BN;
    auctionEndPrice: BN;
    maxTs: BN;
  };

  export type UserAccount = {
    authority: PublicKey;
    delegate: PublicKey;
    name: number[];
    subAccountId: number;
    spotPositions: SpotPosition[];
    perpPositions: PerpPosition[];
    orders: Order[];
    status: number;
    nextLiquidationId: number;
    nextOrderId: number;
    maxMarginRatio: number;
    lastAddPerpLpSharesTs: BN;
    settledPerpPnl: BN;
    totalDeposits: BN;
    totalWithdraws: BN;
    totalSocialLoss: BN;
    cumulativePerpFunding: BN;
    cumulativeSpotFees: BN;
    liquidationMarginFreed: BN;
    lastActiveSlot: BN;
    isMarginTradingEnabled: boolean;
    idle: boolean;
    openOrders: number;
    hasOpenOrder: boolean;
    openAuctions: number;
    hasOpenAuction: boolean;
  };

  export class PostOnlyParams {
    static readonly NONE = { none: {} };
    static readonly MUST_POST_ONLY = { mustPostOnly: {} }; // Tx fails if order can't be post only
    static readonly TRY_POST_ONLY = { tryPostOnly: {} }; // Tx succeeds and order not placed if can't be post only
    static readonly SLIDE = { slide: {} }; // Modify price to be post only if can't be post only
  }

  export class OrderTriggerCondition {
    static readonly ABOVE = { above: {} };
    static readonly BELOW = { below: {} };
    static readonly TRIGGERED_ABOVE = { triggeredAbove: {} }; // above condition has been triggered
    static readonly TRIGGERED_BELOW = { triggeredBelow: {} }; // below condition has been triggered
  }

  export type OrderParams = {
    orderType: OrderType;
    marketType: MarketType;
    userOrderId: number;
    direction: PositionDirection;
    baseAssetAmount: BN;
    price: BN;
    marketIndex: number;
    reduceOnly: boolean;
    postOnly: PostOnlyParams;
    immediateOrCancel: boolean;
    triggerPrice: BN | null;
    triggerCondition: OrderTriggerCondition;
    oraclePriceOffset: number | null;
    auctionDuration: number | null;
    maxTs: BN | null;
    auctionStartPrice: BN | null;
    auctionEndPrice: BN | null;
  };
  export const ZERO = new anchor.BN(0)

  export class PositionDirection {
    static readonly LONG = { long: {} };
    static readonly SHORT = { short: {} };
  }
  

  export const DefaultOrderParams: OrderParams = {
    orderType: OrderType.ORACLE,
    marketType: MarketType.PERP,
    userOrderId: 0,
    direction: PositionDirection.LONG,
    baseAssetAmount: ZERO,
    price: ZERO,
    marketIndex: 0,
    reduceOnly: false,
    postOnly: PostOnlyParams.NONE,
    immediateOrCancel: false,
    triggerPrice: null,
    triggerCondition: OrderTriggerCondition.ABOVE,
    oraclePriceOffset: null,
    auctionDuration: null,
    maxTs: null,
    auctionStartPrice: null,
    auctionEndPrice: null,
  };
  
  export type OptionalOrderParams = {
    [Property in keyof OrderParams]?: OrderParams[Property];
  } & NecessaryOrderParams;
  
  export function getMarketOrderParams(
    params: Omit<OptionalOrderParams, 'orderType'>
  ): OptionalOrderParams {
    return Object.assign({}, params, {
      orderType: OrderType.ORACLE,
    });
  }

  export function getOrderParams(
    optionalOrderParams: OptionalOrderParams,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    overridingParams: Record<string, any> = {}
  ): OrderParams {
    return Object.assign(
      {},
      DefaultOrderParams,
      optionalOrderParams,
      overridingParams
    );
  }

  export class MarketStatus {
    static readonly INITIALIZED = { initialized: {} };
    static readonly ACTIVE = { active: {} };
    static readonly FUNDING_PAUSED = { fundingPaused: {} };
    static readonly AMM_PAUSED = { ammPaused: {} };
    static readonly FILL_PAUSED = { fillPaused: {} };
    static readonly WITHDRAW_PAUSED = { withdrawPaused: {} };
    static readonly REDUCE_ONLY = { reduceOnly: {} };
    static readonly SETTLEMENT = { settlement: {} };
    static readonly DELISTED = { delisted: {} };
  }
  
  export class ContractType {
    static readonly PERPETUAL = { perpetual: {} };
    static readonly FUTURE = { future: {} };
  }
  
  export class ContractTier {
    static readonly A = { a: {} };
    static readonly B = { b: {} };
    static readonly C = { c: {} };
    static readonly SPECULATIVE = { speculative: {} };
    static readonly HIGHLY_SPECULATIVE = { highlySpeculative: {} };
    static readonly ISOLATED = { isolated: {} };
  }
  
  export type PoolBalance = {
    scaledBalance: BN;
    marketIndex: number;
  };
  
  export class OracleSource {
    static readonly PYTH = { pyth: {} };
    static readonly PYTH_1K = { pyth1K: {} };
    static readonly PYTH_1M = { pyth1M: {} };
    static readonly SWITCHBOARD = { switchboard: {} };
    static readonly QUOTE_ASSET = { quoteAsset: {} };
    static readonly PYTH_STABLE_COIN = { pythStableCoin: {} };
    static readonly Prelaunch = { prelaunch: {} };
  }
  
  export type HistoricalOracleData = {
    lastOraclePrice: BN;
    lastOracleDelay: BN;
    lastOracleConf: BN;
    lastOraclePriceTwap: BN;
    lastOraclePriceTwap5Min: BN;
    lastOraclePriceTwapTs: BN;
  };
  
  
  export type AMM = {
    baseAssetReserve: BN;
    sqrtK: BN;
    cumulativeFundingRate: BN;
    lastFundingRate: BN;
    lastFundingRateTs: BN;
    lastMarkPriceTwap: BN;
    lastMarkPriceTwap5Min: BN;
    lastMarkPriceTwapTs: BN;
    lastTradeTs: BN;
  
    oracle: PublicKey;
    oracleSource: OracleSource;
    historicalOracleData: HistoricalOracleData;
  
    lastOracleReservePriceSpreadPct: BN;
    lastOracleConfPct: BN;
  
    fundingPeriod: BN;
    quoteAssetReserve: BN;
    pegMultiplier: BN;
    cumulativeFundingRateLong: BN;
    cumulativeFundingRateShort: BN;
    last24HAvgFundingRate: BN;
    lastFundingRateShort: BN;
    lastFundingRateLong: BN;
  
    totalLiquidationFee: BN;
    totalFeeMinusDistributions: BN;
    totalFeeWithdrawn: BN;
    totalFee: BN;
    totalFeeEarnedPerLp: BN;
    userLpShares: BN;
    baseAssetAmountWithUnsettledLp: BN;
    orderStepSize: BN;
    orderTickSize: BN;
    maxFillReserveFraction: number;
    maxSlippageRatio: number;
    baseSpread: number;
    curveUpdateIntensity: number;
    baseAssetAmountWithAmm: BN;
    baseAssetAmountLong: BN;
    baseAssetAmountShort: BN;
    quoteAssetAmount: BN;
    terminalQuoteAssetReserve: BN;
    concentrationCoef: BN;
    feePool: PoolBalance;
    totalExchangeFee: BN;
    totalMmFee: BN;
    netRevenueSinceLastFunding: BN;
    lastUpdateSlot: BN;
    lastOracleNormalisedPrice: BN;
    lastOracleValid: boolean;
    lastBidPriceTwap: BN;
    lastAskPriceTwap: BN;
    longSpread: number;
    shortSpread: number;
    maxSpread: number;
  
    baseAssetAmountPerLp: BN;
    quoteAssetAmountPerLp: BN;
    targetBaseAssetAmountPerLp: number;
  
    ammJitIntensity: number;
    maxOpenInterest: BN;
    maxBaseAssetReserve: BN;
    minBaseAssetReserve: BN;
    totalSocialLoss: BN;
  
    quoteBreakEvenAmountLong: BN;
    quoteBreakEvenAmountShort: BN;
    quoteEntryAmountLong: BN;
    quoteEntryAmountShort: BN;
  
    markStd: BN;
    oracleStd: BN;
    longIntensityCount: number;
    longIntensityVolume: BN;
    shortIntensityCount: number;
    shortIntensityVolume: BN;
    volume24H: BN;
    minOrderSize: BN;
    maxPositionSize: BN;
  
    bidBaseAssetReserve: BN;
    bidQuoteAssetReserve: BN;
    askBaseAssetReserve: BN;
    askQuoteAssetReserve: BN;
  
    perLpBase: number; // i8
    netUnsettledFundingPnl: BN;
    quoteAssetAmountWithUnsettledLp: BN;
    referencePriceOffset: number;
  };
  
  export type PerpMarketAccount = {
    status: MarketStatus;
    contractType: ContractType;
    contractTier: ContractTier;
    expiryTs: BN;
    expiryPrice: BN;
    marketIndex: number;
    pubkey: PublicKey;
    name: number[];
    amm: AMM;
    numberOfUsersWithBase: number;
    numberOfUsers: number;
    marginRatioInitial: number;
    marginRatioMaintenance: number;
    nextFillRecordId: BN;
    nextFundingRateRecordId: BN;
    nextCurveRecordId: BN;
    pnlPool: PoolBalance;
    liquidatorFee: number;
    ifLiquidationFee: number;
    imfFactor: number;
    unrealizedPnlImfFactor: number;
    unrealizedPnlMaxImbalance: BN;
    unrealizedPnlInitialAssetWeight: number;
    unrealizedPnlMaintenanceAssetWeight: number;
    insuranceClaim: {
      revenueWithdrawSinceLastSettle: BN;
      maxRevenueWithdrawPerPeriod: BN;
      lastRevenueWithdrawTs: BN;
      quoteSettledInsurance: BN;
      quoteMaxInsurance: BN;
    };
    quoteSpotMarketIndex: number;
    feeAdjustment: number;
    pausedOperations: number;
  };
  
  
  export async function findAllMarkets(program: Program): Promise<{
    perpMarkets: PerpMarketAccount[];
  }> {
    const perpMarkets = [];
  
    const perpMarketProgramAccounts =
      (await program.account.perpMarket.all()) as ProgramAccount<PerpMarketAccount>[];
  
    for (const perpMarketProgramAccount of perpMarketProgramAccounts) {
      const perpMarket = perpMarketProgramAccount.account as PerpMarketAccount;
      perpMarkets.push(perpMarket)
    }
  
    return {
      perpMarkets,
    };
  }

  export function getActivePerpPositionsForUserAccount(
    userAccount: UserAccount | null
  ): PerpPosition[] {
    return userAccount ? userAccount.perpPositions.filter(
      (pos) =>
        pos.baseAssetAmount.gt(ZERO) 
        // !pos.quoteAssetAmount.eq(ZERO) ||
        // !(pos.openOrders == 0) ||
        // !pos.lpShares.eq(ZERO)
    ) : [];
  }

  export function isVariant(object: unknown, type: string) {
	// eslint-disable-next-line no-prototype-builtins
	return object.hasOwnProperty(type);
}

  export function getOpenOrdersForUserAccount(userAccount?: UserAccount): Order[] {
	return userAccount? userAccount.orders.filter((order) =>
		isVariant(order.status, 'open')
	) : [];
}

  export const AMM_RESERVE_PRECISION_EXP = new BN(9);
  export const AMM_RESERVE_PRECISION = new BN(10).pow(AMM_RESERVE_PRECISION_EXP);
  export const QUOTE_PRECISION_EXP = new BN(6);
  export const QUOTE_PRECISION = new BN(10).pow(QUOTE_PRECISION_EXP);
  
  export const AMM_TO_QUOTE_PRECISION_RATIO =
    AMM_RESERVE_PRECISION.div(QUOTE_PRECISION); // 10^3
  /**
   *
   * @param userPosition
   * @returns Precision: PRICE_PRECISION (10^6)
   */
  export function calculateEntryPrice(userPosition: PerpPosition): BN {
    if (userPosition.baseAssetAmount.eq(ZERO)) {
      return ZERO;
    }
  
    return userPosition.quoteEntryAmount
      .mul(PRICE_PRECISION)
      .mul(AMM_TO_QUOTE_PRECISION_RATIO)
      .div(userPosition.baseAssetAmount)
      .abs();
  }
  
  export function calculateBaseAssetValueWithOracle(
    market: PerpMarketAccount,
    perpPosition: PerpPosition,
    includeOpenOrders = false
  ): BN {
    const price = market.amm.historicalOracleData.lastOraclePrice;
  
    const baseAssetAmount = includeOpenOrders
      ? calculateWorstCaseBaseAssetAmount(perpPosition)
      : perpPosition.baseAssetAmount;
  
    return baseAssetAmount.abs().mul(price).div(AMM_RESERVE_PRECISION);
  }
  
  export function calculateWorstCaseBaseAssetAmount(
    perpPosition: PerpPosition
  ): BN {
    const allBids = perpPosition.baseAssetAmount.add(perpPosition.openBids);
    const allAsks = perpPosition.baseAssetAmount.add(perpPosition.openAsks);
  
    if (allBids.abs().gt(allAsks.abs())) {
      return allBids;
    } else {
      return allAsks;
    }
  }
  
  export const FUNDING_RATE_BUFFER_PRECISION_EXP = new BN(3);
  
  export const FUNDING_RATE_BUFFER_PRECISION = new BN(10).pow(
    FUNDING_RATE_BUFFER_PRECISION_EXP
  );
  
  /**
   *
   * @param market
   * @param PerpPosition
   * @returns // QUOTE_PRECISION
   */
  export function calculatePositionFundingPNL(
    market: PerpMarketAccount,
    perpPosition: PerpPosition
  ): BN {
    if (perpPosition.baseAssetAmount.eq(ZERO)) {
      return ZERO;
    }
  
    let ammCumulativeFundingRate: BN;
    if (perpPosition.baseAssetAmount.gt(ZERO)) {
      ammCumulativeFundingRate = market.amm.cumulativeFundingRateLong;
    } else {
      ammCumulativeFundingRate = market.amm.cumulativeFundingRateShort;
    }
  
    const perPositionFundingRate = ammCumulativeFundingRate
      .sub(perpPosition.lastCumulativeFundingRate)
      .mul(perpPosition.baseAssetAmount)
      .div(AMM_RESERVE_PRECISION)
      .div(FUNDING_RATE_BUFFER_PRECISION)
      .mul(new BN(-1));
  
    return perPositionFundingRate;
  }
  
  export function positionCurrentDirection(
    userPosition: PerpPosition
  ): PositionDirection {
    return userPosition.baseAssetAmount.gte(ZERO)
      ? PositionDirection.LONG
      : PositionDirection.SHORT;
  }
  
  export function formatPercentageChange(percentageChange: number, decimalPlaces: number = 2): string {
    return `${percentageChange.toFixed(decimalPlaces)}%`;
  }
  
  export function getPositionEstimatedExitPriceAndPnl(
    market: PerpMarketAccount,
    position: PerpPosition,
  ): [BN, BN, number] {
    const entryPrice = calculateEntryPrice(position);
    const baseAssetValue = calculateBaseAssetValueWithOracle(
      market,
      position,
    );
  
    if (position.baseAssetAmount.eq(ZERO)) {
      return [ZERO, ZERO, 0];
    }
  
    const exitPrice = baseAssetValue
      .mul(AMM_TO_QUOTE_PRECISION_RATIO)
      .mul(PRICE_PRECISION)
      .div(position.baseAssetAmount.abs());
  
    const pnlPerBase = exitPrice.sub(entryPrice);
  
    const pnl = pnlPerBase
      .mul(position.baseAssetAmount)
      .div(PRICE_PRECISION)
      .div(AMM_TO_QUOTE_PRECISION_RATIO);
  
    // Calculate percentage change
    const percentageChange = entryPrice.gt(ZERO)
      ? pnlPerBase.mul(new BN(10000)).div(entryPrice).toNumber() / 100
      : 0;
  
  
    return [exitPrice, pnl, percentageChange];
  }
  
  export type PerpMarketConfig = {
    fullName?: string;
    category?: string[];
    symbol: string;
    baseAssetSymbol: string;
    marketIndex: number;
    launchTs: number;
    oracle: PublicKey;
    oracleSource: OracleSource;
  };
  
  export function formatTokenAmount(amount: BN, decimals: number = 6, displayDecimals: number = 2, isUSD: boolean = false): string {
    const isNegative = amount.isNeg();
    const absAmount = amount.abs();
    
    const divisor = new BN(10).pow(new BN(decimals));
    const wholePart = absAmount.div(divisor).toString();
    const fractionalPart = absAmount.mod(divisor).toString().padStart(decimals, '0');
    const formattedFractionalPart = fractionalPart.slice(0, displayDecimals);
  
    // Format the string with the decimal point and handle negative sign
    const formattedAmount = `${wholePart}.${formattedFractionalPart}`;
    const finalAmount = isNegative ? `-${formattedAmount}` : formattedAmount;
  
    // Add USD formatting if isUSD is true
    return isUSD ? `$${finalAmount}` : finalAmount;
  }
  
  export const PerpMarketConfigs: PerpMarketConfig[] =
  [
    {
      fullName: 'Solana',
      category: ['L1', 'Infra'],
      symbol: 'SOL-PERP',
      baseAssetSymbol: 'SOL',
      marketIndex: 0,
      oracle: new PublicKey('J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix'),
      launchTs: 1655751353000,
      oracleSource: OracleSource.PYTH,
    },
    {
      fullName: 'Bonk',
      category: ['Meme', 'Dog'],
      symbol: '1MBONK-PERP',
      baseAssetSymbol: '1MBONK',
      marketIndex: 4,
      oracle: new PublicKey('6bquU99ktV1VRiHDr8gMhDFt3kMfhCQo5nfNrg2Urvsn'),
      launchTs: 1677068931000,
      oracleSource: OracleSource.PYTH_1M,
    },
    {
      fullName: 'LINK',
      category: ['Oracle'],
      symbol: 'LINK-PERP',
      baseAssetSymbol: 'LINK',
      marketIndex: 16,
      oracle: new PublicKey('9sGidS4qUXS2WvHZFhzw4df1jNd5TvUGZXZVsSjXo7UF'),
      launchTs: 1698074659000,
      oracleSource: OracleSource.PYTH,
    }
  ]
  
  /**
   * calculatePositionPNL
   * = BaseAssetAmount * (Avg Exit Price - Avg Entry Price)
   * @param market
   * @param PerpPosition
   * @param withFunding (adds unrealized funding payment pnl to result)
   * @param oraclePriceData
   * @returns BaseAssetAmount : Precision QUOTE_PRECISION
   */
  export function calculatePositionPNL(
    market: PerpMarketAccount,
    perpPosition: PerpPosition,
    withFunding = false,
    // oraclePriceData: OraclePriceData
  ): BN {
    if (perpPosition.baseAssetAmount.eq(ZERO)) {
      return perpPosition.quoteAssetAmount;
    }
  
    const baseAssetValue = calculateBaseAssetValueWithOracle(
      market,
      perpPosition,
    );
    
    const baseAssetValueSign = perpPosition.baseAssetAmount.isNeg()
    ? new BN(-1)
    : new BN(1);
    let pnl = baseAssetValue
    .mul(baseAssetValueSign)
    .add(perpPosition.quoteAssetAmount);
  
    if (withFunding) {
      const fundingRatePnL = calculatePositionFundingPNL(market, perpPosition);
  
      pnl = pnl.add(fundingRatePnL);
    }
  
    return pnl;
  }


  export function getMarketConfigByIndex(marketIndex : BN): (PerpMarketConfig | undefined) {
    return PerpMarketConfigs.find(config => config.marketIndex === marketIndex);
  }

  export const PEG_PRECISION_EXP = new BN(6);
export const PRICE_PRECISION_EXP = new BN(6);
export const PEG_PRECISION = new BN(10).pow(PEG_PRECISION_EXP);
export const PRICE_PRECISION = new BN(10).pow(PRICE_PRECISION_EXP);


/**
 * Calculates a price given an arbitrary base and quote amount (they must have the same precision)
 *
 * @param baseAssetReserves
 * @param quoteAssetReserves
 * @param pegMultiplier
 * @returns price : Precision PRICE_PRECISION
 */
export function calculatePrice(
	baseAssetReserves: BN,
	quoteAssetReserves: BN,
	pegMultiplier: BN
): BN {
	if (baseAssetReserves.abs().lte(ZERO)) {
		return new BN(0);
	}

	return quoteAssetReserves
		.mul(PRICE_PRECISION)
		.mul(pegMultiplier)
		.div(PEG_PRECISION)
		.div(baseAssetReserves);
}

export const convertToNumber = (
	bigNumber: BN,
	precision: BN = PRICE_PRECISION
) => {
	if (!bigNumber) return 0;
	return (
		bigNumber.div(precision).toNumber() +
		bigNumber.mod(precision).toNumber() / precision.toNumber()
	);
};

export const BID_ASK_SPREAD_PRECISION = new BN(1000000); // 10^6
export const PERCENTAGE_PRECISION_EXP = new BN(6);
export const PERCENTAGE_PRECISION = new BN(10).pow(PERCENTAGE_PRECISION_EXP);
export const ONE = new BN(1);
export const TWO = new BN(2);
export const sigNum = (x: BN): BN => {
	return x.isNeg() ? new BN(-1) : new BN(1);
};

export function calculateMarketOpenBidAsk(
	baseAssetReserve: BN,
	minBaseAssetReserve: BN,
	maxBaseAssetReserve: BN,
	stepSize?: BN
): [BN, BN] {
	// open orders
	let openAsks;
	if (minBaseAssetReserve.lt(baseAssetReserve)) {
		openAsks = baseAssetReserve.sub(minBaseAssetReserve).mul(new BN(-1));

		if (stepSize && openAsks.abs().div(TWO).lt(stepSize)) {
			openAsks = ZERO;
		}
	} else {
		openAsks = ZERO;
	}

	let openBids;
	if (maxBaseAssetReserve.gt(baseAssetReserve)) {
		openBids = maxBaseAssetReserve.sub(baseAssetReserve);

		if (stepSize && openBids.div(TWO).lt(stepSize)) {
			openBids = ZERO;
		}
	} else {
		openBids = ZERO;
	}

	return [openBids, openAsks];
}


export function calculateInventoryLiquidityRatio(
	baseAssetAmountWithAmm: BN,
	baseAssetReserve: BN,
	minBaseAssetReserve: BN,
	maxBaseAssetReserve: BN
): BN {
	// inventory skew
	const [openBids, openAsks] = calculateMarketOpenBidAsk(
		baseAssetReserve,
		minBaseAssetReserve,
		maxBaseAssetReserve
	);

	const minSideLiquidity = BN.min(openBids.abs(), openAsks.abs());

	const inventoryScaleBN = BN.min(
		baseAssetAmountWithAmm
			.mul(PERCENTAGE_PRECISION)
			.div(BN.max(minSideLiquidity, ONE))
			.abs(),
		PERCENTAGE_PRECISION
	);
	return inventoryScaleBN;
}
export function clampBN(x: BN, min: BN, max: BN): BN {
	return BN.max(min, BN.min(x, max));
}

export function calculateReferencePriceOffset(
	reservePrice: BN,
	last24hAvgFundingRate: BN,
	liquidityFraction: BN,
	oracleTwapFast: BN,
	markTwapFast: BN,
	oracleTwapSlow: BN,
	markTwapSlow: BN,
	maxOffsetPct: number
): BN {
	if (last24hAvgFundingRate.eq(ZERO)) {
		return ZERO;
	}

	const maxOffsetInPrice = new BN(maxOffsetPct)
		.mul(reservePrice)
		.div(PERCENTAGE_PRECISION);

	// Calculate quote denominated market premium
	const markPremiumMinute = clampBN(
		markTwapFast.sub(oracleTwapFast),
		maxOffsetInPrice.mul(new BN(-1)),
		maxOffsetInPrice
	);

	const markPremiumHour = clampBN(
		markTwapSlow.sub(oracleTwapSlow),
		maxOffsetInPrice.mul(new BN(-1)),
		maxOffsetInPrice
	);

	// Convert last24hAvgFundingRate to quote denominated premium
	const markPremiumDay = clampBN(
		last24hAvgFundingRate.div(FUNDING_RATE_BUFFER_PRECISION).mul(new BN(24)),
		maxOffsetInPrice.mul(new BN(-1)),
		maxOffsetInPrice
	);

	// Take average clamped premium as the price-based offset
	const markPremiumAvg = markPremiumMinute
		.add(markPremiumHour)
		.add(markPremiumDay)
		.div(new BN(3));

	const markPremiumAvgPct = markPremiumAvg
		.mul(PRICE_PRECISION)
		.div(reservePrice);

	const inventoryPct = clampBN(
		liquidityFraction.mul(new BN(maxOffsetPct)).div(PERCENTAGE_PRECISION),
		maxOffsetInPrice.mul(new BN(-1)),
		maxOffsetInPrice
	);

	// Only apply when inventory is consistent with recent and 24h market premium
	let offsetPct = markPremiumAvgPct.add(inventoryPct);

	if (!sigNum(inventoryPct).eq(sigNum(markPremiumAvgPct))) {
		offsetPct = ZERO;
	}

	const clampedOffsetPct = clampBN(
		offsetPct,
		new BN(-maxOffsetPct),
		new BN(maxOffsetPct)
	);

	return clampedOffsetPct;
}
export const FIVE_MINUTE = new BN(60 * 5);


export function calculateLiveOracleTwap(
	histOracleData: HistoricalOracleData,
	oraclePriceData: OraclePriceData,
	now: BN,
	period: BN
): BN {
	let oracleTwap = undefined;
	if (period.eq(FIVE_MINUTE)) {
		oracleTwap = histOracleData.lastOraclePriceTwap5Min;
	} else {
		//todo: assumes its fundingPeriod (1hr)
		// period = amm.fundingPeriod;
		oracleTwap = histOracleData.lastOraclePriceTwap;
	}

	const sinceLastUpdate = BN.max(
		ONE,
		now.sub(histOracleData.lastOraclePriceTwapTs)
	);
	const sinceStart = BN.max(ZERO, period.sub(sinceLastUpdate));

	const clampRange = oracleTwap.div(new BN(3));

	const clampedOraclePrice = BN.min(
		oracleTwap.add(clampRange),
		BN.max(oraclePriceData.price, oracleTwap.sub(clampRange))
	);

	const newOracleTwap = oracleTwap
		.mul(sinceStart)
		.add(clampedOraclePrice.mul(sinceLastUpdate))
		.div(sinceStart.add(sinceLastUpdate));

	return newOracleTwap;
}

export function calculateLiveOracleStd(
	amm: AMM,
	oraclePriceData: OraclePriceData,
	now: BN
): BN {
	const sinceLastUpdate = BN.max(
		ONE,
		now.sub(amm.historicalOracleData.lastOraclePriceTwapTs)
	);
	const sinceStart = BN.max(ZERO, amm.fundingPeriod.sub(sinceLastUpdate));

	const liveOracleTwap = calculateLiveOracleTwap(
		amm.historicalOracleData,
		oraclePriceData,
		now,
		amm.fundingPeriod
	);

	const priceDeltaVsTwap = oraclePriceData.price.sub(liveOracleTwap).abs();

	const oracleStd = priceDeltaVsTwap.add(
		amm.oracleStd.mul(sinceStart).div(sinceStart.add(sinceLastUpdate))
	);

	return oracleStd;
}

export function getNewOracleConfPct(
	amm: AMM,
	oraclePriceData: OraclePriceData,
	reservePrice: BN,
	now: BN
): BN {
	const confInterval = oraclePriceData.confidence || ZERO;

	const sinceLastUpdate = BN.max(
		ZERO,
		now.sub(amm.historicalOracleData.lastOraclePriceTwapTs)
	);
	let lowerBoundConfPct = amm.lastOracleConfPct;
	if (sinceLastUpdate.gt(ZERO)) {
		const lowerBoundConfDivisor = BN.max(
			new BN(21).sub(sinceLastUpdate),
			new BN(5)
		);
		lowerBoundConfPct = amm.lastOracleConfPct.sub(
			amm.lastOracleConfPct.div(lowerBoundConfDivisor)
		);
	}
	const confIntervalPct = confInterval
		.mul(BID_ASK_SPREAD_PRECISION)
		.div(reservePrice);

	const confIntervalPctResult = BN.max(confIntervalPct, lowerBoundConfPct);

	return confIntervalPctResult;
}

export function calculateVolSpreadBN(
	lastOracleConfPct: BN,
	reservePrice: BN,
	markStd: BN,
	oracleStd: BN,
	longIntensity: BN,
	shortIntensity: BN,
	volume24H: BN
): [BN, BN] {
	const marketAvgStdPct = markStd
		.add(oracleStd)
		.mul(PERCENTAGE_PRECISION)
		.div(reservePrice)
		.div(new BN(2));
	const volSpread = BN.max(lastOracleConfPct, marketAvgStdPct.div(new BN(2)));

	const clampMin = PERCENTAGE_PRECISION.div(new BN(100));
	const clampMax = PERCENTAGE_PRECISION.mul(new BN(16)).div(new BN(10));

	const longVolSpreadFactor = clampBN(
		longIntensity.mul(PERCENTAGE_PRECISION).div(BN.max(ONE, volume24H)),
		clampMin,
		clampMax
	);
	const shortVolSpreadFactor = clampBN(
		shortIntensity.mul(PERCENTAGE_PRECISION).div(BN.max(ONE, volume24H)),
		clampMin,
		clampMax
	);

	// only consider confidence interval at full value when above 25 bps
	let confComponent = lastOracleConfPct;

	if (lastOracleConfPct.lte(PRICE_PRECISION.div(new BN(400)))) {
		confComponent = lastOracleConfPct.div(new BN(10));
	}

	const longVolSpread = BN.max(
		confComponent,
		volSpread.mul(longVolSpreadFactor).div(PERCENTAGE_PRECISION)
	);
	const shortVolSpread = BN.max(
		confComponent,
		volSpread.mul(shortVolSpreadFactor).div(PERCENTAGE_PRECISION)
	);

	return [longVolSpread, shortVolSpread];
}

export function calculateInventoryScale(
	baseAssetAmountWithAmm: BN,
	baseAssetReserve: BN,
	minBaseAssetReserve: BN,
	maxBaseAssetReserve: BN,
	directionalSpread: number,
	maxSpread: number
): number {
	if (baseAssetAmountWithAmm.eq(ZERO)) {
		return 1;
	}

	const MAX_BID_ASK_INVENTORY_SKEW_FACTOR = BID_ASK_SPREAD_PRECISION.mul(
		new BN(10)
	);

	const inventoryScaleBN = calculateInventoryLiquidityRatio(
		baseAssetAmountWithAmm,
		baseAssetReserve,
		minBaseAssetReserve,
		maxBaseAssetReserve
	);

	const inventoryScaleMaxBN = BN.max(
		MAX_BID_ASK_INVENTORY_SKEW_FACTOR,
		new BN(maxSpread)
			.mul(BID_ASK_SPREAD_PRECISION)
			.div(new BN(Math.max(directionalSpread, 1)))
	);

	const inventoryScaleCapped =
		BN.min(
			inventoryScaleMaxBN,
			BID_ASK_SPREAD_PRECISION.add(
				inventoryScaleMaxBN.mul(inventoryScaleBN).div(PERCENTAGE_PRECISION)
			)
		).toNumber() / BID_ASK_SPREAD_PRECISION.toNumber();

	return inventoryScaleCapped;
}

export const AMM_TIMES_PEG_TO_QUOTE_PRECISION_RATIO =
	AMM_RESERVE_PRECISION.mul(PEG_PRECISION).div(QUOTE_PRECISION); // 10^9

  export const DEFAULT_REVENUE_SINCE_LAST_FUNDING_SPREAD_RETREAT = new BN(
    -25
  ).mul(QUOTE_PRECISION);

export function calculateEffectiveLeverage(
	baseSpread: number,
	quoteAssetReserve: BN,
	terminalQuoteAssetReserve: BN,
	pegMultiplier: BN,
	netBaseAssetAmount: BN,
	reservePrice: BN,
	totalFeeMinusDistributions: BN
): number {
	// vAMM skew
	const netBaseAssetValue = quoteAssetReserve
		.sub(terminalQuoteAssetReserve)
		.mul(pegMultiplier)
		.div(AMM_TIMES_PEG_TO_QUOTE_PRECISION_RATIO);

	const localBaseAssetValue = netBaseAssetAmount
		.mul(reservePrice)
		.div(AMM_TO_QUOTE_PRECISION_RATIO.mul(PRICE_PRECISION));

	const effectiveGap = Math.max(
		0,
		localBaseAssetValue.sub(netBaseAssetValue).toNumber()
	);

	const effectiveLeverage =
		effectiveGap / (Math.max(0, totalFeeMinusDistributions.toNumber()) + 1) +
		1 / QUOTE_PRECISION.toNumber();

	return effectiveLeverage;
}

export function calculateSpreadBN(
	baseSpread: number,
	lastOracleReservePriceSpreadPct: BN,
	lastOracleConfPct: BN,
	maxSpread: number,
	quoteAssetReserve: BN,
	terminalQuoteAssetReserve: BN,
	pegMultiplier: BN,
	baseAssetAmountWithAmm: BN,
	reservePrice: BN,
	totalFeeMinusDistributions: BN,
	netRevenueSinceLastFunding: BN,
	baseAssetReserve: BN,
	minBaseAssetReserve: BN,
	maxBaseAssetReserve: BN,
	markStd: BN,
	oracleStd: BN,
	longIntensity: BN,
	shortIntensity: BN,
	volume24H: BN,
	returnTerms = false
) {
	// assert(Number.isInteger(baseSpread));
	// assert(Number.isInteger(maxSpread));

	const spreadTerms = {
		longVolSpread: 0,
		shortVolSpread: 0,
		longSpreadwPS: 0,
		shortSpreadwPS: 0,
		maxTargetSpread: 0,
		inventorySpreadScale: 0,
		longSpreadwInvScale: 0,
		shortSpreadwInvScale: 0,
		effectiveLeverage: 0,
		effectiveLeverageCapped: 0,
		longSpreadwEL: 0,
		shortSpreadwEL: 0,
		revenueRetreatAmount: 0,
		halfRevenueRetreatAmount: 0,
		longSpreadwRevRetreat: 0,
		shortSpreadwRevRetreat: 0,
		longSpreadwOffsetShrink: 0,
		shortSpreadwOffsetShrink: 0,
		totalSpread: 0,
		longSpread: 0,
		shortSpread: 0,
	};

	const [longVolSpread, shortVolSpread] = calculateVolSpreadBN(
		lastOracleConfPct,
		reservePrice,
		markStd,
		oracleStd,
		longIntensity,
		shortIntensity,
		volume24H
	);

	spreadTerms.longVolSpread = longVolSpread.toNumber();
	spreadTerms.shortVolSpread = shortVolSpread.toNumber();

	let longSpread = Math.max(baseSpread / 2, longVolSpread.toNumber());
	let shortSpread = Math.max(baseSpread / 2, shortVolSpread.toNumber());

	if (lastOracleReservePriceSpreadPct.gt(ZERO)) {
		shortSpread = Math.max(
			shortSpread,
			lastOracleReservePriceSpreadPct.abs().toNumber() +
				shortVolSpread.toNumber()
		);
	} else if (lastOracleReservePriceSpreadPct.lt(ZERO)) {
		longSpread = Math.max(
			longSpread,
			lastOracleReservePriceSpreadPct.abs().toNumber() +
				longVolSpread.toNumber()
		);
	}
	spreadTerms.longSpreadwPS = longSpread;
	spreadTerms.shortSpreadwPS = shortSpread;

	const maxSpreadBaseline = Math.min(
		Math.max(
			lastOracleReservePriceSpreadPct.abs().toNumber(),
			lastOracleConfPct.muln(2).toNumber(),
			BN.max(markStd, oracleStd)
				.mul(PERCENTAGE_PRECISION)
				.div(reservePrice)
				.toNumber()
		),
		BID_ASK_SPREAD_PRECISION.toNumber()
	);

	const maxTargetSpread: number = Math.floor(
		Math.max(maxSpread, maxSpreadBaseline)
	);

	const inventorySpreadScale = calculateInventoryScale(
		baseAssetAmountWithAmm,
		baseAssetReserve,
		minBaseAssetReserve,
		maxBaseAssetReserve,
		baseAssetAmountWithAmm.gt(ZERO) ? longSpread : shortSpread,
		maxTargetSpread
	);

	if (baseAssetAmountWithAmm.gt(ZERO)) {
		longSpread *= inventorySpreadScale;
	} else if (baseAssetAmountWithAmm.lt(ZERO)) {
		shortSpread *= inventorySpreadScale;
	}
	spreadTerms.maxTargetSpread = maxTargetSpread;
	spreadTerms.inventorySpreadScale = inventorySpreadScale;
	spreadTerms.longSpreadwInvScale = longSpread;
	spreadTerms.shortSpreadwInvScale = shortSpread;

	const MAX_SPREAD_SCALE = 10;
	if (totalFeeMinusDistributions.gt(ZERO)) {
		const effectiveLeverage = calculateEffectiveLeverage(
			baseSpread,
			quoteAssetReserve,
			terminalQuoteAssetReserve,
			pegMultiplier,
			baseAssetAmountWithAmm,
			reservePrice,
			totalFeeMinusDistributions
		);
		spreadTerms.effectiveLeverage = effectiveLeverage;

		const spreadScale = Math.min(MAX_SPREAD_SCALE, 1 + effectiveLeverage);
		spreadTerms.effectiveLeverageCapped = spreadScale;

		if (baseAssetAmountWithAmm.gt(ZERO)) {
			longSpread *= spreadScale;
			longSpread = Math.floor(longSpread);
		} else {
			shortSpread *= spreadScale;
			shortSpread = Math.floor(shortSpread);
		}
	} else {
		longSpread *= MAX_SPREAD_SCALE;
		shortSpread *= MAX_SPREAD_SCALE;
	}

	spreadTerms.longSpreadwEL = longSpread;
	spreadTerms.shortSpreadwEL = shortSpread;

	if (
		netRevenueSinceLastFunding.lt(
			DEFAULT_REVENUE_SINCE_LAST_FUNDING_SPREAD_RETREAT
		)
	) {
		const maxRetreat = maxTargetSpread / 10;
		let revenueRetreatAmount = maxRetreat;
		if (
			netRevenueSinceLastFunding.gte(
				DEFAULT_REVENUE_SINCE_LAST_FUNDING_SPREAD_RETREAT.mul(new BN(1000))
			)
		) {
			revenueRetreatAmount = Math.min(
				maxRetreat,
				Math.floor(
					(baseSpread * netRevenueSinceLastFunding.abs().toNumber()) /
						DEFAULT_REVENUE_SINCE_LAST_FUNDING_SPREAD_RETREAT.abs().toNumber()
				)
			);
		}

		const halfRevenueRetreatAmount = Math.floor(revenueRetreatAmount / 2);

		spreadTerms.revenueRetreatAmount = revenueRetreatAmount;
		spreadTerms.halfRevenueRetreatAmount = halfRevenueRetreatAmount;

		if (baseAssetAmountWithAmm.gt(ZERO)) {
			longSpread += revenueRetreatAmount;
			shortSpread += halfRevenueRetreatAmount;
		} else if (baseAssetAmountWithAmm.lt(ZERO)) {
			longSpread += halfRevenueRetreatAmount;
			shortSpread += revenueRetreatAmount;
		} else {
			longSpread += halfRevenueRetreatAmount;
			shortSpread += halfRevenueRetreatAmount;
		}
	}

	spreadTerms.longSpreadwRevRetreat = longSpread;
	spreadTerms.shortSpreadwRevRetreat = shortSpread;

	const totalSpread = longSpread + shortSpread;
	if (totalSpread > maxTargetSpread) {
		if (longSpread > shortSpread) {
			longSpread = Math.ceil((longSpread * maxTargetSpread) / totalSpread);
			shortSpread = Math.floor(maxTargetSpread - longSpread);
		} else {
			shortSpread = Math.ceil((shortSpread * maxTargetSpread) / totalSpread);
			longSpread = Math.floor(maxTargetSpread - shortSpread);
		}
	}

	spreadTerms.totalSpread = totalSpread;
	spreadTerms.longSpread = longSpread;
	spreadTerms.shortSpread = shortSpread;
	if (returnTerms) {
		return spreadTerms;
	}
	return [longSpread, shortSpread];
}

export function calculateSpread(
	amm: AMM,
	oraclePriceData: OraclePriceData,
	now?: BN,
	reservePrice?: BN
): [number, number] {
	if (amm.baseSpread == 0 || amm.curveUpdateIntensity == 0) {
		return [amm.baseSpread / 2, amm.baseSpread / 2];
	}

	if (!reservePrice) {
		reservePrice = calculatePrice(
			amm.baseAssetReserve,
			amm.quoteAssetReserve,
			amm.pegMultiplier
		);
	}

	const targetPrice = oraclePriceData?.price || reservePrice;
	const targetMarkSpreadPct = reservePrice
		.sub(targetPrice)
		.mul(BID_ASK_SPREAD_PRECISION)
		.div(reservePrice);

	now = now || new BN(new Date().getTime() / 1000); //todo
	const liveOracleStd = calculateLiveOracleStd(amm, oraclePriceData, now);
	const confIntervalPct = getNewOracleConfPct(
		amm,
		oraclePriceData,
		reservePrice,
		now
	);

	const spreads = calculateSpreadBN(
		amm.baseSpread,
		targetMarkSpreadPct,
		confIntervalPct,
		amm.maxSpread,
		amm.quoteAssetReserve,
		amm.terminalQuoteAssetReserve,
		amm.pegMultiplier,
		amm.baseAssetAmountWithAmm,
		reservePrice,
		amm.totalFeeMinusDistributions,
		amm.netRevenueSinceLastFunding,
		amm.baseAssetReserve,
		amm.minBaseAssetReserve,
		amm.maxBaseAssetReserve,
		amm.markStd,
		liveOracleStd,
		amm.longIntensityVolume,
		amm.shortIntensityVolume,
		amm.volume24H
	);
	const longSpread = spreads[0];
	const shortSpread = spreads[1];

	return [longSpread, shortSpread];
}


export function calculateSpreadReserves(
	amm: AMM,
	oraclePriceData: OraclePriceData,
	now?: BN
) {
	function calculateSpreadReserve(
		spread: number,
		direction: PositionDirection,
		amm: AMM
	): {
		baseAssetReserve;
		quoteAssetReserve;
	} {
		if (spread === 0) {
			return {
				baseAssetReserve: amm.baseAssetReserve,
				quoteAssetReserve: amm.quoteAssetReserve,
			};
		}
		let spreadFraction = new BN(spread / 2);

		// make non-zero
		if (spreadFraction.eq(ZERO)) {
			spreadFraction = spread >= 0 ? new BN(1) : new BN(-1);
		}

		const quoteAssetReserveDelta = amm.quoteAssetReserve.div(
			BID_ASK_SPREAD_PRECISION.div(spreadFraction)
		);

		let quoteAssetReserve;
		if (quoteAssetReserveDelta.gte(ZERO)) {
			quoteAssetReserve = amm.quoteAssetReserve.add(
				quoteAssetReserveDelta.abs()
			);
		} else {
			quoteAssetReserve = amm.quoteAssetReserve.sub(
				quoteAssetReserveDelta.abs()
			);
		}

		const baseAssetReserve = amm.sqrtK.mul(amm.sqrtK).div(quoteAssetReserve);
		return {
			baseAssetReserve,
			quoteAssetReserve,
		};
	}

	const reservePrice = calculatePrice(
		amm.baseAssetReserve,
		amm.quoteAssetReserve,
		amm.pegMultiplier
	);

	// always allow 10 bps of price offset, up to a fifth of the market's max_spread
	let maxOffset = 0;
	let referencePriceOffset = ZERO;
	if (amm.curveUpdateIntensity > 100) {
		maxOffset = Math.max(
			amm.maxSpread / 5,
			(PERCENTAGE_PRECISION.toNumber() / 10000) *
				(amm.curveUpdateIntensity - 100)
		);

		const liquidityFraction = calculateInventoryLiquidityRatio(
			amm.baseAssetAmountWithAmm,
			amm.baseAssetReserve,
			amm.minBaseAssetReserve,
			amm.maxBaseAssetReserve
		);
		const liquidityFractionSigned = liquidityFraction.mul(
			sigNum(amm.baseAssetAmountWithAmm.add(amm.baseAssetAmountWithUnsettledLp))
		);
		referencePriceOffset = calculateReferencePriceOffset(
			reservePrice,
			amm.last24HAvgFundingRate,
			liquidityFractionSigned,
			amm.historicalOracleData.lastOraclePriceTwap5Min,
			amm.lastMarkPriceTwap5Min,
			amm.historicalOracleData.lastOraclePriceTwap,
			amm.lastMarkPriceTwap,
			maxOffset
		);
	}

	const [longSpread, shortSpread] = calculateSpread(
		amm,
		oraclePriceData,
		now,
		reservePrice
	);

	const askReserves = calculateSpreadReserve(
		longSpread + referencePriceOffset.toNumber(),
		PositionDirection.LONG,
		amm
	);
	const bidReserves = calculateSpreadReserve(
		-shortSpread + referencePriceOffset.toNumber(),
		PositionDirection.SHORT,
		amm
	);

	return [bidReserves, askReserves];
}

export type OraclePriceData = {
	price: BN;
	// slot: BN;
	confidence: BN;
	hasSufficientNumberOfDataPoints?: boolean;
	twap?: BN;
	twapConfidence?: BN;
	maxPrice?: BN; // pre-launch markets only
};

export function calculateBidAskPrice(
	amm: AMM,
	// oraclePriceData: OraclePriceData,
	// withUpdate = true
): [BN, BN] {
	// let newAmm: AMM;
	// if (withUpdate) {
	// 	newAmm = calculateUpdatedAMM(amm, oraclePriceData);
	// } else {
  // }

  const oraclePriceData: OraclePriceData = {
    price: amm.historicalOracleData.lastOraclePrice,
    confidence: amm.historicalOracleData.lastOracleConf,
    twap: amm.historicalOracleData.lastOraclePriceTwap
  }


  const newAmm = amm;

	const [bidReserves, askReserves] = calculateSpreadReserves(
		newAmm,
		oraclePriceData
	);

	const askPrice = calculatePrice(
		askReserves.baseAssetReserve,
		askReserves.quoteAssetReserve,
		newAmm.pegMultiplier
	);

	const bidPrice = calculatePrice(
		bidReserves.baseAssetReserve,
		bidReserves.quoteAssetReserve,
		newAmm.pegMultiplier
	);

	return [bidPrice, askPrice];
}

export type OracleGuardRails = {
	priceDivergence: {
		markOraclePercentDivergence: BN;
		oracleTwap5MinPercentDivergence: BN;
	};
	validity: {
		slotsBeforeStaleForAmm: BN;
		slotsBeforeStaleForMargin: BN;
		confidenceIntervalMaxSize: BN;
		tooVolatileRatio: BN;
	};
};

export type FeeStructure = {
	feeTiers: FeeTier[];
	fillerRewardStructure: OrderFillerRewardStructure;
	flatFillerFee: BN;
	referrerRewardEpochUpperBound: BN;
};

export type OrderFillerRewardStructure = {
	rewardNumerator: BN;
	rewardDenominator: BN;
	timeBasedRewardLowerBound: BN;
};

export type FeeTier = {
	feeNumerator: number;
	feeDenominator: number;
	makerRebateNumerator: number;
	makerRebateDenominator: number;
	referrerRewardNumerator: number;
	referrerRewardDenominator: number;
	refereeFeeNumerator: number;
	refereeFeeDenominator: number;
};


export type StateAccount = {
	admin: PublicKey;
	exchangeStatus: number;
	whitelistMint: PublicKey;
	discountMint: PublicKey;
	oracleGuardRails: OracleGuardRails;
	numberOfAuthorities: BN;
	numberOfSubAccounts: BN;
	numberOfMarkets: number;
	numberOfSpotMarkets: number;
	minPerpAuctionDuration: number;
	defaultMarketOrderTimeInForce: number;
	defaultSpotAuctionDuration: number;
	liquidationMarginBufferRatio: number;
	settlementDuration: number;
	maxNumberOfSubAccounts: number;
	signer: PublicKey;
	signerNonce: number;
	srmVault: PublicKey;
	perpFeeStructure: FeeStructure;
	spotFeeStructure: FeeStructure;
	lpCooldownTime: BN;
	initialPctToLiquidate: number;
	liquidationDuration: number;
	maxInitializeUserFee: number;
};