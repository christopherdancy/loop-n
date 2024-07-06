// Here we export some useful types and functions for interacting with the Anchor program.
import { Cluster, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BN, Program, ProgramAccount } from '@coral-xyz/anchor';
import { 
	PerpMarketConfig, 
	OracleSource, 
	PerpPosition, 
	PerpMarketAccount, 
	FeeTier, 
	UserAccount, 
	OptionalOrderParams, 
	OrderType, 
	OrderParams, 
	DefaultOrderParams, 
	Order, 
	PositionDirection, 
	HistoricalOracleData, 
	OraclePriceData, 
	AMM 
} from './types';




// Constants for Account Name
export const MAX_NAME_LENGTH = 32;
export const DEFAULT_USER_NAME = 'Main Account';
export const DEFAULT_MARKET_NAME = 'Default Market Name';

// Constants for the conversion
const ZERO = new BN(0);
export const ONE = new BN(1);
export const TWO = new BN(2);
export const SIX = new BN(6);  // Represents the decimal places
export const FIVE_MINUTE = new BN(60 * 5);
export const precision = new BN(10).pow(SIX);  // This is 10^6 for USDC
export const BASE_PRECISION = new BN(10).pow(new BN(9));
export const PEG_PRECISION_EXP = new BN(6);
export const PRICE_PRECISION_EXP = new BN(6);
export const PEG_PRECISION = new BN(10).pow(PEG_PRECISION_EXP);
export const PRICE_PRECISION = new BN(10).pow(PRICE_PRECISION_EXP);
export const BID_ASK_SPREAD_PRECISION = new BN(1000000); // 10^6
export const PERCENTAGE_PRECISION_EXP = new BN(6);
export const PERCENTAGE_PRECISION = new BN(10).pow(PERCENTAGE_PRECISION_EXP);
export const LAMPORTS_PRECISION = new BN(LAMPORTS_PER_SOL);

// Constants for perp positions
export const AMM_RESERVE_PRECISION_EXP = new BN(9);
export const AMM_RESERVE_PRECISION = new BN(10).pow(AMM_RESERVE_PRECISION_EXP);
export const QUOTE_PRECISION_EXP = new BN(6);
export const QUOTE_PRECISION = new BN(10).pow(QUOTE_PRECISION_EXP);
export const AMM_TO_QUOTE_PRECISION_RATIO =
AMM_RESERVE_PRECISION.div(QUOTE_PRECISION); // 10^3
export const FUNDING_RATE_BUFFER_PRECISION_EXP = new BN(3);
export const FUNDING_RATE_BUFFER_PRECISION = new BN(10).pow(
FUNDING_RATE_BUFFER_PRECISION_EXP
);
export const AMM_TIMES_PEG_TO_QUOTE_PRECISION_RATIO =
AMM_RESERVE_PRECISION.mul(PEG_PRECISION).div(QUOTE_PRECISION); // 10^9
export const DEFAULT_REVENUE_SINCE_LAST_FUNDING_SPREAD_RETREAT = new BN(
-25
).mul(QUOTE_PRECISION);

// PerpMarketConfig
export const SupportedTokens: PerpMarketConfig[] =
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
	logoURI: "logos/sol.svg",
	pythId: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
},
{
	fullName: 'Bonk',
	category: ['Meme', 'Dog'],
	symbol: '1MBONK-PERP',
	baseAssetSymbol: 'BONK',
	marketIndex: 4,
	oracle: new PublicKey('6bquU99ktV1VRiHDr8gMhDFt3kMfhCQo5nfNrg2Urvsn'),
	launchTs: 1677068931000,
	oracleSource: OracleSource.PYTH_1M,
	logoURI: "logos/bonk.png",
	pythId: "0x72b021217ca3fe68922a19aaf990109cb9d84e9ad004b4d2025ad6f529314419"
},
{
	fullName: 'Pepe',
	category: ['Meme'],
	symbol: '1MPEPE-PERP',
	baseAssetSymbol: 'PEPE',
	marketIndex: 10,
	oracle: new PublicKey('FSfxunDmjjbDV2QxpyxFCAPKmYJHSLnLuvQXDLkMzLBm'),
	launchTs: 1683781239000,
	oracleSource: OracleSource.PYTH_1M,
	logoURI: "logos/pepe.png",
	pythId: "0xd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4"
},
{
	fullName: 'WIF',
	category: ['Meme', 'Dog', 'Solana'],
	symbol: 'WIF-PERP',
	baseAssetSymbol: 'WIF',
	marketIndex: 23,
	oracle: new PublicKey('6ABgrEZk8urs6kJ1JNdC1sspH5zKXRqxy8sg3ZG2cQps'),
	launchTs: 1706219971000,
	oracleSource: OracleSource.PYTH,
	logoURI: "logos/wif.png",
	pythId: "0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc"
},
{
	fullName: 'Polygon',
	category: ['L2', 'Infra'],
	symbol: 'MATIC-PERP',
	baseAssetSymbol: 'MATIC',
	marketIndex: 5,
	oracle: new PublicKey('FBirwuDFuRAu4iSGc7RGxN5koHB7EJM1wbCmyPuQoGur'),
	launchTs: 1677690149000, //todo
	oracleSource: OracleSource.PYTH,logoURI: "logos/wif.png",
	pythId: "0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc"
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
	logoURI: "logos/link.png",
	pythId: "0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221"
}
]

// User Account Functions
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

// MATH UTILS
// Function to convert USDC to the smallest unit
export function convertUSDCtoSmallestUnit(usdcAmount: number) {
	// Create a BN instance for the USDC amount
	const bnUsdcAmount = new BN(usdcAmount);

	// Multiply by the precision to get the amount in the smallest unit
	const smallestUnitAmount = bnUsdcAmount.mul(precision);

	return smallestUnitAmount;
}

export function formatPercentageChange(percentageChange: number, decimalPlaces: number = 2): string {
	return `${percentageChange.toFixed(decimalPlaces)}%`;
}

// export function formatTokenAmount(amount: BN, decimals: number = 6, displayDecimals: number = 2, isUSD: boolean = false): string {
// 	const isNegative = amount.isNeg();
// 	const absAmount = amount.abs();

// 	const divisor = new BN(10).pow(new BN(decimals));
// 	const wholePart = absAmount.div(divisor).toString();
// 	const fractionalPart = absAmount.mod(divisor).toString().padStart(decimals, '0');
// 	const formattedFractionalPart = fractionalPart.slice(0, displayDecimals);

// 	// Format the string with the decimal point and handle negative sign
// 	const formattedAmount = `${wholePart}.${formattedFractionalPart}`;
// 	const finalAmount = isNegative ? `-${formattedAmount}` : formattedAmount;

// 	// Add USD formatting if isUSD is true
// 	return isUSD ? `$${finalAmount}` : finalAmount;
// }

export function formatTokenAmount(amount: BN, decimals: number = 6, displayDecimals: number = 2): string {
	const absAmount = amount.abs();

	const divisor = new BN(10).pow(new BN(decimals));
	const wholePart = absAmount.div(divisor).toString();
	const fractionalPart = absAmount.mod(divisor).toString().padStart(decimals, '0');
	const formattedFractionalPart = fractionalPart.slice(0, displayDecimals);

	// Format the string with the decimal point and handle negative sign
	const formattedAmount = `${wholePart}.${formattedFractionalPart}`;

	// Add USD formatting if isUSD is true
	return formattedAmount
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

export function clampBN(x: BN, min: BN, max: BN): BN {
	return BN.max(min, BN.min(x, max));
}

export const sigNum = (x: BN): BN => {
	return x.isNeg() ? new BN(-1) : new BN(1);
};


// User Util Functions to calculate UI

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

export function calculateTakerFee(estimatedEntryPrice: number, positionBaseSizeChange: number, feeTier: FeeTier | undefined) {
if (estimatedEntryPrice === 0 || positionBaseSizeChange === 0 || feeTier === undefined) {
return 0;
}

// Calculate new position value in USD
const newPositionValue = (estimatedEntryPrice * Math.abs(positionBaseSizeChange)) / BASE_PRECISION;

// Calculate taker fee in USD
const takerFee = (newPositionValue * feeTier.feeNumerator) / feeTier.feeDenominator;

const threshold = 0.01; // Threshold for showing "Less than $0.01"
if (Math.abs(takerFee) < threshold) {
return "Less than $0.01";
}
return takerFee.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// PERP / ORDER Utils
export async function findAllMarkets(program: Program): Promise<{
	perpMarkets: PerpMarketAccount[];
  }> {
	const perpMarkets: PerpMarketAccount[] = [];
	
	try {
	  const perpMarketProgramAccounts = await program.account.perpMarket.all() as ProgramAccount<PerpMarketAccount>[];
  
	  for (const perpMarketProgramAccount of perpMarketProgramAccounts) {
		const perpMarket = perpMarketProgramAccount.account as PerpMarketAccount;
		perpMarkets.push(perpMarket);
	  }
  
	  return { perpMarkets };
	} catch (error) {
	  console.error('Error fetching perpMarket accounts:', error);
	  throw error; // rethrow the error after logging it
	}
  }

export function getActivePerpPositionsForUserAccount(
userAccount: UserAccount | undefined
): PerpPosition[] {
return userAccount ? userAccount.perpPositions.filter(
	(pos) =>
	pos.baseAssetAmount.gt(ZERO) 
	// !pos.quoteAssetAmount.eq(ZERO) ||
	// !(pos.openOrders == 0) ||
	// !pos.lpShares.eq(ZERO)
) : [];
}

export function positionCurrentDirection(
userPosition: PerpPosition
): PositionDirection {
return userPosition.baseAssetAmount.gte(ZERO)
	? PositionDirection.LONG
	: PositionDirection.SHORT;
}


// Helper Utils for calculation
function calculateWorstCaseBaseAssetAmount(
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

		/**
 * Calculates a price given an arbitrary base and quote amount (they must have the same precision)
 *
 * @param baseAssetReserves
 * @param quoteAssetReserves
 * @param pegMultiplier
 * @returns price : Precision PRICE_PRECISION
 */
function calculatePrice(
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

function calculateMarketOpenBidAsk(
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

function calculateInventoryLiquidityRatio(
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

function calculateReferencePriceOffset(
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

function calculateLiveOracleTwap(
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

function calculateLiveOracleStd(
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

function getNewOracleConfPct(
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

function calculateVolSpreadBN(
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

function calculateInventoryScale(
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

function calculateEffectiveLeverage(
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

function calculateSpreadBN(
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
	// returnTerms = false
) : {longSpread: number; shortSpread: number} {
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
	// if (returnTerms) {
	// 	return spreadTerms;
	// }
	return {longSpread, shortSpread};
}

function calculateSpread(
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
	const longSpread = spreads.longSpread;
	const shortSpread = spreads.shortSpread;

	return [longSpread, shortSpread];
}

function calculateSpreadReserves(
	amm: AMM,
	oraclePriceData: OraclePriceData,
	now?: BN
) {
	function calculateSpreadReserve(
		spread: number,
		direction: PositionDirection,
		amm: AMM
	): {
		baseAssetReserve: any;
		quoteAssetReserve: any;
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