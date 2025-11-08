/**
 * @file 树遍历函数
 */
function isIdEmpty(id: string) {
  return !!id
}

type TreeData = Partial<Record<string | number | symbol, any>>

/**
 * @method              树遍历(先序)
 * @param datas         树数据
 * @param childrenKey   子节点的key值
 * @param func          遍历函数，返回非undefined值会提前返回该值
 * @returns
 */
export function traverse<T extends TreeData, R>(
  datas: T[] = [],
  func: (d: T, i: number, ds: T[], ps: T[], layer: number) => R = () =>
    undefined as R,
  childrenKey: keyof T = "children",
  parents?: T[],
  layer = 0,
): R | undefined {
  for (let i = 0; i < datas.length; ++i) {
    const d = datas[i]
    let ret: R | undefined = func(d, i, datas, parents || [], layer)
    if (ret !== undefined) {
      return ret
    } else {
      const ps = (parents || []).concat(d)
      if ((d[childrenKey] as any) instanceof Array) {
        ret = traverse(d[childrenKey] as T[], func, childrenKey, ps, layer + 1)
      } else if (d[childrenKey]) {
        ret = traverse(
          [d[childrenKey]] as T[],
          func,
          childrenKey,
          ps,
          layer + 1,
        )
      }
      if (ret !== undefined) {
        return ret
      }
    }
  }
}

/**
 * @method              树遍历(后序)
 * @param datas         树数据
 * @param childrenKey   子节点的key值
 * @param func          遍历函数，返回非undefined值会提前返回该值
 * @returns
 */
export function traverseBackwards<T extends TreeData, R>(
  datas: T[] = [],
  func: (
    d: T,
    i: number,
    ds: T[],
    ps: T[],
    layer: number,
    depth: number,
  ) => R = () => undefined as R,
  childrenKey: keyof T = "children",
  parents?: T[],
  layer = 0,
): R | undefined {
  let depth = layer
  for (let i = 0; i < datas.length; ++i) {
    const d = datas[i]
    let ret: R | undefined
    const ps = (parents || []).concat(d)
    if ((d[childrenKey] as any) instanceof Array) {
      ret = traverseBackwards(
        d[childrenKey] as T[],
        (...rest) => {
          depth = Math.max(depth, rest[4])
          return func(...rest)
        },
        childrenKey,
        ps,
        layer + 1,
      )
    } else if (d[childrenKey]) {
      ret = traverseBackwards(
        [d[childrenKey]] as T[],
        (...rest) => {
          depth = Math.max(depth, rest[4])
          return func(...rest)
        },
        childrenKey,
        ps,
        layer + 1,
      )
    }
    if (ret !== undefined) {
      return ret
    } else {
      ret = func(d, i, datas, parents || [], layer, depth - layer)
      if (ret !== undefined) {
        return ret
      }
    }
  }
}

/**
 * @method              树遍历map
 * @param datas         树数据
 * @param childrenKey   子节点的key值
 * @param func          遍历函数，返回值会push到最后的返回值
 * @param filter        filter函数，如何有值，根据返回boolean判断是否过滤该此遍历函数返回
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flatMapTree<R = any, T extends TreeData = TreeData>(
  datas: T[],
  func: (
    d: T,
    i: number,
    ds: T[],
    ps: T[] | undefined,
    layer: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => R,
  postFilter?: (
    d: T,
    i: number,
    ds: T[],
    ps: T[] | undefined,
    layer: number,
  ) => boolean,
  childrenKey: keyof T = "children",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): R[] {
  const mapData: R[] = []
  traverse(
    datas,
    (d, i, ds, ps, layer) => {
      const nextLayer = (layer || 0) + 1
      const ret = func(d, i, ds, ps, nextLayer)
      if (postFilter instanceof Function) {
        const isResolve = postFilter(d, i, ds, ps, layer)
        if (isResolve) {
          mapData.push(ret)
        }
      } else {
        mapData.push(ret)
      }
    },
    childrenKey,
  )
  return mapData
}

/**
 * @method              异步树遍历
 * @param datas         树数据
 * @param childrenKey   子节点的key值
 * @param func          遍历函数，返回非undefined值会提前返回该值
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function traverseAsync<T extends TreeData>(
  datas: T[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  func: (d: T, i: number, ds: T[], ps: T[] | undefined, layer: number) => any,
  childrenKey: keyof T = "children",
  parents: T[] = [],
  layer = 0,
) {
  if (func instanceof Function) {
    for (let i = 0; i < datas.length; ++i) {
      const d = datas[i]
      let ret = await func(d, i, datas, parents, layer)
      if (ret !== undefined) {
        return ret
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((d[childrenKey] as any) instanceof Array) {
          ret = await traverseAsync(
            d[childrenKey] as T[],
            func,
            childrenKey,
            (parents || []).concat(d),
            layer + 1,
          )
          if (ret !== undefined) {
            return ret
          }
        }
      }
    }
  }
}

/**
 * @method              异步树遍历map
 * @param datas         树数据
 * @param childrenKey   子节点的key值
 * @param func          遍历函数，返回值会push到最后的返回值
 * @param filter        filter函数，如何有值，根据返回boolean判断是否过滤该此遍历函数返回
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function flatMapTreeAsync<T extends TreeData>(
  datas: T[],
  func: (
    d: T,
    i: number,
    ds: T[],
    ps: T[] | undefined,
    layer: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter?: (
    d: T,
    i: number,
    ds: T[],
    ps: T[] | undefined,
    layer: number,
  ) => boolean,
  childrenKey: keyof T = "children",
): Promise<T[]> {
  const mapData: T[] = []
  await traverse(
    datas,
    async (d, i, ds, ps, layer) => {
      const nextLayer = (layer || 0) + 1
      let ret = func(d, i, ds, ps, nextLayer)
      if (ret instanceof Promise) {
        ret = await ret
      }
      if (filter instanceof Function) {
        const isResolve = filter(d, i, ds, ps, nextLayer)
        if (isResolve) {
          mapData.push(ret)
        }
      } else {
        mapData.push(ret)
      }
    },
    childrenKey,
  )
  return mapData
}

export function buildTree<
  T extends Partial<Record<string | number | symbol, any>>,
>(
  datas: T[],
  dataKey: keyof T = "id",
  childrenKey: keyof T = "children",
  parentKey: keyof T = "parentId",
) {
  const dict = datas.reduce<Partial<Record<string, T>>>((t, data) => {
    t[data?.[dataKey as keyof T]] = { ...data, [childrenKey]: [] }
    return t
  }, {})
  const tree: T[] = []
  datas.forEach((data) => {
    if (!isIdEmpty(data[parentKey])) {
      const parent = dict[data[parentKey]]
      parent![childrenKey].push(dict[data[dataKey]])
    } else if (dict[data[dataKey]]) {
      tree.push(dict[data[dataKey]]!)
    }
  })
  return tree
}

export function mapTree<T extends TreeData, R extends TreeData = any>(
  datas: T[],
  mapper: (d: T, i: number, ds: T[], ps: T[], layer: number) => R,
  options: {
    preFilter?: (d: T, i: number, ds: T[], ps: T[], layer: number) => boolean
    afterFilter?: (d: R, i: number, ds: T[], ps: T[], layer: number) => boolean
    childrenKey?: keyof T
    // order?: { by: keyof R; type: "asc" | "desc" }
    sort?: (a: R, b: R) => number
  } = {},
  // inside use
  parents: T[] = [],
  layer = 0,
) {
  let { childrenKey } = options || {}
  const { sort, preFilter, afterFilter } = options || {}
  childrenKey = childrenKey ?? "children"
  // const sort = (d: R[]) =>
  //   order?.by
  //     ? d.sort((a, b) =>
  //         order.type === "asc"
  //           ? (a[order.by] || 0) - (b[order.by] || 0)
  //           : (b[order.by] || 0) - (a[order.by] || 0),
  //       )
  //     : d
  const newDatas: R[] = []
  datas.forEach((d, i) => {
    if (preFilter && !preFilter(d, i, datas, parents, layer)) {
      return
    }
    const r = mapper(d, i, datas, parents, layer)
    if (((d?.[childrenKey] as T[]) || []).length > 0) {
      r[childrenKey as keyof R] = mapTree(
        d[childrenKey] as T[],
        mapper,
        options,
        parents.concat(d),
        layer + 1,
      ) as any
    }
    if (afterFilter && !afterFilter(r, i, datas, parents, layer)) {
      return
    }
    newDatas.push(r)
  })
  newDatas.sort(sort)
  return newDatas
}

export async function mapTreeAsync<
  T extends TreeData,
  R extends TreeData = any,
>(
  datas: T[],
  mapper: (d: T, i: number, ds: T[], ps: T[], layer: number) => Promise<R> | R,
  options: {
    preFilter?: (
      d: T,
      i: number,
      ds: T[],
      ps: T[],
      layer: number,
    ) => Promise<boolean> | boolean
    afterFilter?: (
      d: R,
      i: number,
      ds: T[],
      ps: T[],
      layer: number,
    ) => Promise<boolean> | boolean
    childrenKey?: keyof T
    // order?: { by: keyof R; type: "asc" | "desc" }
    sort?: (a: R, b: R) => number
  } = {},
  // inside use
  parents: T[] = [],
  layer = 0,
) {
  let { childrenKey } = options || {}
  const { sort, preFilter, afterFilter } = options || {}
  childrenKey = childrenKey ?? "children"
  // const sort = (d: R[]) =>
  //   order?.by
  //     ? d.sort((a, b) =>
  //         order.type === "asc"
  //           ? (a[order.by] || 0) - (b[order.by] || 0)
  //           : (b[order.by] || 0) - (a[order.by] || 0),
  //       )
  //     : d
  const newDatas: R[] = []
  for (let i = 0; i < datas.length; ++i) {
    const d = datas[i]
    if (preFilter && !(await preFilter(d, i, datas, parents, layer))) {
      continue
    }
    const r = await mapper(d, i, datas, parents, layer)
    if (((d?.[childrenKey] as T[]) || []).length > 0) {
      r[childrenKey as keyof R] = (await mapTreeAsync(
        d[childrenKey] as T[],
        mapper,
        options,
        parents.concat(d),
        layer + 1,
      )) as any
    }
    if (afterFilter && !(await afterFilter(r, i, datas, parents, layer))) {
      continue
    }
    newDatas.push(r)
  }
  newDatas.sort(sort)
  return newDatas
}

export function findTreePath<T extends TreeData>(
  tree: T[] = [],
  isIt: (d: T) => boolean = () => false,
) {
  return traverse(tree, (d, _i, _ds, ps) => {
    if (isIt(d)) {
      return (ps || [])?.concat(d)
    }
  })
}

export function searchTree<T extends TreeData>(
  tree: T[] = [],
  // isIt 正向，搜索出来的节点的父节点、子节点都会添加、但不添加同级子节点
  isIt: (d: T) => boolean,
  options: {
    key?: (d: T) => string
    // 剔除不满足的节点及其子节点
    exclude?: (d: T) => boolean
  } = {},
) {
  let { key, exclude } = options || {}
  key = key || ((d) => d.id)
  exclude = exclude || (() => false)
  const isItMap = {} as Partial<{ [k: string]: boolean }>
  return mapTree(
    tree,
    (d, _, __, ps) => {
      const ret = isItMap[key(d)] || isIt(d)
      if (ret) {
        isItMap[key(d)] = true
        ps.forEach((d) => (isItMap[key(d)] = true))
      } else {
        // 父亲节点 有，则子节点加上，且不用再遍历父节点了。
        // isItMap[key(d)] = ps.some((d) => isItMap[key(d)])
      }
      return { ...d }
    },
    {
      afterFilter: (d) => {
        return !!isItMap[key(d)] && !exclude(d)
      },
    },
  )
}

export async function searchTreeAsync<T extends TreeData>(
  tree: T[] = [],
  // isIt 正向，搜索出来的节点的父节点、子节点都会添加、但不添加同级子节点
  isIt: (d: T) => boolean | Promise<boolean>,
  options: {
    key?: (d: T) => string
    // 剔除不满足的节点及其子节点
    exclude?: (d: T) => Promise<boolean> | boolean
  } = {},
) {
  let { key, exclude } = options || {}
  key = key || ((d) => d.id)
  exclude = exclude || (async () => false)
  const isItMap = {} as Partial<{ [k: string]: boolean }>
  return mapTreeAsync(
    tree,
    async (d, _, __, ps) => {
      const ret = isItMap[key(d)] || (await isIt(d))
      if (ret) {
        isItMap[key(d)] = true
        ps.forEach((d) => (isItMap[key(d)] = true))
      } else {
        // 父亲节点 有，则子节点加上，且不用再遍历父节点了。
        // isItMap[key(d)] = ps.some((d) => isItMap[key(d)])
      }
      return { ...d }
    },
    {
      afterFilter: async (d) => {
        return !!isItMap[key(d)] && !(await exclude(d))
      },
    },
  )
}

export function traverseEvery<T extends TreeData>(
  tree: T[],
  cb: (d: T) => boolean,
) {
  return (
    traverse(tree, (d) => {
      return cb(d) ? undefined : false
    }) ?? true
  )
}

export function traverseSome<T extends TreeData>(
  tree: T[],
  cb: (d: T, layer: number) => boolean,
) {
  return (
    traverse(tree, (d, _, __, ___, layer) =>
      cb(d, layer) ? true : undefined,
    ) ?? false
  )
}

export function getTreeDepth(tree: TreeData[], childrenKey: keyof TreeData) {
  let depth = 0
  traverse(
    tree,
    (_, __, ___, ____, layer) => {
      depth = Math.max(depth, layer)
    },
    childrenKey,
  )
  return depth
}
