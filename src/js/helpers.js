/* eslint-disable no-unused-vars */
const $ = (target, context) => (context || document).querySelector(target)
const $$ = (target, context) => (context || document).querySelectorAll(target)

const forEach = (array, callback, scope) => {
  for (let i = 0, limit = array.length; i < limit; i++) {
    callback.call(scope, array[i], i)
  }
}
