// Navigation data structure - single source of truth for all navigation
const navigationData = {
    topics: [
        {
            id: 'public-key-crypto',
            name: 'Public Key Cryptography',
            icon: '🔐',
            expanded: true,
            pages: [
                {
                    id: 'intro',
                    name: 'Introduction',
                    path: '/ethereum/public-key-cryptography/intro.html'
                },
                {
                    id: 'key-generation',
                    name: 'Key Generation & Operations',
                    path: '/ethereum/public-key-cryptography/key-generation.html'
                }
            ]
        },
        {
            id: 'distributed-ledgers',
            name: 'Distributed Ledgers',
            icon: '📚',
            expanded: false,
            pages: [
                {
                    id: 'intro',
                    name: 'Introduction',
                    path: '/ethereum/distributed-ledgers/intro.html'
                },
                {
                    id: 'transaction-signing',
                    name: 'Transaction Signing',
                    path: '/ethereum/distributed-ledgers/transaction-signing.html'
                }
            ]
        },
        {
            id: 'consensus-mechanisms',
            name: 'Consensus Mechanisms',
            icon: '🤝',
            expanded: false,
            pages: [
                {
                    id: 'intro',
                    name: 'Introduction',
                    path: '/ethereum/consensus-mechanisms/intro.html'
                },
                {
                    id: 'submit-transaction',
                    name: 'Submit Transaction to Sepolia',
                    path: '/ethereum/consensus-mechanisms/submit-transaction.html'
                }
            ]
        },
        {
            id: 'smart-contracts',
            name: 'Smart Contracts',
            icon: '📜',
            expanded: false,
            pages: [
                {
                    id: 'intro',
                    name: 'Introduction',
                    path: '/ethereum/smart-contracts/intro.html'
                },
                {
                    id: 'solidity',
                    name: 'Solidity',
                    path: '/ethereum/smart-contracts/solidity.html'
                }
            ]
        },
        {
            id: 'tokenization',
            name: 'Tokenization',
            icon: '🪙',
            expanded: false,
            pages: [
                {
                    id: 'intro',
                    name: 'Introduction',
                    path: '/ethereum/tokenization/intro.html'
                }
            ]
        }
        // Add more topics here as needed
        // {
        //     id: 'blockchain-basics',
        //     name: 'Blockchain Basics',
        //     icon: '⛓️',
        //     expanded: false,
        //     pages: [
        //         {
        //             id: 'what-is-blockchain',
        //             name: 'What is Blockchain?',
        //             path: '/blockchain-basics/what-is-blockchain.html'
        //         }
        //     ]
        // }
    ]
};

