'use strict'
const uuidv1 = require('uuid/v1')

const PromiseContext = {
  refs: 0
}

class CancelledPromiseError extends Error {
  constructor(message) {
    super(message)
    Object.setPrototypeOf(this, CancelledPromiseError.prototype)
  }
}

const handler = {
  construct: (target, argumentList, newTarget) => {
    PromiseContext.refs++
      const [executor, id = uuidv1()] = argumentList
    PromiseContext[id] = PromiseContext[id] || {
      cancelled: false
    }

    const instance = Object.assign(
      new Proxy(Object.assign(new target(executor), id), {
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
      }), {
        cancel: () => {
          PromiseContext[id].cancelled = true
        },
        id
      }
    )

    instance.then((...args) => {
      PromiseContext.refs--
        if (PromiseContext[id].cancelled) {
          // console.log(`Cancelling promise ${id} ${args}`)
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

const promise = new Proxy(global.Promise, handler)

module.exports = {
  promise,
  PromiseContext,
  CancelledPromiseError
}
