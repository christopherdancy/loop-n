import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

const ZERO = new BN(0);

export class MarketType {
    static readonly SPOT = { spot: {} };
    static readonly PERP = { perp: {} };
}

export class SpotBalanceType {
    static readonly DEPOSIT = { deposit: {} };
    static readonly BORROW = { borrow: {} };
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

export class PostOnlyParams {
    static readonly NONE = { none: {} };
    static readonly MUST_POST_ONLY = { mustPostOnly: {} }; // Tx fails if order can't be post only
    static readonly TRY_POST_ONLY = { tryPostOnly: {} }; // Tx succeeds and order not placed if can't be post only
    static readonly SLIDE = { slide: {} }; // Modify price to be post only if can't be post only
}


export class OrderType {
    static readonly LIMIT = { limit: {} };
    static readonly TRIGGER_MARKET = { triggerMarket: {} };
    static readonly TRIGGER_LIMIT = { triggerLimit: {} };
    static readonly MARKET = { market: {} };
    static readonly ORACLE = { oracle: {} };
}

export class OrderStatus {
    static readonly INIT = { init: {} };
    static readonly OPEN = { open: {} };
}

export class PositionDirection {
    static readonly LONG = { long: {} };
    static readonly SHORT = { short: {} };
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
export type NecessaryOrderParams = {
    orderType: OrderType;
    marketIndex: number;
    baseAssetAmount: BN;
    direction: PositionDirection;
};

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

  export type OrderFillerRewardStructure = {
	rewardNumerator: BN;
	rewardDenominator: BN;
	timeBasedRewardLowerBound: BN;
};
  
  export type OptionalOrderParams = {
    [Property in keyof OrderParams]?: OrderParams[Property];
  } & NecessaryOrderParams;

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

export type FeeStructure = {
	feeTiers: FeeTier[];
	fillerRewardStructure: OrderFillerRewardStructure;
	flatFillerFee: BN;
	referrerRewardEpochUpperBound: BN;
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

export class OracleSource {
    static readonly PYTH = { pyth: {} };
    static readonly PYTH_1K = { pyth1K: {} };
    static readonly PYTH_1M = { pyth1M: {} };
    static readonly SWITCHBOARD = { switchboard: {} };
    static readonly QUOTE_ASSET = { quoteAsset: {} };
    static readonly PYTH_STABLE_COIN = { pythStableCoin: {} };
    static readonly Prelaunch = { prelaunch: {} };
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

export type OraclePriceData = {
	price: BN;
	// slot: BN;
	confidence: BN;
	hasSufficientNumberOfDataPoints?: boolean;
	twap?: BN;
	twapConfidence?: BN;
	maxPrice?: BN; // pre-launch markets only
};