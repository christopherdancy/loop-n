import { BN } from "@coral-xyz/anchor";
import { OptionalOrderParams, OrderType, OrderParams, DefaultOrderParams, UserAccount, Order, OrderTriggerCondition, OrderStatus, PositionDirection, PerpPosition } from "../types";
import { AMM_TO_QUOTE_PRECISION_RATIO, PRICE_PRECISION, ZERO } from "./constants";

export function getLimitOrderParams(
	params: Omit<OptionalOrderParams, 'orderType'> & { price: BN }
): OptionalOrderParams {
	return Object.assign({}, params, {
		orderType: OrderType.LIMIT,
	});
}

export function getTriggerLimitOrderParams(
	params: Omit<OptionalOrderParams, 'orderType'> & {
		triggerCondition: OrderTriggerCondition;
		triggerPrice: BN;
		price: BN;
	}
): OptionalOrderParams {
	return Object.assign({}, params, {
		orderType: OrderType.TRIGGER_LIMIT,
	});
}

export function getMarketOrderParams(
	params: Omit<OptionalOrderParams, 'orderType'>
	): OptionalOrderParams {
	return Object.assign({}, params, {
		orderType: OrderType.ORACLE,
	});
}

export function getOrderParams(
	optionalOrderParams: OptionalOrderParams,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	overridingParams: Record<string, any> = {}
	): OrderParams {
	return Object.assign(
		{},
		DefaultOrderParams,
		optionalOrderParams,
		overridingParams
	);
}

export type PairedOrders = {
    openOrder: Order;
    closeOrder: Order;
};

export type ProtectedPosition = {
	marketIndex: number,
	baseAssetAmount: BN,
	price: BN,
	openId: number,
	closeId: number,
	status: string,
	subAccountId: number
}

// todo: manage paired orders + statuses via database / smart contract
export function getProtectedPositions(userSubAccounts?: UserAccount[]): ProtectedPosition[] {
    if (!userSubAccounts) return [];
	
	let protectedPositions: ProtectedPosition[] = [];
    for (let i = 0; i < userSubAccounts.length; i++) {
        const openOrders = userSubAccounts[i].orders.filter((order) => {
			return isEqual(order.status, OrderStatus.OPEN); // Ensure return statement
		});
        const openPositions = userSubAccounts[i].perpPositions.filter((position) => {
			return position.baseAssetAmount instanceof BN && position.baseAssetAmount.lt(new BN(0))
		});

        // Extracting into its own function
        protectedPositions = protectedPositions.concat(getProtectedOrders(openOrders, i));
        protectedPositions = protectedPositions.concat(getProtectedPositionsFromPositions(openOrders, openPositions, i));
    }

    return protectedPositions;
}

function getProtectedOrders(openOrders: Order[], subAccountId: number): ProtectedPosition[] {
    let protectedPositions: ProtectedPosition[] = [];

    openOrders.forEach((order) => {
		if (isEqual(order.direction, PositionDirection.SHORT)) {
			const closeOrder = openOrders.find((o) => 
				isEqual(o.direction, PositionDirection.LONG) &&
				o.baseAssetAmount.eq(order.baseAssetAmount) &&
				o.marketIndex === order.marketIndex 
				// o.reduceOnly === true
			)
			if(closeOrder) {
				protectedPositions.push({
					marketIndex: order.marketIndex,
					baseAssetAmount: order.baseAssetAmount,
					price: order.price,
					openId: order.orderId,
					closeId: closeOrder.orderId,
					status: 'pending',
					subAccountId
				})
			}
		}
	})

    return protectedPositions;
}

function getProtectedPositionsFromPositions(openOrders: Order[], openPositions: PerpPosition[], subAccountId: number): ProtectedPosition[] {
    let protectedPositions: ProtectedPosition[] = [];

    openPositions.forEach((position) => {
		const closeOrder = openOrders.find((o) => 
			isEqual(o.direction, PositionDirection.LONG) &&
			o.baseAssetAmount.eq(position.baseAssetAmount.neg()) &&
			o.marketIndex === position.marketIndex
			// o.reduceOnly === true
		)
		if(closeOrder) {
			protectedPositions.push({
				marketIndex: position.marketIndex,
				baseAssetAmount: position.baseAssetAmount.neg(),
				price: calculateEntryPrice(position),
				openId: 0, // position closed via opposite trade
				closeId: closeOrder.orderId,
				status: 'active',
				subAccountId
			})
		}
})

    return protectedPositions;
}

function isEqual(obj1: any, obj2: any): boolean {
	if (obj1 === obj2) return true;
  
	if (typeof obj1 !== 'object' || obj1 === null ||
		typeof obj2 !== 'object' || obj2 === null) {
	  return false;
	}
  
	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);
  
	if (keys1.length !== keys2.length) return false;
  
	for (const key of keys1) {
	  if (!keys2.includes(key) || !isEqual(obj1[key], obj2[key])) {
		return false;
	  }
	}
  
	return true;
  }

  /**
 *
 * @param userPosition
 * @returns Precision: PRICE_PRECISION (10^6)
 */
function calculateEntryPrice(userPosition: PerpPosition): BN {
	if (userPosition.baseAssetAmount.eq(ZERO)) {
		return ZERO;
	}

	return userPosition.quoteEntryAmount
		.mul(PRICE_PRECISION)
		.mul(AMM_TO_QUOTE_PRECISION_RATIO)
		.div(userPosition.baseAssetAmount)
		.abs();
}

  // Function to create dummy pos
export function createProtectedPosition(
	marketIndex: number, 
	baseAssetAmount: BN, 
	price: number,
	status: string,
	id: number
): ProtectedPosition {
	return {
		marketIndex: marketIndex,
		baseAssetAmount: baseAssetAmount,
		price: new BN(price).mul(PRICE_PRECISION),
		openId: id,
		closeId: id + 1,
		status: status,
		subAccountId: id
	}
}