/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { IconRefresh } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { AppModal } from '../ui/ui-layout';
import {
  useGetBalance,
  useGetPythPrices,
  useGetTokenAccounts,
} from './account-data-access';
import { useDriftProgramAccount } from '../drift/drift-data-access';
import { 
  BASE_PRECISION,
  SupportedTokens, 
  calculateBaseAssetValueWithOracle, 
  calculateEntryPrice, 
  calculateTakerFee, 
  decodeName, 
  formatPercentageChange, 
  formatTokenAmount, 
  getActivePerpPositionsForUserAccount, 
  getMarketConfigByIndex, 
  getOpenOrdersForUserAccount, 
  getPositionEstimatedExitPriceAndPnl 
} from '../drift/drift-exports';
import { BN } from '@coral-xyz/anchor';
import { Line } from 'react-chartjs-2';
import * as anchor from '@coral-xyz/anchor';
import { UserAccount, PerpMarketAccount, PerpPosition, Order, PositionDirection, OrderTriggerCondition, OrderStatus, OrderType, MarketType, PerpMarketConfig, FeeTier } from '../drift/types';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { calculateCollateralRequirements, calculateLimitOrderPrice, calculateLiquidationPriceShort, calculateCoverage } from '../drift/math-hedge';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ZERO = new BN(0);
const demoFlow = true;

function createDemoOrder(prevOrders:Order[], marketIndex: number, baseAssetAmount: BN): Order[] {
  const lastOrderId = prevOrders.length > 0 ? prevOrders[prevOrders.length - 1].orderId : 0;
  const newOrderId = lastOrderId + 1;

  const demoOrder: Order = {
    status: OrderStatus.OPEN,
    orderType: OrderType.MARKET,
    marketType: MarketType.PERP,
    slot: new BN(Date.now()),
    orderId: newOrderId,
    userOrderId: newOrderId, // Assuming userOrderId follows the same increment pattern
    marketIndex: marketIndex, // Example market index
    price: new BN(Math.floor(Math.random() * 1000000)), // Example price in smallest units
    baseAssetAmount: baseAssetAmount, // Example amount in smallest units
    quoteAssetAmount: new BN(Math.floor(Math.random() * 1000000)), // Example amount in smallest units
    baseAssetAmountFilled: new BN(0),
    quoteAssetAmountFilled: new BN(0),
    direction: PositionDirection.SHORT, // Example direction
    reduceOnly: false,
    triggerPrice: new BN(0),
    triggerCondition: OrderTriggerCondition.ABOVE,
    existingPositionDirection: PositionDirection.SHORT,
    postOnly: false,
    immediateOrCancel: false,
    oraclePriceOffset: 0,
    auctionDuration: 0,
    auctionStartPrice: new BN(0),
    auctionEndPrice: new BN(0),
    maxTs: new BN(Date.now() + 5000), // Example expiration time 1 hour from now
  };

  prevOrders.push(demoOrder);
  return prevOrders
}

function handleDemoCancel(prevOrders: Order[], orderId: number): Order[] {
  return prevOrders.filter(order => order.orderId !== orderId);
}

function handleDemoClose(prevPositions: PerpPosition[], baseAssetAmount: BN): PerpPosition[] {
  return prevPositions.filter(pos => pos.baseAssetAmount !== baseAssetAmount);
}
const TokenSelector = ({ selectedToken, onTokenChange }: { selectedToken: PerpMarketConfig, onTokenChange: (e: {target: {value: any;};}) => void }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center p-2 rounded-3xl bg-white border border-gray-200">
        <img src={selectedToken.logoURI} alt={selectedToken.fullName} className="w-6 h-6" />
      <select
        className="font-sans text-l w-full h-full focus:outline-none focus:ring-0"
        value={selectedToken.baseAssetSymbol}
        onChange={onTokenChange}
        >
        {SupportedTokens.map((token) => (
          <option key={token.fullName} value={token.baseAssetSymbol}>
            {token.baseAssetSymbol}
          </option>
        ))}
      </select>
      </div>
    </div>
  );
};

export function PortfolioHedge({ address }: { address: PublicKey }) {
  const [selectedToken, setSelectedToken] = useState(SupportedTokens[0]);
  const [walletBalance, setWalletBalance] = useState('')
  const [tokenAmount, setTokenAmount] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [minPortfolioValue, setMinPortfolioValue] = useState('');
  const [market, setMarket] = useState<PerpMarketAccount>();
  const [userFees, setUserFees] = useState<{initUserFee: string, rentFee: number, rentExemptBalance: number,  tradeFees: FeeTier}>();
  const tokenQuery = useGetTokenAccounts({ address });
  const solQuery = useGetBalance({ address });
  // const prices = useGetPythPrices();
  const { perpMarkets, fees, userAccount } = useDriftProgramAccount(address);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const tokenItems = useMemo(() => {
    const items = tokenQuery.data ? [...tokenQuery.data] : [];
      if (solQuery.data) {
        items.unshift({
          account: {
            data: {
              parsed: {
                info: {
                  mint: 'SOL',
                  tokenAmount: {
                    amount: solQuery.data,
                  },
                },
              },
              program: '',
              space: 0
            },
            executable: false,
            owner: address,
            lamports: 0
          },
          pubkey: address,
          tokenInfo: {
            name: 'Solana',
            symbol: 'SOL',
            logoURI: 'path-to-sol-logo',
          },
        });
      }
      return  items;
    }, [tokenQuery.data, solQuery.data, address]);
  
  useEffect(() => {  
    if(tokenItems) {
      const token = tokenItems.find((token) => token.tokenInfo.symbol === selectedToken.baseAssetSymbol )
      if (token) {
        setWalletBalance((formatTokenAmount(new BN(token.account.data.parsed.info.tokenAmount.amount), 9)))
      }
      else{
        setWalletBalance("0.00")
      }
    }
      
  }, [selectedToken, tokenItems]);
  
  const handleTokenChange = (e: { target: { value: any; }; }) => {
    const token = SupportedTokens.find((supportedToken) => e.target.value === supportedToken.baseAssetSymbol)
    if (token) {
      setSelectedToken(token) 
      setTokenAmount('')
      setMinPortfolioValue('')
    };
  };

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
    const price= 11.20
    return parseFloat(tokenAmount) * price;
  }, [tokenAmount, selectedToken]);
  // }, [prices.data, tokenAmount, selectedToken]);


  // Adjust minPortfolioValue if it exceeds estimatedWorth
  useEffect(() => {
    const minValue = parseFloat(minPortfolioValue.slice(1));
    if (minValue > estimatedWorth) {
      setMinPortfolioValue('');
    }
  }, [estimatedWorth, minPortfolioValue]);

  useEffect(() => {
    if (perpMarkets) {
      const market = perpMarkets.find((market) => market.marketIndex === selectedToken.marketIndex);
      if (market) {
        setMarket(market)
      }
    }

    if (fees) {
      setUserFees(fees)
    }
  }, [selectedToken, perpMarkets, fees]);

  // proper logic for account fees without market or inputs + reorg
  // account fees for account creation is .02 but I am unsure where this is coming from
  // update collateral information usdc + solona fee
  // indicate what fee (denom) it is in
  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-md">
      <div className='text-left py-4 text-xl text-bold font-mono'>
      <span>Portfolio Coverage</span>
      </div>
      <div className="bg-gray-50 rounded-2xl p-4 mb-4 font-mono">
        <div className="flex justify-between items-left mb-2 pl-1">
          <span>HODL Position</span>
          <div className='text-sm'>
          <span>{walletBalance} </span>
          <button className='text-blue-500 disabled:text-slate-500' disabled={walletBalance==="0.00"} onClick={()=>setTokenAmount(walletBalance)}>MAX</button>
          </div>
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
          <span>{calculateCoverage(minPortfolioValue, estimatedWorth)}<text className='text-sm text-gray-500'>% of current value</text></span>
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl font-mono">
      <div className="flex justify-between items-center mb-2 pl-1">
        <span>Coverage Fees</span>
        <span>$350.29</span>
      </div>
      <div className="flex justify-between items-center text-gray-400 pl-1">
        <button onClick={toggleExpanded} className="text-blue-500 text-sm text-center focus:outline-none">
          {isExpanded ? 'Hide Details' : 'Details'}
        </button>
      </div>
      {isExpanded && (
        <div className="text-xs text-gray-500 mt-4 pl-1">
          <div className="flex justify-between items-center mb-2 underline font-bold decoration-blue-500">
            <span>HODL Info</span>
          </div>
          <div className="flex justify-between items-center mb-2 pl-1">
            <span>Protected asset</span>
            <span>{selectedToken.baseAssetSymbol}</span>
          </div>
          <div className="flex justify-between items-center mb-2 pl-1">
            <span>HODL Value</span>
            <span>{`$${estimatedWorth.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between items-center mb-2 pl-1">
            <span>Protected Value</span>
          <span>{!minPortfolioValue ? '$0' : minPortfolioValue}</span>
          </div>
          { market &&
          <div>
          <div className="flex justify-between items-center my-2 underline font-bold decoration-blue-500">
            <span>Trade Info</span>
          </div>
          <div className="flex justify-between items-center mb-2 pl-1">
            <span>Leverage</span>
            <span>{`${calculateCollateralRequirements(market, minPortfolioValue).leverage}X`}</span>
          </div>
          <div className="flex justify-between items-center mb-2 pl-1">
            <span>Coverage price</span>
            <span>{`$${calculateLimitOrderPrice(minPortfolioValue, tokenAmount).toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between items-center mb-2 pl-1">
            <span>Stop Loss Price</span>
            <span>{`$${calculateLiquidationPriceShort(tokenAmount, calculateLimitOrderPrice(minPortfolioValue, tokenAmount), calculateCollateralRequirements(market, minPortfolioValue)).stopLossPrice.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between items-center mb-2 pl-1">
            <span>Liquidation Price</span>
            <span>{`$${calculateLiquidationPriceShort(tokenAmount, calculateLimitOrderPrice(minPortfolioValue, tokenAmount), calculateCollateralRequirements(market, minPortfolioValue)).liqPrice.toFixed(2)}`}</span>
          </div>
          </div>
          }
          <div className="flex justify-between items-center my-2 underline font-bold decoration-blue-500">
            <span>Fee Info</span>
          </div>
          <div className="flex justify-between items-center mb-2 pl-1">
            <span>Collateral</span>
            <span>{`$${calculateCollateralRequirements(market, minPortfolioValue).initialCollateral.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between items-center mb-2 pl-1">
            <span>Tx fee</span>
            <span>{calculateTakerFee(calculateLimitOrderPrice(minPortfolioValue, tokenAmount), new anchor.BN(tokenAmount).mul(BASE_PRECISION), fees?.tradeFees)}</span>
          </div>
          { userAccount &&
          <div className="flex justify-between items-center mb-2 pl-1">
            <span>Init Account Fee</span>
            <span>{userFees.initUserFee}</span>
          </div>
          }
          { solQuery.data < userFees.rentExemptBalance &&
          <div className="flex justify-between items-center mb-2 pl-1">
            <span>Solana Rent Fee</span>
            <span>{(formatTokenAmount(new BN(userFees?.rentFee), 9, 2))}</span>
          </div>
          }
        </div>
      )}
    </div>
    </div>
  );
};

export function AccountHedgeSimulation({ address }: { address: PublicKey }) {
  const { perpMarkets, fees, userAccount, loopnHedgeMutation, closeHedgeMutation, cancelOrderMutation } = useDriftProgramAccount(address);
  const tokenQuery = useGetTokenAccounts({ address });
  const solQuery = useGetBalance({ address });
  const [showHedgeModal, setShowHedgeModal] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(50);
  const [hedgeRatio, setHedgeRatio] = useState(50);
  const [simulationData, setSimulationData] = useState<{priceChange: number, unhedgedValue: number, hedgedValue: number}[]>();
  const [tokenPrice, setTokenPrice] = useState(new anchor.BN(0));
  const [selectedToken, setSelectedToken] = useState(PerpMarketConfigs[2]);
  const [demoOrders, setDemoOrders] = useState<Order[]>([])
  const [demoPositions, setDemoPositions] = useState<PerpPosition[]>([])
  const tokenItems = useMemo(() => {
  const items = tokenQuery.data ? [...tokenQuery.data] : [];
    if (solQuery.data) {
      items.unshift({
        account: {
          data: {
            parsed: {
              info: {
                mint: 'SOL',
                tokenAmount: {
                  amount: solQuery.data,
                },
              },
            },
            program: '',
            space: 0
          },
          executable: false,
          owner: new PublicKey("BwBL7eWa9XABw4QzwAnDxeVPcgHWhtbbaNUYLmiThV22"),
          lamports: 0
        },
        pubkey: address,
        tokenInfo: {
          name: 'Solana',
          symbol: 'SOL',
          logoURI: 'path-to-sol-logo',
        },
      });
    }
    return  items;
  }, [tokenQuery.data, solQuery.data, address]);

  useEffect(() => {
    if (perpMarkets) {
      const market = perpMarkets.find((market) => market.marketIndex === selectedToken.marketIndex);
      if (market) {
        setTokenPrice(Number(formatTokenAmount(new BN(market.amm.lastOracleNormalisedPrice), 6)))
      }
    }

    if(tokenItems) {
      const token = tokenItems.find((token) => token.tokenInfo.symbol === selectedToken.baseAssetSymbol )
      if (token) {
        setTokenAmount(Number(formatTokenAmount(new BN(token.account.data.parsed.info.tokenAmount.amount), 9)))
      }
    }
      
  }, [selectedToken, perpMarkets, tokenItems]);

  useEffect(() => {
    runSimulation();
  }, [tokenPrice, tokenAmount, hedgeRatio]);

    // Convert expired orders to positions
  useEffect(() => {
    if (demoFlow) {
      const interval = setInterval(() => {
        const now = Date.now();
        const expiredOrders = demoOrders.filter((order) => order.maxTs.toNumber() <= now);
        if (expiredOrders.length > 0) {
          const newPositions = expiredOrders.map((order) => ({
            baseAssetAmount: order.baseAssetAmount,
            lastCumulativeFundingRate: new BN(0),
            marketIndex: order.marketIndex,
            quoteAssetAmount: order.quoteAssetAmount,
            quoteEntryAmount: order.quoteAssetAmount,
            quoteBreakEvenAmount: order.quoteAssetAmount,
            openOrders: 0,
            openBids: new BN(0),
            openAsks: new BN(0),
            settledPnl: new BN(0),
            lpShares: new BN(0),
            remainderBaseAssetAmount: 0,
            lastBaseAssetAmountPerLp: new BN(0),
            lastQuoteAssetAmountPerLp: new BN(0),
            perLpBase: 0,
          }));
          setDemoPositions((prev) => [...prev, ...newPositions]);
          setDemoOrders((prev) => prev.filter((order) => order.maxTs.toNumber() > now));
        }
      }, 1000); // Check every second
      return () => clearInterval(interval);
    } 
  }, [demoOrders]);

  const handleTokenChange = (e: { target: { value: string; }; }) => {
    const token = PerpMarketConfigs.find(token => token.symbol === e.target.value);
    if (token) 
      setSelectedToken(token);
  };

  const handleBaseAssetAmountChange = (e: { target: { value: any; }; }) => {
    setTokenAmount(Number(e.target.value));
  };

  const runSimulation = () => {
    const scenarios = [-0.2, -0.1, 0, 0.1, 0.2];
    const data = scenarios.map(scenario => {
      const newPrice = tokenPrice * (1 + scenario);
      const unhedgedValue = tokenAmount * newPrice;
      const hedgedAmount = (tokenAmount * hedgeRatio) / 100;
      const hedgedValue = (hedgedAmount * tokenPrice) + ((tokenAmount - hedgedAmount) * newPrice); // hedge at initial price
      return {
        priceChange: scenario * 100,
        unhedgedValue,
        hedgedValue
      };
    });
    setSimulationData(data);
  };

  const chartData = useMemo(() => {
    if (!simulationData) return null;
    return {
      labels: simulationData.map((d: { priceChange: any; }) => `${d.priceChange}%`),
      datasets: [
        {
          label: 'Unhedged Portfolio',
          data: simulationData.map((d: { unhedgedValue: any; }) => d.unhedgedValue),
          borderColor: 'rgba(255,99,132,1)',
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'Hedged Portfolio',
          data: simulationData.map((d: { hedgedValue: any; }) => d.hedgedValue),
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 2,
          fill: false,
        },
      ],
    };
  }, [simulationData]);

  const chartOptions = {
    scales: {
      x: { title: { display: true, text: 'Price Change (%)' } },
      y: { title: { display: true, text: 'Portfolio Value (USD)' } },
    },
  };
  
  // todo: allow for decimal values
  // todo: how to visualize portfolio.val vs est.entryPrice
  return (
    <div className="space-y-4">
      {showHedgeModal && 
      <ModalHedge
        hide={() => setShowHedgeModal(false)}
        symbol={selectedToken.baseAssetSymbol}
        hedgeSize={(tokenAmount * hedgeRatio) / 100}
        tokenPrice={tokenPrice}
        tradeFee={calculateTakerFee(tokenPrice, ((tokenAmount * hedgeRatio) / 100), fees )}
        show={showHedgeModal}
        submit={
          demoFlow ?
          () => setDemoOrders(createDemoOrder(demoOrders, selectedToken.marketIndex, new anchor.BN(tokenAmount).mul(BASE_PRECISION).mul(new anchor.BN(hedgeRatio)).div(new anchor.BN(100)))) 
          :
          () => loopnHedgeMutation.mutate(
              { 
                usdcDeposit: tokenPrice * ((tokenAmount * hedgeRatio) / 100),
                baseAssetAmount: new anchor.BN(tokenAmount).mul(BASE_PRECISION).mul(new anchor.BN(hedgeRatio)).div(new anchor.BN(100)),
                marketIndex: selectedToken.marketIndex,
                simulate: true
              }
            )
          }
      />}
      <h2 className="text-xl font-bold">Hedge Simulation</h2>
      {/* {(tokenQuery.isError || solQuery.isError) && (
        <pre className="alert alert-error">
          Error: {(tokenQuery.error?.message || solQuery.error?.message).toString()}
        </pre>
      )} */}
      {tokenQuery.isSuccess && solQuery.isSuccess && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row space-x-4">
            <div className="flex flex-row space-x-4 md:w-full">
              <div className="flex flex-col space-y-2 w-1/3">
                <label className='text-left'>Asset</label>
                <select value={selectedToken.symbol} onChange={handleTokenChange} className="input input-bordered w-full">
                  {PerpMarketConfigs.map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col space-y-2 w-1/3 text-left">
                <label className="block font-medium">Token Amount</label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={handleBaseAssetAmountChange}
                  className="input input-bordered w-full"

                />
              </div>
              <div className="flex flex-col space-y-2 w-1/3">
                <label className="block font-medium text-left">Price (USD)</label>
                <input
                  type="number"
                  value={tokenPrice} // Adjust precision if needed
                  className="input input-bordered w-full"
                  readOnly
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-2 md:w-full">
            <div className="flex flex-col space-y-2">
              <label className="block font-medium">Hedge Ratio (%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={hedgeRatio}
                onChange={(e) => setHedgeRatio(Number(e.target.value))}
                className="range"
              />
              <span>{hedgeRatio}%</span>
            </div>
          </div>
          <div className="w-full">
            {chartData && (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
           <button className="btn btn-primary w-full text-white" 
              onClick={() => setShowHedgeModal(true)}
            >
                Simulate Hedge
            </button>
        </div>
      )}
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
      <div className="w-full">
        {/* {userAccount && <AccountMetrics userAccount={userAccount} refetchUserAccount={refetchUserAccount} />} */}
        {(userAccount || demoFlow) && perpMarkets && <AccountPositions userAccount={userAccount} perpMarkets={perpMarkets} demoOrders={demoOrders} demoPositions={demoPositions} setDemoOrders={setDemoOrders} setDemoPositions={setDemoPositions} handleCancel={(orderId: any) => cancelOrderMutation.mutate({orderId, simulate:true})}  handleCloseHedge={(pos) => closeHedgeMutation.mutate({ pos, simulate:true })} />}
      </div>
    </div>
    </div>
  );
}
// todo: must mock user account

// todo: add price slippage and liquidation Price
// todo: create account fee
function ModalHedge({
  hide,
  show,
  symbol,
  hedgeSize,
  tokenPrice,
  tradeFee,
  submit
}: {
  hide: () => void;
  show: boolean;
  symbol: string;
  hedgeSize: number;
  tokenPrice: number
  tradeFee?: string | number;
  submit: () => void;
}) {
  return (
    <AppModal
      hide={hide}
      show={show}
      title="Hedge Details"
      submitDisabled={false}
      submitLabel="Open Hedge"
      submit={submit}
    >
      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="font-medium">Asset:</span>
          <span>{symbol}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Hedge Size:</span>
          <span>{hedgeSize}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Est. Entry Price:</span>
          <span>{tokenPrice}</span>
        </div>
        {tradeFee && <div className="flex justify-between">
          <span className="font-medium">Trade Fees:</span>
          <span>{tradeFee}</span>
        </div>}
        <div className="flex justify-between">
          <span className="font-medium">Total Cost (USDC):</span>
          <span>{"$"+(tokenPrice * hedgeSize).toString().slice(0,6)}</span>
        </div>
      </div>
    </AppModal>
  );
}

// todo: funding + liq Price
// todo: close position
export function AccountPositions(
  { userAccount, 
    perpMarkets, 
    handleCancel, 
    handleCloseHedge,
    demoOrders,
    setDemoOrders,
    demoPositions,
    setDemoPositions
  }: { 
    userAccount?: UserAccount, 
    perpMarkets: PerpMarketAccount[], 
    handleCancel: ((orderId: number) => void), 
    handleCloseHedge: (pos: PerpPosition, simulate: boolean) => void, 
    demoOrders: Order[],
    setDemoOrders: Dispatch<SetStateAction<Order[]>>,
    demoPositions: PerpPosition[]
    setDemoPositions: Dispatch<SetStateAction<PerpPosition[]>>,
  }) {
  const pendingOrders: Order[] = demoFlow ? demoOrders : getOpenOrdersForUserAccount(userAccount)
  const positions: PerpPosition[] = demoFlow ? demoPositions : getActivePerpPositionsForUserAccount(userAccount)
  return (
    <div className="space-y-2 mt-8">
      <div className="flex justify-between">
        <h2 className="text-l font-bold">Account Transactions</h2>
        <div className="space-x-2">
          <button className="btn btn-sm btn-outline" onClick={async () => {
            console.log('Button clicked, refetching perp markets...');
            // await refetchPerpMarkets();
            console.log('Refetching completed');
          }}>
            <IconRefresh size={16} />
          </button>
        </div>
      </div>
        <div>
          <div>
            <h3 className="text-l font-bold mt-4">Pending Orders</h3>
            {pendingOrders?.length === 0 ? (
              <div>No pending orders found.</div>
            ) : (
              <table className="table border-4 rounded-lg border-separate border-base-300">
                <thead>
                  <tr>
                    <th>Market</th>
                    <th className="text-right">Size</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Order Id</th>
                    <th className="text-right">Close</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders?.map((order) => {  
                    const baseAssetSymbol = getMarketConfigByIndex(order.marketIndex)?.baseAssetSymbol;
                    const orderSize = formatTokenAmount(order.baseAssetAmount, 9);
                    const market = perpMarkets.find((market) => market.marketIndex === order.marketIndex);
                    if (!market) return;
                    const orderPrice = formatTokenAmount(market?.amm?.lastOracleNormalisedPrice, 6, 2, true);

                    return (
                      <tr key={order.marketIndex}>
                        <td className="font-mono text-right">
                          <span className="font-bold text-lg">{baseAssetSymbol}</span>
                        </td>
                        <td className="font-mono text-right">
                          <span className="font-bold text-lg">{orderSize}</span>
                        </td>
                        <td className="font-mono text-right">
                          <span className="font-bold text-lg">{orderPrice}</span>
                        </td>
                        <td className="font-mono text-right">
                          <span className="font-bold text-lg">{order.orderId}</span>
                        </td>
                        <td className="text-right">
                          <button className="btn btn-sm btn-outline" onClick={demoFlow ? () => setDemoOrders(handleDemoCancel(pendingOrders, order.orderId)) : () => handleCancel(order.orderId)}>Cancel</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div>
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
                    console.log(pos.quoteAssetAmount.toString())
                    console.log(pos.quoteEntryAmount.toString())

                    const baseAssetSymbol = getMarketConfigByIndex(pos.marketIndex)?.baseAssetSymbol;
                    const entryPrice = formatTokenAmount(calculateEntryPrice(pos), 6, 2, true);
                    const lastOraclePrice = formatTokenAmount(market?.amm?.lastOracleNormalisedPrice, 6, 2, true);
                    const baseAssetValue = formatTokenAmount(calculateBaseAssetValueWithOracle(market, pos), 6, 2, true);
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
                            <span className="font-bold text-lg">{formatTokenAmount(pnl, 6, 2, true)}</span>
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
          </div>
        </div>
    </div>
  );
}

export function AccountMetrics({ userAccount, refetchUserAccount }: { userAccount: UserAccount, refetchUserAccount: ()=>void}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
          <h2 className="text-l font-bold">Drift Metrics</h2>
          <div className="space-x-2">
            <button className="btn btn-sm btn-outline" onClick={async () => {
              console.log('Button clicked, refetching user account...');
              // await refetchUserAccount();
              console.log('Refetching completed');
            }}>
              <IconRefresh size={16} />
            </button>
          </div>
        </div>
          <div>
          <div className="border-4 rounded-lg p-4 space-y-4 border-separate border-base-300">
            <div className="flex justify-between items-center">
              <span className="font-mono">Account Name:</span>
              <span className="font-mono text-right">{decodeName(userAccount.name)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono">Deposits:</span>
              <span className="font-mono text-right">{formatTokenAmount(userAccount.totalDeposits.sub(userAccount.totalWithdraws), 6, 2, true)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono">Health:</span>
              <span className="font-mono text-right">100%</span>
            </div>
          </div>
        </div>
    </div>
  );
}
