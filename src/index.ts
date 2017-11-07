import uuidv1 = require('uuid/v1')

export const PromiseContext = {
  cancelled: false,
  refs: 0
}

export class CancelledPromiseError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, CancelledPromiseError.prototype)
  }
}

const handler = {
  construct: (target, argumentList, newTarget) => {
    PromiseContext.refs++
    const id = uuidv1()
    const [executor] = argumentList

    const instance = Object.assign(
      new Proxy(new target(executor), {
        get: (target, property) => {
          if (PromiseContext.cancelled) {
            PromiseContext.refs--
            throw new CancelledPromiseError(id)
          }
          return (
            target[property] &&
            target[property].bind &&
            target[property].bind(target)
          )
        }
      }),
      {
        cancel: () => {
          PromiseContext.cancelled = true
        }
      }
    )

    instance.then((...args) => {
      PromiseContext.refs--
      if (PromiseContext.cancelled) {
        console.log(`Cancelling promise ${id} ${args}`)
        throw new CancelledPromiseError(id)
      }
    })

    instance.catch(error => {
      PromiseContext.refs--
      throw error
    })

    return instance
  }
}

export const promise: () => void = new Proxy(global.Promise, handler)
