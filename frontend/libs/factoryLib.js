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
    console.log(args)
    const { factory, method, methParams, how, howParams } = args

    let res = []

    if (typeof factory !== 'undefined') {
      res = factory.methods[method](...methParams)[how](howParams)
      console.log(res)
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
  const { data, mutate, error } = useSWR(args, factoryFetcher, options )

  return {
    data,
    error,
    mutate
  }
}