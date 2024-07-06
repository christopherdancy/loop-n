import { BN } from "@coral-xyz/anchor";
import { OptionalOrderParams, OrderType, OrderParams, DefaultOrderParams, UserAccount, Order, OrderTriggerCondition, OrderStatus, PositionDirection } from "../types";
import { PRICE_PRECISION } from "./constants";

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

// todo: manage paired orders + statuses via database / smart contract
export function getOpenOrdersForUserAccount(userAccount?: UserAccount): PairedOrders[] {
    if (!userAccount) return [];

    const openOrders = userAccount.orders.filter((order) => {
		isEqual(order.status, OrderStatus.OPEN)});


    const pairedOrders: PairedOrders[] = [];
    const matchedOrderIds = new Set<number>();

    openOrders.forEach((order) => {
        if (matchedOrderIds.has(order.orderId)) return; // Skip already matched orders

        if (isEqual(order.direction, PositionDirection.SHORT) && isEqual(order.triggerCondition, OrderTriggerCondition.BELOW)) {
            // Find the corresponding long order
            const closeOrder = openOrders.find((o) => 
                isEqual(o.direction, PositionDirection.LONG) &&
                isEqual(o.triggerCondition, OrderTriggerCondition.ABOVE) &&
                o.baseAssetAmount.eq(order.baseAssetAmount) &&
                o.marketIndex === order.marketIndex &&
                !matchedOrderIds.has(o.orderId)
            );

            if (closeOrder) {
                pairedOrders.push({ openOrder: order, closeOrder });
                matchedOrderIds.add(order.orderId);
                matchedOrderIds.add(closeOrder.orderId);
            }
        }
    });

    return pairedOrders;
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

  // Function to create dumy paired orders
export function createPairedOrders(prevOrders: PairedOrders[], marketIndex: number, baseAssetAmount: BN, price: number): PairedOrders {
	const lastOrderId = prevOrders.length > 0 ? prevOrders[prevOrders.length - 1].openOrder.orderId : 0;
	const newOrderId = lastOrderId + 1;
  
	const shortOrder = createOrder({
	  orderId: newOrderId,
	  userOrderId: newOrderId,
	  marketIndex,
	  price: new BN(price).mul(PRICE_PRECISION),
	  baseAssetAmount,
	  quoteAssetAmount: new BN(Math.floor(Math.random() * 1000000)),
	  direction: PositionDirection.SHORT,
	  triggerPrice: new BN(price + 1).mul(PRICE_PRECISION),
	  triggerCondition: OrderTriggerCondition.BELOW,
	  existingPositionDirection: PositionDirection.SHORT,
	});
  
	const longOrder = createOrder({
	  orderId: newOrderId + 1,
	  userOrderId: newOrderId + 1,
	  marketIndex,
	  price: new BN(price + 2).mul(PRICE_PRECISION), // Example different price for long order
	  baseAssetAmount,
	  quoteAssetAmount: new BN(Math.floor(Math.random() * 1000000)),
	  direction: PositionDirection.LONG,
	  triggerPrice: new BN(price + 3).mul(PRICE_PRECISION),
	  triggerCondition: OrderTriggerCondition.ABOVE,
	  existingPositionDirection: PositionDirection.LONG,
	});

  	return { openOrder: shortOrder, closeOrder: longOrder };
  }
  
function createOrder(customParams: Partial<Order>): Order {
	return {
		...DefaultOrderParams,
		...customParams,
		orderId: customParams.orderId!,
		userOrderId: customParams.userOrderId!,
		marketIndex: customParams.marketIndex!,
		price: customParams.price!,
		baseAssetAmount: customParams.baseAssetAmount!,
		quoteAssetAmount: customParams.quoteAssetAmount!,
		direction: customParams.direction!,
		triggerPrice: customParams.triggerPrice!,
		triggerCondition: customParams.triggerCondition!,
		existingPositionDirection: customParams.existingPositionDirection!,
	} as Order;
}