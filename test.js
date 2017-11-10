const { CancelledPromiseError, promise, PromiseContext } = require('./index')

global.Promise = promise

process.on('unhandledRejection', error => {
    if (error instanceof CancelledPromiseError) {
        console.log(`Cancelled promise ${error.message} execution chain`)
    }
})

let st
let print = () => {

    if (PromiseContext.refs) {
        st = setTimeout(print, 1000)
    }
    else {
        clearTimeout(st)
    }

    console.log(PromiseContext)
}

setTimeout(print, 1000)

;
(async() => {

    const stamp = Date.now()
    const asynchronous = new Promise((resolve, reject) => {
        console.log('Async promise execution')
        resolve()
    }, stamp)

    console.log('Overrides global.Promise and allows cancelling promise chain bases on a token')

    // const cancellablePromise = asynchronous()
    const cancellablePromise = asynchronous

    cancellablePromise.then(result => {
        // Promise is eagerly evaluated and can't be stopped
        new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(`Promise shouldn't execute`)
            }, 1000)
        }, stamp).then(result => console.log(result))
    })

    console.log('Cancelling')
    // Cancels further executions of the promise chains
    cancellablePromise.cancel()
})()


;
(async() => {

    const stamp = Date.now()

    const asynchronous = async() => {
        console.log('Async function execution')
    }

    // Async can't be cancelled because it's not globally exposed

    console.log('AsyncFunction is not globally exposed, is not overridable and always uses native promises, this causes the promise chain not be cancellable')

    // Return a promise
    const cancellablePromise = asynchronous()

    cancellablePromise.then(result => {
        // Promise is eagerly evaluated and can't be stopped
        new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(`Async shouldn't execute`)
            }, 1000)
        }, stamp).then(result => console.log(result))
    })

    // Call is elided?
    cancellablePromise.cancel()

})()
