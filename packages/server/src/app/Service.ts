export interface Service {
  start: () => Promise<any>
  stop: () => Promise<any>
}
