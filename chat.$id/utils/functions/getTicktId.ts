export function getTicktId() {
  const ticktId = sessionStorage.getItem('ticktId')
  if (ticktId) {
    return ticktId
  } else return undefined
}
