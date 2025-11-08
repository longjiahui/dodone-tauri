export function groupBy<
  T extends Partial<Record<any, any>> & {
    [k in Field]: T[Field]
  },
  Field extends keyof T,
>(
  data: T[] | undefined,
  field: Field,
): Partial<Record<NonNullable<T[Field]>, T[]>>
export function groupBy<
  T extends Partial<Record<any, any>> & {
    [k in Field]: T[Field]
  },
  Field extends keyof T,
  Mapper extends (d: T) => any,
>(
  data: T[] | undefined,
  field: Field,
  mapper: Mapper,
): Partial<Record<NonNullable<T[Field]>, ReturnType<Mapper>[]>>
export function groupBy<
  T extends Partial<Record<any, any>> & {
    [k in Field]: T[Field]
  },
  Field extends keyof T,
  Mapper extends (d: T) => any,
>(data: T[] | undefined, field: Field, mapper?: Mapper): any {
  return (data || []).reduce((t: any, item: any) => {
    t[item[field]] = t[item[field]] ?? []
    t[item[field]]?.push(mapper ? mapper(item) : item)
    return t
  }, {} as any)
}
