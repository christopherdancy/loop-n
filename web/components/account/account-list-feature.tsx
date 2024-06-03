'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '../solana/solana-provider';
import { AppHero, ellipsify } from '../ui/ui-layout';

import {
  AccountBalance,
  HedgeSimulation,
  AccountTokens,
  AccountHedgeSimulation,
  // AccountTransactions,
} from './account-ui';
import { ExplorerLink } from '../cluster/cluster-ui';

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
        title={<AccountHedgeSimulation address={publicKey}/>}
        // subtitle={
        //   <div className="mt-2 mb-4">
        //     <ExplorerLink
        //       path={`account/${publicKey}`}
        //       label={ellipsify(publicKey.toString())}
        //     />
        //   </div>
        // }
      >
          {/* <AccountHedgeSimulation address={publicKey}/> */}
          {/* <AccountTokens address={publicKey} /> */}
          {/* <AccountBalance address={publicKey} /> */}
          {/* <HedgeSimulation address={publicKey}/> */}
          {/* <AccountButtons address={publicKey} /> */}
      </AppHero>
    </div>
  );
}
