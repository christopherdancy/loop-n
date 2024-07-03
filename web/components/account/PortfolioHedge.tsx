import { PublicKey } from "@solana/web3.js";
import { useState, useMemo, useEffect } from "react";
import { SupportedTokens } from "../drift/utils/perp-utils";
import { calculateCoverage } from "../drift/utils/hedge-utils";
import { UserAccount } from "../drift/types";
import { CreateHedgeButton } from "./Hedge/CreateHedgeButton";
import { HedgeDetails } from "./Hedge/HedgeDetails";
import { TokenSelector } from "./Hedge/TokenSelector";
import { TradeProvider } from "./TradeProvider";
import { UserWalletBalance } from "./Hedge/UserWalletBalance";

export function PortfolioHedge({ address }: { address: PublicKey | undefined }) {
    const [selectedToken, setSelectedToken] = useState(SupportedTokens[0]);
    const [tokenAmount, setTokenAmount] = useState('');
    const [minPortfolioValue, setMinPortfolioValue] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [solBalance, setSolBalance] = useState(0);
    const [userData, setUserData] = useState<UserAccount>();
    // const prices = useGetPythPrices();
    
    const handleTokenChange = (e: { target: { value: any; }; }) => {
      const token = SupportedTokens.find((supportedToken) => e.target.value === supportedToken.baseAssetSymbol)
      if (token) {
        setSelectedToken(token) 
        setTokenAmount('')
        setMinPortfolioValue('')
      };
    };
    
    // todo: track for pepe and bonk ... small amounts
    const handleTokenAmountChange = (e: { target: { value: any; }; }) => {
      const value = e.target.value;
      // Ensure only numbers and a single decimal point are allowed)
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setTokenAmount(value);
      }
    };
  
    const handleMinPortfolioValue = (e: { target: { value: any } }) => {
      const value = e.target.value.replace(/[^0-9.]/g, ''); // Remove all non-numeric characters except for the decimal point
      if (parseFloat(value) > estimatedWorth){
        return
      } else if (value === '') {
        setMinPortfolioValue('')
      } else {
        setMinPortfolioValue(`$${value}`)
      }
    };
  
    // Calculate the estimated worth using useMemo
    const estimatedWorth = useMemo(() => {
      const prices = {data: 11.5} 
      if (!prices.data || !tokenAmount) return 0;
      // const priceData = prices.data[selectedToken.pythId.slice(2)]; // Remove '0x' prefix
      // if (!priceData) return 0;
      // const price = parseFloat(priceData.price) * 10 ** priceData.expo;
      const price= 146.26
      return parseFloat(tokenAmount) * price;
    }, [tokenAmount, selectedToken]);
    // }, [prices.data, tokenAmount, selectedToken]);
  
    const toggleExpanded = () => {
      setIsExpanded(!isExpanded);
    };
  
  
    // Adjust minPortfolioValue if it exceeds estimatedWorth
    useEffect(() => {
      const minValue = parseFloat(minPortfolioValue.slice(1));
      if (minValue > estimatedWorth) {
        setMinPortfolioValue('');
      }
    }, [estimatedWorth, minPortfolioValue]);
  
    // proper logic for account fees without market or inputs + reorg
    // account fees for account creation is .02 but I am unsure where this is coming from
    // update collateral information usdc + solona fee
    // indicate what fee (denom) it is in
    return (
      <TradeProvider selectedToken={selectedToken} minPortfolioValue={minPortfolioValue} tokenAmount={tokenAmount} estimatedWorth={estimatedWorth}>
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-md">
        <div className='text-left py-4 text-xl text-bold font-mono'>
        <span>Portfolio Coverage</span>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 mb-4 font-mono">
          <div className="flex justify-between items-left mb-2 pl-1">
            <span>HODL Position</span>
            {address && <UserWalletBalance address={address} selectedToken={selectedToken} setTokenAmount={setTokenAmount} setSolBalance={setSolBalance} setUserData={setUserData}></UserWalletBalance>}
          </div>
          <div className="py-2 grid grid-cols-3 gap-4 items-center">
            <input
              type="text"
              value={tokenAmount}
              onChange={handleTokenAmountChange}
              className="pl-1 rounded-3xl w-full text-3xl col-span-2 bg-gray-50 focus:outline-none focus:ring-0"
              placeholder="0"
            />
            <TokenSelector selectedToken={selectedToken} onTokenChange={handleTokenChange} />
          </div>
          <div className='text-left pl-1'>
          <span>${estimatedWorth.toFixed(2)}</span>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl mb-4 font-mono">
          <div className="flex justify-between items-left mb-2 pl-1">
            <span>Min. HODL Value</span>
          </div>
          <div className="py-2 grid grid-cols-3 gap-4 items-center">
          <input
              type="text"
              value={minPortfolioValue}
              onChange={handleMinPortfolioValue}
              className="pl-1 rounded-3xl w-full text-3xl col-span-2 bg-gray-50 focus:outline-none focus:ring-0"
              placeholder="$0"
            />
          </div>
          <div className='text-left pl-1'>
            <span>{calculateCoverage(minPortfolioValue, estimatedWorth)}<span className='text-sm text-gray-500'>% of current value</span></span>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl font-mono mb-4">
        <div className="flex justify-between items-center mb-2 pl-1">
          <span>Coverage Fees</span>
          <span>$350.29</span>
        </div>
        <div className="flex justify-between items-center text-gray-400 pl-1">
          <button onClick={toggleExpanded} className="text-blue-500 text-sm text-center focus:outline-none">
            {isExpanded ? 'Hide Details' : 'Details'}
          </button>
        </div>
        {isExpanded && <HedgeDetails solBalance={solBalance} userData={userData}/>}
      </div>
         <CreateHedgeButton address={address}/>
      </div>
      </TradeProvider>
    );
  };