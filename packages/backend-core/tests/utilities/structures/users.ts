import generator from "./generator"
import * as db from "../../../src/db"
import { CreateUserResponse } from "@budibase/types"

export function userId() {
  return db.generateGlobalUserID()
}

export function createUserResponse(email?: string): CreateUserResponse {
  return {
    _id: userId(),
    _rev: generator.string(),
    email: email ? email : generator.email(),
  }
}
