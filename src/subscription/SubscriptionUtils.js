//@flow
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {AccountType, BookingItemFeatureType} from "../api/common/TutanotaConstants"
import {getCurrentCount} from "./PriceUtils"
import {PreconditionFailedError} from "../api/common/error/RestError"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import type {PlanPrices} from "../api/entities/sys/PlanPrices"
import type {Customer} from "../api/entities/sys/Customer"
import type {CustomerInfo} from "../api/entities/sys/CustomerInfo"
import type {Booking} from "../api/entities/sys/Booking"

export type SubscriptionOptions = {
	businessUse: Stream<boolean>,
	paymentInterval: Stream<number>
}

export const SubscriptionType = Object.freeze({
	Free: 'Free',
	Premium: 'Premium',
	Teams: 'Teams',
	Pro: 'Pro'
})
export type SubscriptionTypeEnum = $Values<typeof SubscriptionType>;

export const UpgradeType = {
	Signup: 'Signup', // during signup
	Initial: 'Initial', // when logged in into Free account
	Switch: 'Switch' // switching in paid account
}
export type UpgradeTypeEnum = $Values<typeof UpgradeType>;


export const PaymentIntervalItems: SegmentControlItem<number>[] = [
	{name: lang.get("pricing.yearly_label"), value: 12},
	{name: lang.get("pricing.monthly_label"), value: 1}
]

export const BusinessUseItems: SegmentControlItem<boolean>[] = [
	{name: lang.get("pricing.privateUse_label"), value: false},
	{name: lang.get("pricing.businessUse_label"), value: true}
]

// keep this function here because we also need it on the website
export function formatPrice(value: number, includeCurrency: boolean): string {
	// round to two digits first because small deviations may exist at far away decimal places
	value = Math.round(value * 100) / 100
	if (includeCurrency) {
		return (value % 1 !== 0) ?
			lang.formats.priceWithCurrency.format(value)
			: lang.formats.priceWithCurrencyWithoutFractionDigits.format(value)
	} else {
		return (value % 1 !== 0) ?
			lang.formats.priceWithoutCurrency.format(value)
			: lang.formats.priceWithoutCurrencyWithoutFractionDigits.format(value)
	}
}

export type SubscriptionData = {
	options: SubscriptionOptions,
	premiumPrices: PlanPrices,
	teamsPrices: PlanPrices,
	proPrices: PlanPrices
}

export const UpgradePriceType = Object.freeze({
	PlanReferencePrice: "0",
	PlanActualPrice: "1",
	PlanNextYearsPrice: "2",
	AdditionalUserPrice: "3",
	ContactFormPrice: "4",
})
export type UpgradePriceTypeEnum = $Values<typeof UpgradePriceType>;

export function getUpgradePrice(attrs: SubscriptionData, subscription: SubscriptionTypeEnum, type: UpgradePriceTypeEnum): number {
	let prices = (subscription === SubscriptionType.Premium) ? attrs.premiumPrices :
		((subscription === SubscriptionType.Teams) ? attrs.teamsPrices : attrs.proPrices)
	let monthlyPriceString
	let monthsFactor = (attrs.options.paymentInterval() === 12) ? 10 : 1
	let discount = 0
	if (type === UpgradePriceType.PlanReferencePrice) {
		monthlyPriceString = prices.monthlyReferencePrice
		if (attrs.options.paymentInterval() === 12) {
			monthsFactor = 12
		}
	} else if (type === UpgradePriceType.PlanActualPrice) {
		monthlyPriceString = prices.monthlyPrice
		if (attrs.options.paymentInterval() === 12) {
			discount = Number(prices.firstYearDiscount)
		}
	} else if (type === UpgradePriceType.PlanNextYearsPrice) {
		monthlyPriceString = prices.monthlyPrice
	} else if (type === UpgradePriceType.AdditionalUserPrice) {
		monthlyPriceString = prices.additionalUserPriceMonthly
	} else if (type === UpgradePriceType.ContactFormPrice) {
		monthlyPriceString = prices.contactFormPriceMonthly
	}
	return Number(monthlyPriceString) * monthsFactor - discount
}

export function getFormattetUpgradePrice(attrs: SubscriptionData, subscription: SubscriptionTypeEnum, type: UpgradePriceTypeEnum): string {
	return formatPrice(getUpgradePrice(attrs, subscription, type), true)
}

/**
 * Returns the available storage capacity for the customer in GB
 */
export function getTotalStorageCapacity(customer: Customer, customerInfo: CustomerInfo, lastBooking: ?Booking): number {
	let freeStorageCapacity = getIncludedStorageCapacity(customerInfo)
	if (customer.type === AccountType.PREMIUM) {
		return Math.max(freeStorageCapacity, getCurrentCount(BookingItemFeatureType.Storage, lastBooking))
	} else {
		return freeStorageCapacity
	}
}

export function getIncludedStorageCapacity(customerInfo: CustomerInfo): number {
	return Math.max(Number(customerInfo.includedStorageCapacity), Number(customerInfo.promotionStorageCapacity))
}

export function getTotalAliases(customer: Customer, customerInfo: CustomerInfo, lastBooking: ?Booking): number {
	let freeAliases = getIncludedAliases(customerInfo)
	if (customer.type === AccountType.PREMIUM) {
		return Math.max(freeAliases, getCurrentCount(BookingItemFeatureType.Alias, lastBooking))
	} else {
		return freeAliases
	}
}

export function getNbrOfUsers(lastBooking: ?Booking): number {
	return getCurrentCount(BookingItemFeatureType.Users, lastBooking)
}

export function isWhitelabelActive(lastBooking: ?Booking): boolean {
	return getCurrentCount(BookingItemFeatureType.Branding, lastBooking) !== 0
}

export function isSharingActive(lastBooking: ?Booking): boolean {
	return getCurrentCount(BookingItemFeatureType.Sharing, lastBooking) !== 0
}

export function getIncludedAliases(customerInfo: CustomerInfo): number {
	return Math.max(Number(customerInfo.includedEmailAliases), Number(customerInfo.promotionEmailAliases))
}

export function getSubscriptionType(lastBooking: ?Booking, customer: Customer, customerInfo: CustomerInfo): SubscriptionTypeEnum {
	if (customer.type !== AccountType.PREMIUM) {
		return SubscriptionType.Free
	}
	let aliases = getTotalAliases(customer, customerInfo, lastBooking)
	let storage = getTotalStorageCapacity(customer, customerInfo, lastBooking)
	if (isSharingActive(lastBooking) && isWhitelabelActive(lastBooking) && aliases >= 20 && storage >= 10) {
		return SubscriptionType.Pro
	} else if (isSharingActive(lastBooking) && storage >= 10) {
		return SubscriptionType.Teams
	} else {
		return SubscriptionType.Premium
	}
}

export function getPreconditionFailedPaymentMsg(e: PreconditionFailedError): TranslationKey {
	switch (e.data) {
		case "paypal.change":
			return "payChangeError_msg"
		case "paypal.confirm_again":
			return "payPaypalConfirmAgainError_msg"
		case "paypal.other_source":
			return "payPaypalChangeSourceError_msg"
		case "card.contact_bank":
			return "payCardContactBankError_msg"
		case "card.insufficient_funds":
			return "payCardInsufficientFundsError_msg"
		case "card.expired_card":
			return "payCardExpiredError_msg"
		case "card.change":
			return "payChangeError_msg"
		default:
			return "payContactUsError_msg"
	}
}