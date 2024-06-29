import {  PerpMarketAccount } from '../drift/types';
export function calculateCollateralRequirements(
    market: PerpMarketAccount | undefined, 
    minPortfolioValue: string
    ): {initialCollateral: number, maintenanceMargin: number, leverage: number} {
    if (!market || !minPortfolioValue) return {initialCollateral:0, maintenanceMargin:0, leverage: 0}
    const leverage = 10000 / market.marginRatioInitial
    const initial = (market.marginRatioInitial * parseFloat(minPortfolioValue.slice(1))) / 10000;
    return {initialCollateral:initial, maintenanceMargin:market.marginRatioMaintenance, leverage: leverage}
  }
  
export function calculateLimitOrderPrice(minPortfolioValue: string, tokenAmount: string): number {
    if (!minPortfolioValue || !tokenAmount) return 0
    return parseFloat(minPortfolioValue.slice(1)) / parseFloat(tokenAmount);
}
  
export function calculateLiquidationPriceShort(
    positionSize: string, 
    entryPrice: number, 
    collateralRequirements: {
        initialCollateral: number, 
        maintenanceMargin: number, 
        leverage: number
    } | undefined
    ): {liqPrice: number, stopLossPrice: number} {
    // Initialize variables
    if (!collateralRequirements) return {liqPrice:0, stopLossPrice:0}
    let liquidationPrice = entryPrice;
    let pnl = 0;
    let totalCollateral = collateralRequirements.initialCollateral;
    let maintenanceMarginRequirement = 0;
  
    // Helper function to calculate PnL for short position
    const calculatePnL = (price: number, entryPrice: number, positionSize: number) => {
      return positionSize * (price - entryPrice); // Short position PnL
    };
  
    // Helper function to calculate maintenance margin requirement
    const calculateMaintenanceMarginRequirement = (price: number, positionSize: number, maintenanceMarginRatio: number): number => {
      return (positionSize * price * maintenanceMarginRatio) / 10000;
    };
  
    function calculateStopLossPrice(liquidationPrice: number): number {
      const percentageFromLiquidation = 0.02; // 2% buffer from liquidation price
      let stopLossPrice;
        stopLossPrice = liquidationPrice * (1 - percentageFromLiquidation);
    
      // Round to nearest sensible number (e.g., nearest whole number or to 2 decimal places)
      stopLossPrice = Math.round(stopLossPrice * 100) / 100;
    
      return stopLossPrice;
    }
  
    // Iterate to find the liquidation price
    while (totalCollateral > maintenanceMarginRequirement) {
      liquidationPrice += 0.01; // Increase the price by a small amount
      pnl = calculatePnL(liquidationPrice, entryPrice, parseFloat(positionSize));
      totalCollateral = collateralRequirements.initialCollateral - pnl; // Adjust total collateral with PnL for short position
      maintenanceMarginRequirement = calculateMaintenanceMarginRequirement(liquidationPrice, parseFloat(positionSize), collateralRequirements.maintenanceMargin);
    }
  
    return {liqPrice: liquidationPrice, stopLossPrice: calculateStopLossPrice(liquidationPrice)}
}
  
export function calculateCoverage(minPortfolioValue: string, estimatedWorth: number): string {
    const minValue = parseFloat(minPortfolioValue.slice(1)); // Remove '$' and parse to float
    if (isNaN(minValue) || minValue > estimatedWorth) {
      return "0";
    }
    const coverage = (minValue / estimatedWorth) * 100;
    return `${coverage.toFixed()}`;
}