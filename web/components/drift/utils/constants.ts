import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

// Constants for Account Name
export const MAX_NAME_LENGTH = 32;
export const DEFAULT_USER_NAME = 'Main Account';
export const DEFAULT_MARKET_NAME = 'Default Market Name';

// Constants for the conversion
export const ZERO = new BN(0);
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