import { PublicKey } from "@solana/web3.js";
import { useTradeContext } from "../TradeProvider";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import * as anchor from '@coral-xyz/anchor';
import { ProtectedPosition, createProtectedPosition } from "@/components/drift/utils/order-utils";
import { toScaledInteger } from "@/components/drift/utils/math-utils";
import { BASE_PRECISION } from "@/components/drift/utils/constants";


export function CreateHedgeButton(
  { address, isDemo, demoOrders, handleCreateDemoOrder, hedgeMutation }: 
  { address?: PublicKey, isDemo: boolean, demoOrders: ProtectedPosition[], handleCreateDemoOrder: (position: ProtectedPosition ) => void, hedgeMutation: any }
){
    const { tradeData, selectedToken, tokenAmount, minPortfolioValue } = useTradeContext();
    return (
      <>
      {
        !address ?
          <WalletMultiButton>CONNECT WALLET </WalletMultiButton> :
        !tokenAmount || !minPortfolioValue || !tradeData?
          <div
            className="p-4 rounded-xl bg-gray-500 w-full text-white font-semibold font-mono cursor-default pointer-events-none text-sm"
          >
            {!tradeData ? "Data Not Loaded" : tokenAmount && !minPortfolioValue ? "Missing Protection %" : "Missing Asset Holdings"}
          </div> 
        :
          <button
            className="btn btn-primary w-full text-white font-mono"
            onClick={isDemo ?  
              () => handleCreateDemoOrder(createProtectedPosition(
                selectedToken.marketIndex, 
                (new anchor.BN(toScaledInteger(tokenAmount, 9))), 
                tradeData.strikePrice,
                "pending",
                demoOrders.length > 0 ? demoOrders.length + 1 : 0,
              )) 
              :
              () =>
              hedgeMutation.mutate({
                usdcDeposit: tradeData.collateral,
                baseAssetAmount: new anchor.BN(tokenAmount).mul(BASE_PRECISION),
                marketIndex: selectedToken.marketIndex,
                price: tradeData.strikePrice,
                stopLossPrice: tradeData.stopLossPrice,
                simulate: true,
              })
            }
          >
            Protect Portfolio
          </button>
      }
      </>
    );
  }