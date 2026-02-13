function seedCustomers() {
  return new Map([
    [
      "cus_demo_alice",
      {
        id: "cus_demo_alice",
        name: "Alice Carter",
        country: "US",
        kycStatus: "verified",
        createdAt: new Date().toISOString()
      }
    ],
    [
      "cus_demo_bob",
      {
        id: "cus_demo_bob",
        name: "Bob Chen",
        country: "US",
        kycStatus: "verified",
        createdAt: new Date().toISOString()
      }
    ]
  ]);
}

function seedAccounts() {
  return new Map([
    [
      "acc_demo_alice_usd",
      {
        id: "acc_demo_alice_usd",
        ownerCustomerId: "cus_demo_alice",
        accountNumber: "4400000012345678",
        currency: "USD",
        availableBalanceCents: 300000,
        createdAt: new Date().toISOString()
      }
    ],
    [
      "acc_demo_bob_usd",
      {
        id: "acc_demo_bob_usd",
        ownerCustomerId: "cus_demo_bob",
        accountNumber: "4400000098765432",
        currency: "USD",
        availableBalanceCents: 50000,
        createdAt: new Date().toISOString()
      }
    ]
  ]);
}

export const store = {
  customers: seedCustomers(),
  accounts: seedAccounts(),
  payments: new Map(),
  ledgerEntries: [],
  auditLogs: [],
  idempotencyKeys: new Map(),
  recentPaymentAttempts: []
};

export function maskAccountNumber(accountNumber) {
  const tail = accountNumber.slice(-4);
  return `**** **** **** ${tail}`;
}

export function createId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${randomPart}`;
}

export function resetStore() {
  store.customers = seedCustomers();
  store.accounts = seedAccounts();
  store.payments = new Map();
  store.ledgerEntries = [];
  store.auditLogs = [];
  store.idempotencyKeys = new Map();
  store.recentPaymentAttempts = [];
}
