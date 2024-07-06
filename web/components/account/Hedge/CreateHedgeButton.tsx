import { PublicKey } from "@solana/web3.js";
import { useDriftProgramAccount } from "../../drift/drift-access";
import { BASE_PRECISION } from "../../drift/utils/constants";
import { useTradeContext } from "../TradeProvider";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import * as anchor from '@coral-xyz/anchor';
import { PairedOrders, createPairedOrders } from "@/components/drift/utils/order-utils";
import { toScaledInteger } from "@/components/drift/utils/math-utils";


export function CreateHedgeButton(
  { address, isDemo, demoOrders, handleCreateDemoOrder }: 
  { address?: PublicKey, isDemo: boolean, demoOrders: PairedOrders[], handleCreateDemoOrder: (pair: PairedOrders ) => void }
){
    const { tradeData, selectedToken, tokenAmount, minPortfolioValue } = useTradeContext();
    // const { loopnHedgeMutation } = useDriftProgramAccount(address);

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
            onClick={(isDemo) ?  
              () => handleCreateDemoOrder(createPairedOrders(
                demoOrders, 
                selectedToken.marketIndex, 
                (new anchor.BN(toScaledInteger(tokenAmount, 9))), 
                tradeData.strikePrice
              )) :
              () => {}
              // :
              // () =>
              // loopnHedgeMutation.mutate({
              //   usdcDeposit: tradeData.collateral,
              //   baseAssetAmount: new anchor.BN(tokenAmount).mul(BASE_PRECISION),
              //   marketIndex: selectedToken.marketIndex,
              //   price: tradeData.strikePrice,
              //   stopLossPrice: tradeData.stopLossPrice,
              //   simulate: true,
              // })
            }
          >
            Cover Losses
          </button>
      }
      </>
    );
  }