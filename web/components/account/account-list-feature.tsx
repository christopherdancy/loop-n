'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '../solana/solana-provider';
import { AppHero } from '../ui/ui-layout';

import { redirect } from 'next/navigation';

export default function AccountListFeature() {
  const { publicKey } = useWallet();

  if (publicKey) {
    return redirect(`/account/${publicKey.toString()}`);
  }

  return (
    <div >
      <AppHero title="gm" subtitle="loop(n) here" />
      <WalletButton />
    </div>
  );
}
