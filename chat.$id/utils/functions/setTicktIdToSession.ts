export function setTicktIdToSession(state: { ticketId: string }) {
  if (!sessionStorage.getItem('ticktId'))
    sessionStorage.setItem('ticktId', state.ticketId)

  const ticktId = sessionStorage.getItem('ticktId')
  if (ticktId) {
    return ticktId
  } else return undefined
}
