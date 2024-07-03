
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