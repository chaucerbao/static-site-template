// Selectors
export const $ = (target, context) =>
  (context || document).querySelector(target)
export const $$ = (target, context) =>
  (context || document).querySelectorAll(target)

// Loop over array-like items (e.g. NodeList)
export const forEach = (array, callback, scope) => {
  const limit = array.length

  for (let i = 0; i < limit; i++) {
    callback.call(scope, array[i], i)
  }
}
