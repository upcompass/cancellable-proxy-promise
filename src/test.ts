import { CancelledPromiseError, promise, PromiseContext } from './index'

global.Promise = promise

process.on('unhandledRejection', error => {
  if (error instanceof CancelledPromiseError) {
    console.log(`Cancelled promise ${error.message} execution chain`)
  }
})

let st
const timeout = () => {
  console.log(`Unresolved refs: ${PromiseContext.refs}`)
  // console.log(`Pending promises: ${pendingExecutions}`)
  if (PromiseContext.refs) {
    st = setTimeout(timeout, 1000)
  } else {
    clearTimeout(st)
  }
}

const asyncronous = async () => {
  const promises = []
  for (let i = 0; i < 10; i++) {
    // Execution chain 1
    const p = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(i)
      }, 1000 * i)
    })
    promises.push(p)
    // Execution chain 2
    p
      .then(
        (result: any) =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              console.log(`Resolved promise ${result}`)
              resolve(result)
            }, 1000 * i)
          })
      ) // Execution chain 3
      .then(result => console.log(`Resolved then promise ${result}`))
  }
  promises.push(
    new Promise((resolve, reject) => {
      reject(new Error('Testing fail'))
    })
  )
  await Promise.all(promises)
}
;(async () => {
  try {
    const promise = asyncronous() as any
    timeout()
    const st = setTimeout(() => {
      promise.cancel()
    }, 100)
    await promise
    clearTimeout(st)
  } catch (error) {
    console.log(
      `Caught promise error outlives function execution: ${error.message}`
    )
  }
  console.log('Results outlive function execution')
})()
