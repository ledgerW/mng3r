
const showAddress = (address) => {
  const pre = address.substring(0, 6)
  const post = address.substring(address.length - 4)

  return [pre, post].join('...')
}


export const showTime = (unixTime) => {
  // Create a new JavaScript Date object based on the timestamp
  // multiplied by 1000 so that the argument is in milliseconds, not seconds.
  var date = new Date(unixTime * 1000)

  // Will display time in 10:30:23 format
  var displayTime = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes()

  return displayTime
}

export default showAddress