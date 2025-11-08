type EventMap = Record<string, (...rest: any[]) => any>

export class Emitter<Events extends EventMap> {
    on<Key extends keyof Events>(
        type: Key,
        listener: (
            ...rest: Parameters<Events[Key]>
        ) => PromiseLike<ReturnType<Events[Key]>> | ReturnType<Events[Key]>,
    ): this
    off<Key extends keyof Events>(
        type: Key,
        listener: (
            ...rest: Parameters<Events[Key]>
        ) => PromiseLike<ReturnType<Events[Key]>> | ReturnType<Events[Key]>,
    )
    emit<Key extends keyof Events>(
        type: Key,
        ...params: Parameters<Events[Key]>
    ): Promise<ReturnType<Events[Key]>[]>
    onAll(
        callback: (
            channel: keyof Events,
            ...rest: Parameters<Events[keyof Events]>
        ) => any,
    ): this
}
