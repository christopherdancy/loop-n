
import { PublicKey } from "@solana/web3.js";
import { PerpMarketConfig, OracleSource, PerpMarketAccount } from "../types";
import { ProgramAccount, Program } from "@coral-xyz/anchor";

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

// todo: perp markets for mainnet
// todo: setup ts to normalize types
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
		pythId: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
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
		pythId: "0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc"
	}
]