import { PublicKey } from "@solana/web3.js";
import { useDriftProgramAccount } from "../../drift/drift-access";
import { BASE_PRECISION } from "../../drift/utils/constants";
import { useTradeContext } from "../TradeProvider";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import * as anchor from '@coral-xyz/anchor';


export function CreateHedgeButton({ address }: {address?: PublicKey}) {
    const { tradeData, selectedToken, tokenAmount, minPortfolioValue } = useTradeContext();
    const { loopnHedgeMutation } = useDriftProgramAccount(address);
    return (
      <>
      {
        !address ?
          <WalletMultiButton>CONNECT WALLET </WalletMultiButton> :
        !tokenAmount || !minPortfolioValue || !tradeData?
          <div
            className="p-4 rounded-xl bg-gray-500 w-full text-white font-semibold font-mono cursor-default pointer-events-none text-sm"
          >
            {!tradeData ? "Data Not Loaded" : tokenAmount && !minPortfolioValue ? "Missing Min. HODL Value" : "Missing HODL Position"}
          </div> 
        :
          <button
            className="btn btn-primary w-full text-white font-mono"
            onClick={() =>
              loopnHedgeMutation.mutate({
                usdcDeposit: tradeData.collateral,
                baseAssetAmount: new anchor.BN(tokenAmount).mul(BASE_PRECISION),
                marketIndex: selectedToken.marketIndex,
                price: tradeData.strikePrice,
                stopLossPrice: tradeData.stopLossPrice,
                simulate: true,
              })
            }
          >
            Cover Losses
          </button>
      }
      </>
    );
  }