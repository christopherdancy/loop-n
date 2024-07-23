import { BN } from "@coral-xyz/anchor";
import { formatTokenAmount } from "../../drift/utils/math-utils";
import { useTradeContext } from "../TradeProvider";

const InfoRow = ({ label, value }: {label:string, value: string | number}) => (
    <div className="flex justify-between items-center mb-2 pl-1">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
  
export function HedgeDetails({solBalance}: {solBalance: number}) {
    const { tradeData, estimatedWorth, selectedToken, minPortfolioValue} = useTradeContext();
    return (
      <div className="text-xs text-gray-500 mt-4 pl-1">
        {/* HODL Info Section */}
        {/* <div className="flex justify-between items-center mb-2 underline font-bold decoration-blue-500">
          <span>HODL Info</span>
        </div>
        <InfoRow label="Protected asset" value={selectedToken.baseAssetSymbol} />
        <InfoRow label="HODL Value" value={`$${estimatedWorth.toFixed(2)}`} />
        <InfoRow label="Protected Value" value={!minPortfolioValue ? '$0' : minPortfolioValue} /> */}
  
        {/* Trade Info Section */}
        {tradeData && (
          <div>
            <div className="flex justify-between items-center my-2 underline font-bold decoration-blue-500">
              <span>Trade Info</span>
            </div>
            <InfoRow label="Leverage" value={tradeData.leverage} />
            <InfoRow label="Strike price" value={`$${tradeData.strikePrice.toFixed(2)}`} />
            <InfoRow label="Stop Loss Price" value={`$${tradeData.stopLossPrice.toFixed(2)}`} />
            <InfoRow label="Liquidation Price" value={tradeData.liquidationPrice} />
  
        {/* Fee Info Section */}
            <div className="flex justify-between items-center my-2 underline font-bold decoration-blue-500">
              <span>Fee Info</span>
            </div>
            <InfoRow label="Collateral" value={`$${tradeData.collateral.toFixed(2)}`} />
            <InfoRow label="Tx fee" value={tradeData.txFee} />
            <InfoRow label="Init Account Fee" value={"0.1 SOL"} />
            {/* <InfoRow label="Init Account Fee" value={tradeData.initAccountFee} /> */}
            <InfoRow
              label="Solana Rent Fee"
              value={`${formatTokenAmount(new BN(tradeData.rent), 9, 2)} SOL`}
            />
            {/* {solBalance < tradeData.rentExempt && (
            )}  */}
          </div>
       )}
      </div>
    );
  }