// App
import useSWR from 'swr'


const factoryFetcher = (args) => {
  /*
  args (object) of the follwoing:
    method (contract method name (str))
    methParams (contract method params (list))
    how (contract method type, eg. call, send (str))
    howParams (contract method type params (object))
  */
  const { factory, action, method, methParams, how, howParams } = args

  let res = []

  if (action == 'methods') {
    if (typeof factory !== 'undefined') {
      res = factory.methods[method](...methParams)[how](howParams)
    }
  }

  if (action == 'events') {
    if (typeof factory !== 'undefined') {
      res = factory.events[method](methParams)
    }
  }

  return res
}

export const useFactory = (args, options) => {
  /*
  args (object) of the follwoing:
    method (contract method name (str))
    methParams (contract method params (list))
    how (contract method type, eg. call, send (str))
    howParams (contract method type params (object))
  */
  const { data, mutate, error } = useSWR(args, factoryFetcher, options)

  return {
    data,
    error,
    mutate
  }
}