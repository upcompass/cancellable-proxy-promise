# cancellable-proxy-promise
Long running async functions can clog up the event loop.

Experimenting trying to break promise execution chain.

``` typescript
import { CancelledPromiseError, promise } from './index'

global.Promise = promise

process.on('unhandledRejection', error => {
  if (error instanceof CancelledPromiseError) {
    console.log(`Cancelled promise ${error.message} execution chain`)
  }
})

const asynchronous = async () => {
  console.log('Async execution')
}

const cancellablePromise = asynchronous() as any

cancellablePromise.then(result => {
  // Promise is eagerly evaluated and can't be stopped
  new Promise((resolve, reject) => {
    setTimeout(() => {
       resolve(`Shouldn't execute`)
    }, 1000)
  }).then(result => console.log(result))
})

// Cancels further executions of the promise chains
cancellablePromise.cancel()
```
