import { v4 as uuid } from "uuid"
import { newid } from "../../../src/newid"
import generator from "./generator"

export { v4 as uuid } from "uuid"

export const email = () => {
  return `${uuid()}@test.com`
}

export function id() {
  return newid()
}

export function tenantId() {
  // must not start with a number
  return `${generator.letter()}${newid()}`
}
