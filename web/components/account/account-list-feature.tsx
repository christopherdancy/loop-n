'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '../solana/solana-provider';
import { AppHero } from '../ui/ui-layout';

import {
  AccountHedgeSimulation,
  Uniswap
} from './account-ui';

export default function AccountListFeature() {
  const { publicKey } = useWallet();
  
  if (!publicKey) {
    return (
      <div >
      <AppHero title="gm" subtitle="loop(n) here" />
      <WalletButton />
    </div>
  );
}

  return (
    <div>
      <AppHero
        title={<Uniswap address={publicKey}/>}
      >
      </AppHero>
    </div>
  );
}
