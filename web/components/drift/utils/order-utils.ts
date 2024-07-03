import { BN } from "@coral-xyz/anchor";
import { OptionalOrderParams, OrderType, OrderParams, DefaultOrderParams, UserAccount, Order, OrderTriggerCondition } from "../types";

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

export function getOpenOrdersForUserAccount(userAccount?: UserAccount): Order[] {
    return userAccount? userAccount.orders.filter((order) =>
        order.status == 'open'
    ) : [];
}