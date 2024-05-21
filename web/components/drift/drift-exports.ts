// Here we export some useful types and functions for interacting with the Anchor program.
import { Cluster, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';


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