'use client';

import { PriceServiceConnection, PriceFeed } from '@pythnetwork/price-service-client';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import { SupportedTokens } from '../drift/utils/perp-utils';

type PriceData = {
  conf: string;
  expo: number;
  price: string;
  publishTime: number;
};

type PriceDataRecord = Record<string, PriceData | undefined>;

export function useGetPythPrices() {
  const queryClient = useQueryClient();
  const pythConnection = useMemo(() => new PriceServiceConnection("https://hermes.pyth.network"), []);
  const PYTH_PRICES_QUERY_KEY = 'pyth-prices';
  const priceIds = SupportedTokens.map((token) => token.pythId);
  const [data, setData] = useState<Record<string, { conf: string, expo: number, price: string, publishTime: number } | undefined>>();

  const fetchPrices = async () => {
    const priceFeeds: PriceFeed[] | undefined = await pythConnection.getLatestPriceFeeds(priceIds);
    if (!priceFeeds) return;
    const prices = priceFeeds.reduce<PriceDataRecord>((acc, feed) => {
      acc[feed.id.toString()] = feed.getPriceNoOlderThan(60);
      return acc;
    }, {});
    setData(prices);
    queryClient.setQueryData([PYTH_PRICES_QUERY_KEY], prices);
  };

  useEffect(() => {
    fetchPrices(); // Fetch initial prices

    const intervalId = setInterval(() => {
      fetchPrices();
    }, 115000); // Poll every 30 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [pythConnection, queryClient]);

  return { data };
}
