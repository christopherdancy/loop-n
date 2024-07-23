import { UserAccount } from "../../drift/types";
import { useTradeContext } from "../TradeProvider";
import { useState } from "react";
import { HedgeDetails } from "./HedgeDetails";
  
// todo: show actual fees + init account(SOL)
export function CoverageFees({solBalance}: {solBalance: number}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

    const { tradeData} = useTradeContext();
    if (!tradeData || tradeData.collateral === 0) return;
    
    return (
      <div className="bg-gray-50 p-4 rounded-2xl font-mono mb-4">
        <div className="flex justify-between items-center mb-2 pl-1">
          <span>Coverage Fees</span>
          <span>${(tradeData.collateral + parseFloat(tradeData.txFee.slice(1))).toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-gray-400 pl-1">
          <button onClick={toggleExpanded} className="text-blue-500 text-sm text-center focus:outline-none">
            {isExpanded ? 'Hide Details' : 'Details'}
          </button>
        </div>
        {isExpanded && <HedgeDetails solBalance={solBalance}/>}
      </div>
    );
}
{/* <InfoRow label="Tx fee" value={tradeData.txFee} /> */}