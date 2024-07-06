import { BN } from "@coral-xyz/anchor";
import { precision, PRICE_PRECISION } from "./constants";

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

// Function to convert a decimal amount to a scaled integer
export const toScaledInteger = (amount: string, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.floor(parseFloat(amount) * factor);
};