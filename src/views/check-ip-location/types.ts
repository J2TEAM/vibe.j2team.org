export type Coordinates = [number, number]

export type TrackedIpLocation = {
  ip: string
  query?: string
  city: string
  country: string
  isp: string
  coordinates: Coordinates
}
