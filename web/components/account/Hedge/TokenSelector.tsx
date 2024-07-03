import { SupportedTokens } from "../../drift/utils/perp-utils";
import { PerpMarketConfig } from "../../drift/types";

export const TokenSelector = ({ selectedToken, onTokenChange }: { selectedToken: PerpMarketConfig, onTokenChange: (e: {target: {value: any;};}) => void }) => {
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