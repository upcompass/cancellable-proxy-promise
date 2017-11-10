import uuidv1 = require('uuid/v1')

export const PromiseContext = {
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
    const [executor, id = uuidv1()] = argumentList
    PromiseContext[id] = {
      cancelled: false
    }

    const instance = Object.assign(
      new Proxy(new target(executor), {
        get: (target, property) => {
          if (PromiseContext[id].cancelled) {
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
          PromiseContext[id].cancelled = true
        },
        id
      }
    )

    instance.then((...args) => {
      PromiseContext.refs--
      if (PromiseContext[instance.id].cancelled) {
        console.log(`Cancelling promise ${instance.id} ${args}`)
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
