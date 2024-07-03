import { createContext, useContext, useEffect, useState } from "react";
import { useDriftProgramMarketData } from "../drift/drift-access";
import { BASE_PRECISION } from "../drift/utils/constants";
import { calculateCollateralRequirements, calculateLimitOrderPrice, calculateLiquidationPriceShort } from "../drift/utils/hedge-utils";
import * as anchor from '@coral-xyz/anchor';
import { FeeTier, PerpMarketAccount, PerpMarketConfig } from "../drift/types";
import { calculateTakerFee } from "../drift/utils/state-utils";

interface TradeData {
    leverage: string;
    strikePrice: number;
    stopLossPrice: number;
    liquidationPrice: string;
    collateral: number;
    txFee: string;
    initAccountFee: string,
    rentExempt: number,
    rent: number
  }
  
  interface TradeContextProps {
    market: any;
    tradeData: TradeData | undefined;
    selectedToken: any;
    minPortfolioValue: string;
    tokenAmount: string;
    estimatedWorth: number;
  }
  
  const TradeContext = createContext<TradeContextProps | undefined>(undefined);
  
  export const useTradeContext = () => {
    const context = useContext(TradeContext);
    if (!context) {
      throw new Error('useTradeContext must be used within a TradeProvider');
    }
    return context;
  };
  
  const calculateAllDetails = (market: PerpMarketAccount | undefined, minPortfolioValue: string, tokenAmount: string, fees: { initUserFee: anchor.BN; rentFee: number; rentExemptBalance: number; tradeFees: FeeTier; }) => {
    const collateralRequirements = calculateCollateralRequirements(market, minPortfolioValue);
    const limitOrderPrice = calculateLimitOrderPrice(minPortfolioValue, tokenAmount);
    const liquidationPriceShort = calculateLiquidationPriceShort(tokenAmount, limitOrderPrice, collateralRequirements);
    return {
      leverage: `${collateralRequirements.leverage}X`,
      strikePrice: limitOrderPrice,
      stopLossPrice: liquidationPriceShort.stopLossPrice,
      liquidationPrice: `$${liquidationPriceShort.liqPrice.toFixed(2)}`,
      collateral: collateralRequirements.initialCollateral,
      txFee: `${calculateTakerFee(limitOrderPrice, new anchor.BN(tokenAmount).mul(BASE_PRECISION), fees.tradeFees)}`,
      initAccountFee: `${fees.initUserFee.eq(0) ? ".01 SOL" : fees.initUserFee.toString()}`,
      rentExempt: fees.rentExemptBalance,
      rent: fees.rentFee
    };
  };
  
  export function TradeProvider({
    children,
    selectedToken,
    estimatedWorth,
    minPortfolioValue,
    tokenAmount,
  }: {
    children: React.ReactNode;
    selectedToken: PerpMarketConfig;
    estimatedWorth: number;
    minPortfolioValue: string;
    tokenAmount: string;
  }) {
    const { perpMarkets, fees } = useDriftProgramMarketData();
    const [market, setMarket] = useState<PerpMarketAccount>();
    const [tradeData, setTradeData] = useState<TradeData | undefined>();
  
    useEffect(() => {
      if (perpMarkets && fees) {
        const foundMarket = perpMarkets.find((market) => market.marketIndex === selectedToken.marketIndex);
        if (foundMarket) {
          setMarket(foundMarket);
          const calculatedDetails = calculateAllDetails(foundMarket, minPortfolioValue, tokenAmount, fees);
          setTradeData(calculatedDetails);
        }
      }

    }, [selectedToken, perpMarkets, minPortfolioValue, tokenAmount]);
  
    return (
      <TradeContext.Provider value={{ market, tradeData, estimatedWorth, selectedToken, minPortfolioValue, tokenAmount }}>
        {children}
      </TradeContext.Provider>
    );
  }