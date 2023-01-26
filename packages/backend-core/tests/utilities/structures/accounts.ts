import generator from "./generator"
import { tenantId, uuid } from "./common"
import * as users from "./users"
import {
  Account,
  AuthType,
  CloudAccount,
  CreateAccount,
  Hosting,
  isCloudAccount,
} from "@budibase/types"

export interface CreateAccountOpts {
  authType: AuthType
  hosting: Hosting
}

export function createAccount(opts: CreateAccountOpts): CreateAccount {
  const tenant = tenantId()

  const create: CreateAccount = {
    email: generator.email(),
    tenantId: tenant,
    hosting: opts.hosting,
    authType: opts.authType,
    tenantName: tenant,
    name: generator.name(),
    size: "10+",
    profession: "Software Engineer",
  }

  if (opts.authType === AuthType.PASSWORD) {
    create.password = generator.string({ length: 10 })
  }

  return create
}

export function account(opts: CreateAccountOpts): Account {
  const account: Account = {
    ...createAccount(opts),
    accountId: uuid(),
    createdAt: Date.now(),
    verified: true,
    verificationSent: true,
  }

  if (isCloudAccount(account)) {
    account.budibaseUserId = users.userId()
  }

  return account
}

// CREATE ACCOUNT

export function cloudCreateAccount(): CreateAccount {
  return createAccount({ authType: AuthType.PASSWORD, hosting: Hosting.CLOUD })
}

export function cloudSsoCreateAccount(): CreateAccount {
  return createAccount({ authType: AuthType.SSO, hosting: Hosting.CLOUD })
}

export function selfCreateAccount(): CreateAccount {
  return createAccount({ authType: AuthType.PASSWORD, hosting: Hosting.SELF })
}

export function selfSsoCreateAccount(): CreateAccount {
  return createAccount({ authType: AuthType.SSO, hosting: Hosting.SELF })
}

// ACCOUNT

export function cloudAccount(): CloudAccount {
  return account({
    authType: AuthType.PASSWORD,
    hosting: Hosting.CLOUD,
  }) as CloudAccount
}

export function cloudSsoAccount(): CloudAccount {
  return account({
    authType: AuthType.SSO,
    hosting: Hosting.CLOUD,
  }) as CloudAccount
}

export function selfAccount(): Account {
  return account({ authType: AuthType.PASSWORD, hosting: Hosting.SELF })
}

export function selfSsoAccount(): Account {
  return account({ authType: AuthType.SSO, hosting: Hosting.SELF })
}
