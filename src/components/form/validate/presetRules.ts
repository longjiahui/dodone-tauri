import { $and, Rule } from "./validate"

export function required(message?: string): Rule {
	return {
		required: true,
		validator(value, _, options) {
			const { extraRequiredRule } = options || {}
			const msg = message || "不能为空"
			let ret = ""
			if (value instanceof Array) {
				ret = value.length > 0 ? "" : msg
			} else {
				if (typeof value === "boolean") {
					ret = ""
				} else if (typeof value === "number") {
					ret = ""
				} else if (typeof value === "object") {
					// null 是 object 类型
					ret = value != null ? "" : msg
				} else {
					ret = value && value.trim() ? "" : msg
				}
			}
			if (ret) {
				return ret
			} else {
				return extraRequiredRule?.(value) === false
					? msg
					: ""
			}
		},
	}
}

/**
 * @description min、max、range 同时可以用于 字符串/数值，根据textType指定
 */
type TextType = "string" | "number"
export function min(
	min: number,
	options: {
		type?: TextType
		message?: string
	} = {},
): Rule {
	let { type } = options || {}
	const { message } = options || {}
	type = type || "string"
	return {
		validator(value) {
			if (value) {
				if (value instanceof Array) {
					return value.length >= min
						? ""
						: message || `不能少于${min}个元素`
				} else if (
					typeof value === "string" ||
					typeof value === "number"
				) {
					if (type === "string") {
						return value.toString().length >= min
							? ""
							: message || `不能低于${min}个字符`
					} else if (type === "number") {
						return +value >= min
							? ""
							: message || `不能小于${min}`
					}
				}
			}
		},
	}
}
export function max(
	max: number,
	options: {
		type?: TextType
		message?: string
	} = {},
): Rule {
	let { type } = options || {}
	const { message } = options || {}
	type = type || "string"
	return {
		// 数值不指定max，如果指定了max 会反映到fyforminput的maxlength上
		max: type === "string" ? max : undefined,
		validator(value) {
			if (value) {
				if (value instanceof Array) {
					return value.length <= max
						? ""
						: message || `不能多于${max}个元素`
				} else if (
					typeof value === "string" ||
					typeof value === "number"
				) {
					if (type === "string") {
						return value.toString().length <= max
							? ""
							: message || `不能多于${max}个字符`
					} else if (type === "number") {
						return +value <= max
							? ""
							: message || `不能大于${max}`
					}
				}
			}
		},
	}
}
export function range(
	_min: number,
	_max: number,
	options: {
		type?: TextType
		message?: string
	} = {},
): Rule {
	return $and(
		min(_min, options),
		max(_max, options),
	)
}
export const address = () => range(1, 50)

export function notChinese(): Rule {
	return {
		validator(value) {
			if (value) {
				return /[\u4e00-\u9fa5]/.test(value)
					? "不能使用中文"
					: ""
			}
		},
	}
}

export function alphabetOrNumber(): Rule {
	return {
		validator(value) {
			if (value) {
				return /^[A-Za-z0-9]+$/.test(value)
					? ""
					: "请使用英文和数字组合"
			}
		},
	}
}
export function numberCharacter(): Rule {
	return {
		validator(value) {
			if (value) {
				return /^[0-9]+$/.test(value) ? "" : "请使用数字"
			}
		},
	}
}

// 数值，包含负数，小数
export function number(): Rule {
	return {
		validator(value) {
			if (value) {
				// 00 reject
				// -0 reject
				// 124124. reject
				// 0.00 reject
				// 0.00001 resolve
				// 0 resolve
				// -12.124 resolve
				// 1214.12124124 resolve
				return /^(0|(-?0\.\d*[1-9])|(-?([1-9]\d*(\.\d+)?)))$/.test(
					value,
				)
					? ""
					: "请输入数值"
			}
		},
	}
}

/**
 *
 * @description 正数 包含小数
 */
export function positiveNumber(): Rule {
	return $and(number(), min(0, { type: "number" }))
}
export function integer(): Rule {
	return $and(
		number(),
		max(9, { type: "string" }),
		{
			validator(value) {
				return !value || !/\./.test(value)
					? ""
					: "请输入整数"
			},
		},
	)
}
export function positiveInteger(): Rule {
	return $and(positiveNumber(), integer())
}
// export const presetRules = {

//     // integer(min = 0, max = 999999999): Rule {
//     //     return {
//     //         validator(_, val) {
//     //             return !(
//     //                 val &&
//     //                 !(/^-?[0-9]+$/.test(val) && +val >= min && +val <= max)
//     //             )
//     //         },
//     //         message: `请输入${min}-${max}的整数`,
//     //     }
//     // },
//     /**
//      * @description 限制整数，非整数报错
//      * @returns
//      */
//     integer(): Rule[] {
//         return {
//             validator(_, val) {
//                 return !(val && !/^-?[1-9]\d*$/.test(val))
//             },
//         }
//     },
//     positiveInteger(): Rule {
//         return {
//             validator(_, val) {
//                 return !(val && !/^[1-9]\d*$/.test(val))
//             },
//             message: '请使用正整数',
//         }
//     },
//     zeroOrPositiveInteger(): Rule {
//         return {
//             validator(_, val) {
//                 return !(val && !/^[0-9]+$/.test(val))
//             },
//             message: '请使用正整数',
//         }
//     },

//     /**
//      * @description 英文字母a-z大小写以外均会报错
//      * @returns
//      */
export function alphabet(): Rule {
	return {
		validator(value) {
			return /^[A-Za-z]+$/.test(value)
				? ""
				: "请使用英文字母"
		},
	}
}
export function chinese(): Rule {
	return {
		validator(value) {
			if (value) {
				return /[\u4e00-\u9fa5]/.test(value)
					? ""
					: "请使用中文"
			} else {
				return ""
			}
		},
	}
}
export function mobile(): Rule {
	return $and(
		{
			validator: (value) => {
				if (value) {
					return /^1\d{10}$/.test(value)
						? ""
						: "请输入正确的手机号"
				}
			},
		},
		range(1, 11),
	)
}
export function email(): Rule {
	return {
		validator(value) {
			if (value) {
				return /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(
					value,
				)
					? ""
					: "请输入正确的邮箱"
			}
		},
	}
}
//     greaterThanOrEqual(n: number, message = `输入值应大于等于${n}`): Rule {
//         return {
//             validator(_, val) {
//                 if (val) {
//                     return +val >= n
//                 } else {
//                     return true
//                 }
//             },
//             message,
//         }
//     },
//     greaterThan(n: number, message = `输入值应大于${n}`): Rule {
//         return {
//             validator(_, val) {
//                 if (val) {
//                     return +val > n
//                 } else {
//                     return true
//                 }
//             },
//             message,
//         }
//     },
//     lessThanOrEqual(n: number, message = `输入值应小与等于${n}`): Rule {
//         return {
//             validator(_, val) {
//                 if (val) {
//                     return +val <= n
//                 } else {
//                     return true
//                 }
//             },
//             message,
//         }
//     },
export function idCard(): Rule {
	return $and(
		{
			validator(value) {
				if (value) {
					const oldIdCard =
						/^([1-6][1-9]|50)\d{4}\d{2}((0[1-9])|10|11|12)(([0-2][1-9])|10|20|30|31)\d{3}$/
					// const newIdCard =
					//     /^([1-6][1-9]|50)\d{4}(18|19|20)\d{2}((0[1-9])|10|11|12)(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
					const checkNewIdCard = (code: string) => {
						// 身份证号前两位代表区域
						const cityCodes = [
							"11",
							"12",
							"13",
							"14",
							"15",
							"21",
							"22",
							"23",
							"31",
							"32",
							"33",
							"34",
							"35",
							"36",
							"37",
							"41",
							"42",
							"43",
							"44",
							"45",
							"46",
							"50",
							"51",
							"52",
							"53",
							"54",
							"61",
							"62",
							"63",
							"64",
							"65",
							"71",
							"81",
							"82",
							"91",
						]
						const idCardReg =
							/^[1-9]\d{5}(19|20)?\d{2}(0[1-9]|1[012])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i // 身份证格式正则表达式
						let isPass = true // 身份证验证是否通过（true通过、false未通过）
						if (!code) {
							isPass = false
						} else if (!code.match(idCardReg)) {
							isPass = false
						} else if (
							!cityCodes.includes(code.substr(0, 2))
						) {
							// 区域数组中不包含需验证的身份证前两位
							isPass = false
						} else if (code.length === 18) {
							// 18位身份证需要验证最后一位校验位
							const codes = code.split("")
							// ∑(ai×Wi)(mod 11)
							// 加权因子
							const factor = [
								7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4,
								2,
							]
							// 校验位
							const parity = [1, 0, "X", 9, 8, 7, 6, 5, 4, 3, 2]
							let sum = 0
							let ai = 0
							let wi = 0
							for (let i = 0; i < 17; i++) {
								ai = parseInt(codes[i])
								wi = factor[i]
								sum += ai * wi // 开始计算并相加
							}
							const last = parity[sum % 11] // 求余
							if (last.toString() !== codes[17].toUpperCase()) {
								isPass = false
							}
						}
						return isPass
					}
					return oldIdCard.test(value) ||
						checkNewIdCard(value)
						? ""
						: "请输入正确的身份证号码"
				}
			},
		},
		range(1, 18),
	)
}
export const defaultNumberMax = () =>
	max(999999999.9, { type: "number" })
/**
 * @description 普通数值校验 1 数值 2 保留一位小数
 */
export function fixed1(): Rule {
	return $and(
		number(),
		defaultNumberMax(),
		max(11, { type: "string" }),
		{
			validator(value) {
				if (value) {
					return /\.\d\d+$/.test(value)
						? "至多一位小数"
						: ""
				}
			},
		},
	)
}
export const area = () =>
	$and(fixed1(), positiveNumber())
export const defaultPercentage = () =>
	$and(fixed1(), range(0, 100, { type: "number" }))
export const defaultNumber = fixed1
export const defaultPositiveNumber = () =>
	$and(positiveNumber(), defaultNumberMax())
export function _fixed2(): Rule {
	return $and(
		number(),
		max(999999999.99, { type: "number" }),
		max(12, { type: "string" }),
		{
			validator(value) {
				return !!value && /\.\d\d\d+$/.test(value)
					? "至多两位小数"
					: ""
			},
		},
	)
}
export const money = () =>
	$and(_fixed2(), positiveNumber())
export const weight = () =>
	$and(_fixed2(), positiveNumber())

//     // 通用正整数，限制999999999，库存等地
//     normalPositiveInteger(): Rule[] {
//         return [
//             presetRules.positiveInteger(),
//             presetRules.greaterThanOrEqual(0, '不小于0'),
//             {
//                 validator(_, val) {
//                     return !(val && !/^-?[0-9]{0,9}$/.test(val))
//                 },
//                 message: '不超过999999999',
//             },
//             presetRules.range(1, 9),
//         ]
//     },
//     // 通用价格正则，限制999999999.9，用于金钱、面积、数值
//     normalDecimals(): Rule[] {
//         return [
//             presetRules.number(),
//             presetRules.greaterThanOrEqual(0, '不小于0'),
//             presetRules.fixed1(),
//             {
//                 validator(_, val) {
//                     return !(val && !/^-?[0-9]{0,9}(\.[0-9])?$/.test(val))
//                 },
//                 message: '不超过999999999.9',
//             },
//             presetRules.range(1, 11),
//         ]
//     },
//     // 通用整数，-999999999~999999999
//     normalInteger(): Rule[] {
//         return [
//             presetRules.number(),
//             {
//                 validator(_, val) {
//                     return !(val && !/^-?[0-9]{0,9}$/.test(val))
//                 },
//                 message: '不超过999999999',
//             },
//             presetRules.range(1, 10),
//         ]
//     },

export function jsonString(): Rule {
	return {
		validator(value) {
			if (value) {
				try {
					JSON.parse(value)
				} catch (err) {
					return "请输入JSON字符串"
				}
			}
		},
	}
}

// 业务字段相关
export function account(): Rule {
	return $and(alphabetOrNumber(), range(1, 20))
}
export function password(): Rule {
	return $and(
		required(),
		alphabetOrNumber(),
		range(8, 14),
	)
}
export function confirmPassword(
	field: string,
	message = "两次密码输入不一致",
): Rule {
	return {
		validator(value, entity) {
			return entity[field] === value ? "" : message
		},
	}
}
//     // 不超过小时,任务时长
export function taskDuration(_max = 8): Rule {
	return $and(
		fixed1(),
		min(0, {
			type: "number",
			message: "任务持续时长需要大于0小时",
		}),
		max(_max, {
			type: "number",
			message: `不超过${_max}小时`,
		}),
		range(1, 3),
	)
}
