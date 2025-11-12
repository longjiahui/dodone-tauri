const TYPE_ON = 'on'
const TYPE_ONCE = 'once'

const forAllChannel = 'forAll'

class Callback {
    constructor(type, callback) {
        this.type = type
        this.callback = callback
        if (
            !(callback instanceof Function) ||
            ![TYPE_ON, TYPE_ONCE].includes(type)
        ) {
            console.error(
                `construct Callback error: type(${type}) callback instanceof Function(${
                    callback instanceof Function
                })`,
            )
        }
    }

    call(...rest) {
        return this.callback(...rest)
    }
}

class _Emitter {
    constructor() {
        this.callbacks = {}
    }

    _confirmCMDFunc(channel) {
        if (!(this.callbacks[channel] instanceof Array)) {
            this.callbacks[channel] = []
        }
    }
    off(channel, callback) {
        const ind = this.callbacks[channel]?.findIndex?.((f) => {
            return f?.callback === callback
        })
        if (ind > -1) {
            this.callbacks[channel].splice(ind, 1)
        }
    }
    // id 用来获取返回
    on(channel, callback) {
        this._confirmCMDFunc(channel)
        this.callbacks[channel].push(new Callback(TYPE_ON, callback))
        return this
    }
    once(channel, callback) {
        this._confirmCMDFunc(channel)
        this.callbacks[channel].push(new Callback(TYPE_ONCE, callback))
        return this
    }
    async emit(channel, ...rest) {
        if (this.callbacks[channel] && this.callbacks[channel].length > 0) {
            const callbacks = this.callbacks[channel]
            const rets = callbacks.map((callback) => callback.call(...rest))
            // removeAll Once Func
            this.callbacks[channel] = callbacks.filter(
                (c) => c.type !== TYPE_ONCE,
            )
            return await Promise.all(rets)
        } else {
            return []
        }
    }
}

export class Emitter extends _Emitter {
    constructor(...rest) {
        super(...rest)
        // 用来监听所有的事件emit
        this.forAll = new _Emitter()
    }
    onAll(callback) {
        this.forAll.on(forAllChannel, callback)
        return this
    }
    onceAll(callback) {
        this.forAll.once(forAllChannel, callback)
        return this
    }
    async emit(channel, ...rest) {
        const rets =
            (await this.forAll.emit(forAllChannel, channel, ...rest)) || []
        return rets.concat(...(await super.emit(channel, ...rest)))
    }
}
