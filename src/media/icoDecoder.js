export const isIcoHeader = (bytes) => (
  bytes?.[0] === 0x00 &&
  bytes?.[1] === 0x00 &&
  (bytes?.[2] === 0x01 || bytes?.[2] === 0x02) &&
  bytes?.[3] === 0x00
)

