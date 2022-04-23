import Web3 from "web3";


export default () =>
  new Promise((resolve) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener(`load`, () => {
      resolveWeb3(resolve)
    })
    // If document has loaded already, try to get Web3 immediately.
    if (document.readyState === `complete`) {
      resolveWeb3(resolve)
    }
  })


const resolveWeb3 = (resolve) => {
  let web3Instance
  const alreadyInjected = (typeof window !== "undefined" && typeof window.ethereum !== "undefined")
  const localProvider = process.env.ETH_RINKEBY

  if (alreadyInjected) {
    console.log(`Injected web3 detected.`)
    const providerInstance = window.ethereum
    console.log(providerInstance)
    console.log(window.ethereum)
    web3Instance = new Web3(providerInstance)

    resolve({ web3Instance, providerInstance })
  } else {
    console.log(`No web3 instance injected, using Local web3.`)
    const providerInstance = new Web3.providers.HttpProvider(localProvider)
    web3Instance = new Web3(providerInstance)

    resolve({ web3Instance, providerInstance })
  }
}


export const setCurrentState = async (provider, handlers) => {
  const { setUserAccount, setChainId, setNetworkId, handleConnect } = handlers

  setChainId(provider.chainId)
  setNetworkId(provider.networkVersion)

  const connectedAccounts = await provider.request({ method: 'eth_accounts' })
  if (connectedAccounts.length > 0) {
    setUserAccount(connectedAccounts[0])
  }
}

export const subscribeProvider = async (provider, handlers) => {
  const { setUserAccount, setChainId, setNetworkId, handleConnect } = handlers

  if (!provider.on) {
    return
  }
  // provider.on("close", () => this.resetgetWeb3Provider());
  provider.on("accountsChanged", async (accounts) => {
    console.log("Changed Account")
    setUserAccount(accounts[0])
  })
  provider.on("chainChanged", async (chainId) => {
    console.log("Changed Chain")
    setChainId(chainId)
    window.location.reload()
  })
  // Subscribe to provider connection
  provider.on("connect", async (info) => {
    console.log(info);
  });

  // Subscribe to provider disconnection
  provider.on("disconnect", async (error) => {
    console.log(error);
  });
}