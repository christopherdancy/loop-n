'use client';

import React from 'react';
import { ProtectedPosition, getProtectedPositions } from '../drift/utils/order-utils';
import { getMarketConfigByIndex } from '../drift/utils/perp-utils';
import { formatTokenAmount } from '../drift/utils/math-utils';
import { PRICE_PRECISION } from '../drift/utils/constants';
import { UserAccount } from '../drift/types';


// todo: status needs to be tracked via backend (sol)
// todo: do not allow duplicate positions
// todo: if position is active(demo/live) - close position + cancel order
export function UserPositions(
  {
    isDemo,
    demoOrders,
    handleCancelDemoOrder, 
    subAccountData,
    cancelMutation
  }: { 
    isDemo: boolean,
    demoOrders: ProtectedPosition[],
    handleCancelDemoOrder: ((orderId: number) => void),
    subAccountData: UserAccount[] | undefined,
    cancelMutation: any
  }) {
  const protectedPositions:  ProtectedPosition[] = isDemo ? demoOrders : getProtectedPositions(subAccountData)
  return (
    <div className="space-y-2 mt-8">
      <div className="flex justify-between">
        <h2 className="text-l font-bold">Protected Positions</h2>
      </div>
        <div>
          <div>
            {protectedPositions?.length === 0 ? (
              <div>No protected positions found.</div>
            ) : (
              <table className="table border-2 rounded-xl border-base-300">
                <thead>
                  <tr>
                    <th>Market</th>
                    <th className="">Protected size</th>
                    <th className="">Executes @</th>
                    <th className="">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {protectedPositions?.map((position) => {
                    const baseAssetSymbol = getMarketConfigByIndex(position.marketIndex).baseAssetSymbol;
                    const logo = getMarketConfigByIndex(position.marketIndex).logoURI;
                    const strikePrice = `$${formatTokenAmount(position.price, 6)}`
                    const protectedValued = `$${formatTokenAmount(position.baseAssetAmount.mul(position.price).div(PRICE_PRECISION), 9)}`
                    // todo: when status updates to active -- show stop limit order details

                    return (
                      <tr key={position.subAccountId}>
                        <td className="font-mono">
                        <div className="flex flex-row gap-1 items-center">
                          <img src={logo} alt={baseAssetSymbol} className="w-6 h-6" />
                            <span className="font-bold text-lg">{baseAssetSymbol}</span>
                          </div>
                        </td>
                        <td className="font-mono">
                          <div className="flex flex-col">
                            <span className="font-bold text-lg">{formatTokenAmount(position.baseAssetAmount, 9)}</span>
                            <span className="text-sm text-gray-500">{protectedValued}</span>
                          </div>
                        </td>
                        <td className="font-mono">
                          <div className="flex flex-col">
                            <span className="font-bold text-lg">{strikePrice}</span>
                            <span className="text-sm text-gray-500">{position.status}</span>
                          </div>
                        </td>
                        <td className="font-mono">
                          <button className="font-bold text-blue-500" onClick={
                            demoOrders.length > 0 ?  
                            () => handleCancelDemoOrder(position.openId) :
                            () =>
                              cancelMutation.mutate({
                                openId: position.openId,
                                closeId: position.closeId,
                                subAccountId: position.subAccountId,
                                simulate: true,
                              })
                          }>CLOSE</button>
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