// Navigation data for XRPL (XRP Ledger) section
window.navigationTitle = "XRPL";
const navigationData = {
  topics: [
    {
      id: "xrpl-intro",
      name: "Introduction",
      icon: "⚡",
      expanded: true,
      pages: [
        { id: "intro", name: "XRP Ledger Overview", path: "/xrpl/intro.html" },
      ],
    },
    {
      id: "accounts",
      name: "Accounts",
      icon: "👤",
      expanded: false,
      pages: [
        {
          id: "intro",
          name: "Introduction",
          path: "/xrpl/accounts/intro.html",
        },
        {
          id: "create",
          name: "Create / Import Account",
          path: "/xrpl/accounts/create.html",
        },
      ],
    },
    {
      id: "transactions",
      name: "Transactions",
      icon: "📤",
      expanded: false,
      pages: [
        {
          id: "intro",
          name: "Introduction",
          path: "/xrpl/transactions/intro.html",
        },
        {
          id: "sign",
          name: "Sign Transaction",
          path: "/xrpl/transactions/sign.html",
        },
      ],
    },
    {
      id: "consensus-mechanisms",
      name: "Consensus Mechanisms",
      icon: "🤝",
      expanded: false,
      pages: [
        {
          id: "intro",
          name: "Nodes in the Ecosystem",
          path: "/xrpl/consensus-mechanisms/intro.html",
        },
        {
          id: "submit",
          name: "Submit Transaction",
          path: "/xrpl/consensus-mechanisms/submit-transaction.html",
        },
      ],
    },
    {
      id: "multi-signature",
      name: "Multi‑Signature",
      icon: "🛡️",
      expanded: false,
      pages: [
        {
          id: "intro",
          name: "Introduction",
          path: "/xrpl/multi-signature/intro.html",
        },
      ],
    },
    {
      id: "tokens",
      name: "Tokens",
      icon: "🪙",
      expanded: false,
      pages: [
        { id: "intro", name: "Overview", path: "/xrpl/tokens/intro.html" },
        {
          id: "trust-lines",
          name: "Trust Lines",
          path: "/xrpl/tokens/trust-lines.html",
        },
        {
          id: "fungible",
          name: "Fungible Tokens",
          path: "/xrpl/tokens/fungible.html",
        },
        {
          id: "non-fungible",
          name: "Non‑Fungible Tokens",
          path: "/xrpl/tokens/non-fungible.html",
        },
      ],
    },
    {
      id: "dex",
      name: "Decentralized Exchange",
      icon: "📊",
      expanded: false,
      pages: [
        {
          id: "intro",
          name: "Order Book vs AMM",
          path: "/xrpl/dex/intro.html",
        },
        {
          id: "orderbook",
          name: "View Order Book",
          path: "/xrpl/dex/orderbook.html",
        },
        { id: "paths", name: "Pathfinding", path: "/xrpl/dex/paths.html" },
      ],
    },
  ],
};
