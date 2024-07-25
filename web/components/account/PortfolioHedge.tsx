import { PublicKey } from "@solana/web3.js";
import { useState, useMemo, useEffect } from "react";
import { SupportedTokens } from "../drift/utils/perp-utils";
import { calculateCoverage } from "../drift/utils/hedge-utils";
import { CreateHedgeButton } from "./Hedge/CreateHedgeButton";
import { TokenSelector } from "./Hedge/TokenSelector";
import { TradeProvider } from "./TradeProvider";
import { UserWalletBalance } from "./Hedge/UserWalletBalance";
import { useGetPythPrices } from "./pyth-data";
import { UserPositions } from "./UserPositions";
import { ProtectedPosition } from "../drift/utils/order-utils";
import { CoverageFees } from "./Hedge/CoverageFees";
import { useDriftProgramAccount } from "../drift/drift-access";

export function PortfolioHedge({ address }: { address: PublicKey | undefined }) {
    const [selectedToken, setSelectedToken] = useState(SupportedTokens[0]);
    const [tokenAmount, setTokenAmount] = useState('');
    const [protectedPercentage, setProtectedPercentage] = useState('');
    const [minPortfolioValue, setMinPortfolioValue] = useState('');
    const [solBalance, setSolBalance] = useState(0);
    const [isDemo, setIsDemo] = useState(true);
    const [demoOrders, setDemoOrders] = useState<ProtectedPosition[]>([]);
    const { data: prices } = useGetPythPrices();
    const { loopnHedgeMutation, subAccountData, cancelOrderMutation } = useDriftProgramAccount(address);
    
    const handleTokenChange = (e: { target: { value: any; }; }) => {
      const token = SupportedTokens.find((supportedToken) => e.target.value === supportedToken.baseAssetSymbol)
      if (token) {
        setSelectedToken(token) 
        setTokenAmount('')
        setProtectedPercentage('')
      };
    };
    
    const handleTokenAmountChange = (e: { target: { value: any; }; }) => {
      const value = e.target.value;
      // Ensure only numbers and a single decimal point are allowed)
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setTokenAmount(value);
      }
    };
  
    const handleProtectedPercentage = (e: { target: { value: any } }) => {
      const value = e.target.value.replace(/[^0-9.]/g, ''); // Remove all non-numeric characters except for the decimal point
      if (parseFloat(value) > 100){
        return
      } else if (value === '') {
        setProtectedPercentage('')
      } else {
        setProtectedPercentage(`${value}`)
      }
    };

    const handleCreateDemoOrder = (position: ProtectedPosition) => {
      setDemoOrders((prevPos) => {
        const newPos = prevPos.concat(position);
        return newPos;
      });
      setTokenAmount('')
    };
  
    function handleCancelDemoOrder(orderId: number) {
      const newOrders = demoOrders.filter(pos => pos.openId !== orderId);
      setDemoOrders(newOrders)
    }
    
    // Calculate the estimated worth using useMemo
    const estimatedWorth = useMemo(() => {
        if (!prices || !tokenAmount) return 0;
        const priceData = prices[selectedToken.pythId.slice(2)]; // Remove '0x' prefix
        if (!priceData) return 0;
        const price = parseFloat(priceData.price) * 10 ** priceData.expo;
        return parseFloat(tokenAmount) * price;
    }, [prices, tokenAmount, selectedToken]);
  
  
    // Adjust minPortfolioValue if it exceeds estimatedWorth
    useEffect(() => {
      if (isNaN(parseFloat(protectedPercentage)) || tokenAmount === '') {
        setMinPortfolioValue('');
        setProtectedPercentage('');
      } else {
        const protectedValue = `$${((estimatedWorth * parseFloat(protectedPercentage)) / 100).toFixed()}`
        setMinPortfolioValue(protectedValue);
      }
    }, [estimatedWorth, protectedPercentage, tokenAmount]);
  
    // proper logic for account fees without market or inputs + reorg
    // account fees for account creation is .02 but I am unsure where this is coming from
    // update collateral information usdc + solona fee
    // indicate what fee (denom) it is in

    // todo: remove string notion from minportfoliovlaue
    return (
      <TradeProvider selectedToken={selectedToken} minPortfolioValue={minPortfolioValue} tokenAmount={tokenAmount} estimatedWorth={estimatedWorth} isDemo>
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-md">
        <div className='flex justify-between items-center text-left py-4 text-xl text-bold font-mono'>
            <span>Portfolio Coverage</span>
            <label className="flex items-center space-x-2">
              <span className="text-sm">Demo</span>
              <input 
                type="checkbox" 
                checked={isDemo}
                readOnly
                onChange={(e) => setIsDemo(e.target.checked)} 
                className="form-checkbox"
              />
            </label>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 mb-4 font-mono">
          <div className="flex justify-between items-left mb-2 pl-1">
            <span>I own</span>
            {address && <UserWalletBalance address={address} selectedToken={selectedToken} setTokenAmount={setTokenAmount} setSolBalance={setSolBalance}></UserWalletBalance>}
          </div>
          <div className="py-4 grid grid-cols-3 gap-4 items-center">
            <input
              type="text"
              value={tokenAmount}
              onChange={handleTokenAmountChange}
              className="pl-1 rounded-3xl w-full text-3xl col-span-2 bg-gray-50 focus:outline-none focus:ring-0"
              placeholder="0"
            />
            <TokenSelector selectedToken={selectedToken} onTokenChange={handleTokenChange} />
          </div>
          <div className='text-left text-sm pl-1'>
            <span>${estimatedWorth.toFixed(2)}<span className='text-sm text-gray-500'> current value</span></span>
          </div>
          <div className='text-left text-sm pl-1 text-red-400'>
            {/* todo: 30 day low */}
            <span>${!tokenAmount ? (0).toFixed(2) : (parseFloat(tokenAmount) * 130).toFixed(2)}<span className='text-sm'> 30 day low</span></span>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl mb-4 font-mono">
          <div className="flex justify-between items-left mb-2 pl-1">
            <span>I want to protect</span>
          </div>
          <div className="py-4 grid grid-cols-3 gap-6 items-center">
            <div className="flex items-center col-span-2 bg-gray-50 rounded-3xl">
              <input
                type="text"
                value={protectedPercentage}
                onChange={handleProtectedPercentage}
                className="pl-1 w-full text-3xl bg-gray-50 focus:outline-none focus:ring-0"
                placeholder="0"
              />
              <span className="pr-36 text-3xl text-gray-400">%</span>
            </div>
          </div>
          <div className='text-left text-sm pl-1'>
            <span>{isNaN(parseFloat(minPortfolioValue.slice(1))) ? "$0" : minPortfolioValue}
            <span className='text-gray-500'> protected value</span></span>
          </div>
        </div>
        <CoverageFees solBalance={solBalance} />
        <CreateHedgeButton address={address} isDemo={isDemo} demoOrders={demoOrders} handleCreateDemoOrder={handleCreateDemoOrder} hedgeMutation={loopnHedgeMutation}/>
      </div>
        {<UserPositions isDemo={isDemo} demoOrders={demoOrders} handleCancelDemoOrder={handleCancelDemoOrder} subAccountData={subAccountData} cancelMutation={cancelOrderMutation}/>}
      </TradeProvider>
    );
  };