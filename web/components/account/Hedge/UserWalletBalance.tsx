import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useState, useMemo, useEffect } from "react";
import { useDriftProgramAccount } from "../../drift/drift-access";
import { formatTokenAmount } from "../../drift/utils/math-utils";
import { PerpMarketConfig, UserAccount } from "../../drift/types";
import { useGetTokenAccounts, useGetBalance } from "../account-data-access";

export function UserWalletBalance({ address, selectedToken, setTokenAmount, setSolBalance, setUserData }: { address: PublicKey, selectedToken: PerpMarketConfig, setTokenAmount: (walletBalance: string) => void, setSolBalance: (solBalance: number) => void, setUserData: (account: UserAccount) => void} ) {
    const { userAccount } = useDriftProgramAccount(address);
    const [walletBalance, setWalletBalance] = useState('')
    const tokenQuery = useGetTokenAccounts({ address });
    const solQuery = useGetBalance({ address });
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
                      decimals: 9
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
      if (solQuery.data) {
        setSolBalance(solQuery.data);
      }
    }, [solQuery.data, setSolBalance]);
  
    useEffect(() => {  
      if(tokenItems) {
        const token = tokenItems.find((token) => token.tokenInfo.symbol === selectedToken.baseAssetSymbol )
        if (token) {
          setWalletBalance((formatTokenAmount(
            new BN(token.account.data.parsed.info.tokenAmount.amount), 
            token.account.data.parsed.info.tokenAmount.decimals)))
        }
        else{
          setWalletBalance("0.00")
        }
      }
        
    }, [selectedToken, tokenItems]);
  
    useEffect(() => {
      if (userAccount) {
        setUserData(userAccount);
      }
    }, [userAccount]);
  
    return (
      <div className='text-sm'>
        <span>{walletBalance} </span>
        <button className='text-blue-500 disabled:text-slate-500' disabled={walletBalance==="0.00"} onClick={()=>setTokenAmount(walletBalance)}>MAX</button>
      </div>
    );
  }