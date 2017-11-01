
const util = require('util')
let pendingExecutions = 0
let refs = 0

var handler = {
    construct: function(target, argumentList, newTarget) {
        refs++
        const [executor] = argumentList
        const pre = (resolve, reject) => {
            pendingExecutions++
            return executor(resolve, reject)
        }
        // executor(()=> console.log('0'), ()=> console.log('1'))
        const instance = new target(pre)
        instance.then(() => {
            refs--
            pendingExecutions--
        })
        instance.catch(() => {
            refs--
            pendingExecutions--
        })
        return instance
    }
};

const prom = new Proxy(Promise, handler)

const promise = new prom((resolve, reject) => {
    console.log('123')
    resolve(123);
});

;(async () => {
    const promises = []
    let st
    const timeout = () => {
        console.log(`Unresolved refs: ${refs}`)
        console.log(`Pending promises: ${pendingExecutions}`)
        st = setTimeout(timeout, 1000)
    } 

    setTimeout(timeout, 1000)
    for(let i=0; i<10; i++){
        promises.push(new prom((resolve, reject) => {
            setTimeout(() => {
                console.log(`Resolving ${i}`)
                resolve()
            }, 1000 * i)
        }))
    }
    await Promise.all(promises)
    clearTimeout(st)
})()

console.log(refs)