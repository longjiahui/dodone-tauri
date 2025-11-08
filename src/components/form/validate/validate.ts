export type ValidateOptions = {
	// 神金规则，判断id为空，除了空还要判断-1 所以加一个额外的校验规则
	// true 为校验成功、false为校验失败
	extraRequiredRule?: (d: any) => boolean
}

export interface Rule<
	Entity = any,
	Value = Entity[keyof Entity],
> {
	validator(
		value: Value,
		entity: Entity,
		options?: ValidateOptions,
		// 返回string表示错误信息
	):
		| PromiseLike<string | undefined>
		| string
		| undefined

	// 维护这2个属性给 fyforminput 和 fyformitem使用
	required?: boolean
	max?: number
}

export type Rules<
	T extends Partial<Record<any, any>> = Partial<
		Record<any, any>
	>,
> = Partial<{
	[k in keyof T]: Rule<T, T[k]>[] | Rule<T, T[k]>
	// [k in keyof T]?: Rule | Rule[]
}>
//  & {
//     [k: string]: Rule[] | Rule
// }

export interface ValidateErrorInfo<
	T extends Partial<Record<any, any>> = Partial<
		Record<any, any>
	>,
	Key extends keyof T = keyof T,
> {
	message: string
	value: T[Key]
	key: Key
}

export async function callValidate(
	rule: Rule,
	value: any,
	entity: any,
	options?: ValidateOptions,
) {
	const ret = rule.validator(value, entity, options)
	if (typeof ret === "string") {
		return Promise.resolve(ret)
	} else if (ret?.then) {
		return ret?.then((d) => d)
	} else {
		return ret
	}
}

export async function validate<
	T extends Partial<Record<any, any>>,
>(
	data: T,
	rule: Rules<T>,
	options?: ValidateOptions,
): Promise<ValidateErrorInfo[]> {
	return Promise.all(
		Object.entries(rule).map(([k, rs]) => {
			if (!(rs instanceof Array)) {
				rs = [rs]
			}
			return Promise.all(
				(rs as Rule[]).map((r) => {
					return callValidate(
						r,
						data[k],
						data,
						options,
					).then((d) =>
						d
							? ({
									key: k,
									value: data[k],
									message: d,
								} satisfies ValidateErrorInfo)
							: undefined,
					)
				}),
			)
		}),
	).then((d) =>
		d
			.flatMap((d) => d)
			.filter((d) => !!d)
			.map((d) => d!)
			// 只输出一个错误
			.slice(0, 1),
	)
}

export function $and(...rules: Rule[]): Rule {
	const maxs = rules
		.filter((r) => !!r.max)
		.map((r) => r.max!)
	return {
		required: rules.some((r) => !!r.required),
		max:
			maxs.length > 0 ? Math.min(...maxs) : undefined,
		validator(value, entity, options) {
			return Promise.all(
				rules.map((r) =>
					r.validator(value, entity, options),
				),
			).then((d) => {
				return d.every((d) => !d)
					? ""
					: d
							.filter((d) => !!d)
							.map((d) => d!)
							// 只输出一个错误
							.slice(0, 1)
							.join(",")
			})
		},
	}
}
//Promise.or = Promise.all([Promise.not(a), Promise.not(b)])
export function $or(...rules: Rule[]): Rule {
	const maxs = rules
		.filter((r) => !!r.max)
		.map((r) => r.max!)
	return {
		required: rules.every((r) => !!r.required),
		max: Math.max(...maxs),
		validator(value, entity, options) {
			return Promise.all(
				rules.map((r) =>
					r.validator(value, entity, options),
				),
			).then((d) =>
				d.some((d) => !d)
					? ""
					: d
							.filter((d) => !!d)
							.map((d) => d!)
							.join(","),
			)
		},
	}
}
