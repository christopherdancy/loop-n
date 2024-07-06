'use client';

import React from 'react';
import { UserAccount } from '../drift/types';
import { PairedOrders, getOpenOrdersForUserAccount } from '../drift/utils/order-utils';
import { getMarketConfigByIndex } from '../drift/utils/perp-utils';
import { formatTokenAmount } from '../drift/utils/math-utils';
import { PRICE_PRECISION } from '../drift/utils/constants';

// todo: status needs to be tracked via backend (sol )
// todo: do not allow duplicate positions
export function UserPositions(
  { userData, 
    demoOrders,
    handleCancelDemoOrder, 
  }: { 
    userData: UserAccount | undefined, 
    demoOrders: PairedOrders[],
    handleCancelDemoOrder: ((orderId: number) => void), 
  }) {
  // todo: handle proper sizing  
  // todo: handle status updates for orders
  // todo: handle live order cancels
  const pendingOrders: PairedOrders[] = demoOrders.length > 0 ? demoOrders : getOpenOrdersForUserAccount(userData)
  // const positions: PerpPosition[] = getActivePerpPositionsForUserAccount(userAccount)
  return (
    <div className="space-y-2 mt-8">
      <div className="flex justify-between">
        <h2 className="text-l font-bold">Protected Positions</h2>
      </div>
        <div>
          <div>
            {pendingOrders?.length === 0 ? (
              <div>No protected positions found.</div>
            ) : (
              <table className="table border-4 rounded-lg border-separate border-base-300">
                <thead>
                  <tr>
                    <th>Market</th>
                    <th className="">Value Protected</th>
                    <th className="">Strike Price</th>
                    <th className="">Status</th>
                    <th className="">Close</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders?.map((pair) => {
                    const baseAssetSymbol = getMarketConfigByIndex(pair.openOrder.marketIndex).baseAssetSymbol;
                    const logo = getMarketConfigByIndex(pair.openOrder.marketIndex).logoURI;
                    const strikePrice = `$${formatTokenAmount(pair.openOrder.price, 6)}`
                    const protectedValued = `$${formatTokenAmount(pair.openOrder.baseAssetAmount.mul(pair.openOrder.price).div(PRICE_PRECISION), 9)}`

                    return (
                      <tr key={pair.openOrder.orderId}>
                        <td className="font-mono">
                        <div className="flex flex-row gap-1 items-center">
                          <img src={logo} alt={baseAssetSymbol} className="w-6 h-6" />
                            <span className="font-bold text-lg">{baseAssetSymbol}</span>
                          </div>
                        </td>
                        <td className="font-mono">
                          <span className="font-bold text-lg">{protectedValued}</span>
                        </td>
                        <td className="font-mono">
                          <span className="font-bold text-lg">{strikePrice}</span>
                        </td>
                        <td className="font-mono">
                          <span className="font-bold text-lg">Pending</span>
                        </td>
                        <td className="text-right">
                          <button className="font-bold text-blue-500" onClick={() => handleCancelDemoOrder(pair.openOrder.orderId)}>Cancel</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
    </div>
  );
}



{/* <div>
  <h3 className="text-l font-bold mt-4">Open Positions</h3>
  {positions?.length === 0 || !perpMarkets ? (
    <div>No open positions found.</div>
  ) : (
    <table className="table border-4 rounded-lg border-separate border-base-300">
      <thead>
        <tr>
          <th>Market</th>
          <th className="text-right">Size</th>
          <th>Entry/Oracle</th>
          <th className="text-right">P&L</th>
          <th className="text-right">Close</th>
        </tr>
      </thead>
      <tbody>
        {positions?.map((pos) => {
          const market = perpMarkets.find((market) => market.marketIndex === pos.marketIndex);
          if (!market) return;
          const baseAssetSymbol = getMarketConfigByIndex(pos.marketIndex)?.baseAssetSymbol;
          const entryPrice = formatTokenAmount(calculateEntryPrice(pos), 6, 2);
          const lastOraclePrice = formatTokenAmount(market?.amm?.lastOracleNormalisedPrice, 6, 2);
          const baseAssetValue = formatTokenAmount(calculateBaseAssetValueWithOracle(market, pos), 6, 2);
          const [, pnl, percentageChange] = getPositionEstimatedExitPriceAndPnl(market, pos);

          return (
            <tr key={pos.marketIndex}>
              <td className="font-mono text-right">
                <div className="flex flex-col items-end">
                  <span className="font-bold text-lg">{baseAssetSymbol}</span>
                  <span className="text-sm text-gray-500">{pos.baseAssetAmount.gte(ZERO) ? "LONG" : "SHORT"}</span>
                </div>
              </td>
              <td className="font-mono text-right">
                <div className="flex flex-col items-end">
                  <span className="font-bold text-lg">{formatTokenAmount(pos.baseAssetAmount, 9)}</span>
                  <span className="text-sm text-gray-500">{baseAssetValue}</span>
                </div>
              </td>
              <td className="font-mono text-right">
                <div className="flex flex-col items-end">
                  <span className="font-bold text-lg">{entryPrice}</span>
                  <span className="text-sm text-gray-500">{lastOraclePrice}</span>
                </div>
              </td>
              <td className="font-mono text-right">
                <div className="flex flex-col items-end">
                  <span className="font-bold text-lg">{formatTokenAmount(pnl, 6, 2)}</span>
                  <span className="text-sm text-gray-500">{formatPercentageChange(percentageChange)}</span>
                </div>
              </td>
                <td className="text-right">
                <button className="btn btn-sm btn-outline" onClick={demoFlow ? () => setDemoPositions(handleDemoClose(positions, pos.baseAssetAmount)) : () => handleCloseHedge(pos, true)}>Close</button>
              </td> 
            </tr>
          );
        })}
      </tbody>
    </table>
  )}
</div> */}