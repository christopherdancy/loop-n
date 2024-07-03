'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { AppHero } from '../ui/ui-layout';

import {
  PortfolioHedge
} from './account-ui';

export default function AccountListFeature() {
  const { publicKey } = useWallet();
  
    return (
      <div>
      <AppHero
        title={<PortfolioHedge address={!publicKey ? undefined : publicKey}/>}
      >
      </AppHero>
    </div>
  );
}
