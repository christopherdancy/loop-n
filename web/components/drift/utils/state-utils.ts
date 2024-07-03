
import { FeeTier, StateAccount } from '../types';
import { BASE_PRECISION, LAMPORTS_PRECISION, PERCENTAGE_PRECISION } from './constants';
import { BN } from '@coral-xyz/anchor';
import { Connection, ParsedAccountData } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

const ZERO = new BN(0);

export async function getRentExemptBalance(connection: Connection, dataSize: number): Promise<number> {
    const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(dataSize);
    return rentExemptBalance;
}

export async function getRentParameters(connection: Connection): Promise<ParsedAccountData | undefined> {
    const rentSysvar = await connection.getParsedAccountInfo(anchor.web3.SYSVAR_RENT_PUBKEY);
    if (!rentSysvar || !rentSysvar.value) {
        return undefined;
    }
    
    const accountInfo = rentSysvar.value.data;
    
    if (Buffer.isBuffer(accountInfo)) {
        throw new Error('Expected ParsedAccountData but received Buffer');
    }
  
    return accountInfo as ParsedAccountData;
}

export async function getRentCost(connection: Connection, dataSize: number, durationInYears: number): Promise<number> {
    const rent = await getRentParameters(connection);
    if (!rent) return 0;
    // Extract lamportsPerByteYear from the rent sysvar
    const lamportsPerByteYear = rent.parsed.info.lamportsPerByteYear;
    // Calculate the total rent cost
    const rentCostPerYear = dataSize * lamportsPerByteYear;
    const totalRentCost = rentCostPerYear * durationInYears;

    return totalRentCost;
}


export function calculateInitUserFee(stateAccount: StateAccount): BN {
	const maxInitFee = new BN(stateAccount.maxInitializeUserFee)
		.mul(LAMPORTS_PRECISION)
		.divn(100);
	const targetUtilization = PERCENTAGE_PRECISION.muln(8).divn(10);

	const accountSpaceUtilization = stateAccount.numberOfSubAccounts
		.addn(1)
		.mul(PERCENTAGE_PRECISION)
		.div(getMaxNumberOfSubAccounts(stateAccount));

	if (accountSpaceUtilization.gt(targetUtilization)) {
		return maxInitFee
			.mul(accountSpaceUtilization.sub(targetUtilization))
			.div(PERCENTAGE_PRECISION.sub(targetUtilization));
	} else {
		return ZERO;
	}
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

export function getMaxNumberOfSubAccounts(stateAccount: StateAccount): BN {
	if (stateAccount.maxNumberOfSubAccounts <= 5) {
		return new BN(stateAccount.maxNumberOfSubAccounts);
	}
	return new BN(stateAccount.maxNumberOfSubAccounts).muln(100);
}