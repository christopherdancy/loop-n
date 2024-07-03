import { BN } from "@coral-xyz/anchor";
import { PublicKey, Cluster } from "@solana/web3.js";
import * as anchor from '@coral-xyz/anchor';

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