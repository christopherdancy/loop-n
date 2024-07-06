
import { PublicKey } from "@solana/web3.js";
import { PerpMarketConfig, OracleSource, PerpMarketAccount } from "../types";
import { ProgramAccount, Program} from "@coral-xyz/anchor";
import * as anchor from '@coral-xyz/anchor';


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
	  // console.error('Error fetching perpMarket accounts:', error);
	  throw error; // rethrow the error after logging it
	}
  }

export function getMarketConfigByIndex(marketIndex : number): (PerpMarketConfig) {
	const config = SupportedTokens.find(config => config.marketIndex === marketIndex);
	if (!config) return SupportedTokens[0]
	return config
	
}

// todo: perp markets for mainnet
// todo: setup ts to normalize types (1M)
// PerpMarketConfig
export const SupportedTokens: PerpMarketConfig[] =
[
	{
		fullName: 'Solana',
		category: ['L1', 'Infra'],
		symbol: 'SOL-PERP',
		baseAssetSymbol: 'SOL',
		marketIndex: 0,
		oracle: new PublicKey('H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG'),
		launchTs: 1667560505000,
		oracleSource: OracleSource.PYTH,
		logoURI: "logos/sol.svg",
		pythId: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
		marginRatioInitial: 1000,
		marginRatioMaintenance: 500,
	},
	{
		fullName: 'WIF',
		category: ['Meme', 'Dog', 'Solana'],
		symbol: 'WIF-PERP',
		baseAssetSymbol: 'WIF',
		marketIndex: 23,
		oracle: new PublicKey('g6eRCbboSwK4tSWngn773RCMexr1APQr4uA9bGZBYfo'),
		launchTs: 1706219971000,
		oracleSource: OracleSource.PYTH,
		logoURI: "logos/wif.png",
		pythId: "0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc",
		marginRatioInitial: 2500,
		marginRatioMaintenance: 1250,
	}
]

export function createDummyMarket(marketIndex: number, name: string, marginRatioInitial: number, marginRatioMaintenance: number): PerpMarketAccount {
    return {
        status: { active: {} },
        contractType: { perpetual: {} },
        contractTier: { speculative: {} },
        expiryTs: new anchor.BN(0),
        expiryPrice: new anchor.BN(0),
        marketIndex,
        pubkey: new PublicKey(0),
        name: Array.from(name.padEnd(32, ' ')).map(char => char.charCodeAt(0)),
        amm: {
            baseAssetReserve: new anchor.BN(0),
            sqrtK: new anchor.BN(0),
            cumulativeFundingRate: new anchor.BN(0),
            lastFundingRate: new anchor.BN(0),
            lastFundingRateTs: new anchor.BN(0),
            lastMarkPriceTwap: new anchor.BN(0),
            lastMarkPriceTwap5Min: new anchor.BN(0),
            lastMarkPriceTwapTs: new anchor.BN(0),
            lastTradeTs: new anchor.BN(0),
            oracle: new PublicKey(0),
            oracleSource: OracleSource.PYTH,
            historicalOracleData: {
                lastOraclePrice: new anchor.BN(0),
                lastOracleDelay: new anchor.BN(0),
                lastOracleConf: new anchor.BN(0),
                lastOraclePriceTwap: new anchor.BN(0),
                lastOraclePriceTwap5Min: new anchor.BN(0),
                lastOraclePriceTwapTs: new anchor.BN(0),
            },
            lastOracleReservePriceSpreadPct: new anchor.BN(0),
            lastOracleConfPct: new anchor.BN(0),
            fundingPeriod: new anchor.BN(0),
            quoteAssetReserve: new anchor.BN(0),
            pegMultiplier: new anchor.BN(0),
            cumulativeFundingRateLong: new anchor.BN(0),
            cumulativeFundingRateShort: new anchor.BN(0),
            last24HAvgFundingRate: new anchor.BN(0),
            lastFundingRateShort: new anchor.BN(0),
            lastFundingRateLong: new anchor.BN(0),
            totalLiquidationFee: new anchor.BN(0),
            totalFeeMinusDistributions: new anchor.BN(0),
            totalFeeWithdrawn: new anchor.BN(0),
            totalFee: new anchor.BN(0),
            totalFeeEarnedPerLp: new anchor.BN(0),
            userLpShares: new anchor.BN(0),
            baseAssetAmountWithUnsettledLp: new anchor.BN(0),
            orderStepSize: new anchor.BN(0),
            orderTickSize: new anchor.BN(0),
            maxFillReserveFraction: new anchor.BN(0),
            maxSlippageRatio: new anchor.BN(0),
            baseSpread: new anchor.BN(0),
            curveUpdateIntensity: new anchor.BN(0),
            baseAssetAmountWithAmm: new anchor.BN(0),
            baseAssetAmountLong: new anchor.BN(0),
            baseAssetAmountShort: new anchor.BN(0),
            quoteAssetAmount: new anchor.BN(0),
            terminalQuoteAssetReserve: new anchor.BN(0),
            concentrationCoef: new anchor.BN(0),
            feePool: {
                scaledBalance: new anchor.BN(0),
                marketIndex: marketIndex,
            },
            totalExchangeFee: new anchor.BN(0),
            totalMmFee: new anchor.BN(0),
            netRevenueSinceLastFunding: new anchor.BN(0),
            lastUpdateSlot: new anchor.BN(0),
            lastOracleNormalisedPrice: new anchor.BN(0),
            lastOracleValid: false,
            lastBidPriceTwap: new anchor.BN(0),
            lastAskPriceTwap: new anchor.BN(0),
            longSpread: new anchor.BN(0),
            shortSpread: new anchor.BN(0),
            maxSpread: new anchor.BN(0),
            baseAssetAmountPerLp: new anchor.BN(0),
            quoteAssetAmountPerLp: new anchor.BN(0),
            targetBaseAssetAmountPerLp: new anchor.BN(0),
            ammJitIntensity: new anchor.BN(0),
            maxOpenInterest: new anchor.BN(0),
            maxBaseAssetReserve: new anchor.BN(0),
            minBaseAssetReserve: new anchor.BN(0),
            totalSocialLoss: new anchor.BN(0),
            quoteBreakEvenAmountLong: new anchor.BN(0),
            quoteBreakEvenAmountShort: new anchor.BN(0),
            quoteEntryAmountLong: new anchor.BN(0),
            quoteEntryAmountShort: new anchor.BN(0),
            markStd: new anchor.BN(0),
            oracleStd: new anchor.BN(0),
            longIntensityCount: new anchor.BN(0),
            longIntensityVolume: new anchor.BN(0),
            shortIntensityCount: new anchor.BN(0),
            shortIntensityVolume: new anchor.BN(0),
            volume24H: new anchor.BN(0),
            minOrderSize: new anchor.BN(0),
            maxPositionSize: new anchor.BN(0),
            bidBaseAssetReserve: new anchor.BN(0),
            bidQuoteAssetReserve: new anchor.BN(0),
            askBaseAssetReserve: new anchor.BN(0),
            askQuoteAssetReserve: new anchor.BN(0),
            perLpBase: new anchor.BN(0),
            netUnsettledFundingPnl: new anchor.BN(0),
            quoteAssetAmountWithUnsettledLp: new anchor.BN(0),
            referencePriceOffset: new anchor.BN(0),
        },
        numberOfUsersWithBase: 0,
        numberOfUsers: 0,
        marginRatioInitial,
        marginRatioMaintenance,
        nextFillRecordId: new anchor.BN(0),
        nextFundingRateRecordId: new anchor.BN(0),
        nextCurveRecordId: new anchor.BN(0),
        pnlPool: {
            scaledBalance: new anchor.BN(0),
            marketIndex: marketIndex,
        },
        liquidatorFee: 0,
        ifLiquidationFee: 0,
        imfFactor: 0,
        unrealizedPnlImfFactor: 0,
        unrealizedPnlMaxImbalance: new anchor.BN(0),
        unrealizedPnlInitialAssetWeight: 0,
        unrealizedPnlMaintenanceAssetWeight: 0,
        insuranceClaim: {
            revenueWithdrawSinceLastSettle: new anchor.BN(0),
            maxRevenueWithdrawPerPeriod: new anchor.BN(0),
            lastRevenueWithdrawTs: new anchor.BN(0),
            quoteSettledInsurance: new anchor.BN(0),
            quoteMaxInsurance: new anchor.BN(0),
        },
        quoteSpotMarketIndex: 0,
        feeAdjustment: 0,
        pausedOperations: 0,
    };
}