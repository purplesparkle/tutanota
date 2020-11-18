// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const GiftCardOptionTypeRef: TypeRef<GiftCardOption> = new TypeRef("sys", "GiftCardOption")
export const _TypeModel: TypeModel = {
	"name": "GiftCardOption",
	"since": 65,
	"type": "AGGREGATED_TYPE",
	"id": 1786,
	"rootId": "A3N5cwAG-g",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1787,
			"since": 65,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"value": {
			"name": "value",
			"id": 1788,
			"since": 65,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "65"
}

export function createGiftCardOption(values?: $Shape<$Exact<GiftCardOption>>): GiftCardOption {
	return Object.assign(create(_TypeModel, GiftCardOptionTypeRef), values)
}

export type GiftCardOption = {
	_type: TypeRef<GiftCardOption>;

	_id: Id;
	value: NumberString;
}