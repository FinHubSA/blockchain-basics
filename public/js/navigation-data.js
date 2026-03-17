// Navigation data for Ethereum section
window.navigationTitle = 'Ethereum';
const navigationData = {
    topics: [
        {
            id: 'ethereum-intro',
            name: 'Introduction',
            icon: '⟠',
            expanded: true,
            pages: [
                { id: 'intro', name: 'Ethereum Overview', path: '/ethereum/intro.html' }
            ]
        },
        {
            id: 'accounts',
            name: 'Accounts',
            icon: '👤',
            expanded: false,
            pages: [
                { id: 'intro', name: 'Introduction', path: '/ethereum/accounts/intro.html' },
                { id: 'get-address', name: 'Get or Import Address', path: '/ethereum/accounts/get-address.html' }
            ]
        },
        {
            id: 'transactions',
            name: 'Transactions',
            icon: '📤',
            expanded: false,
            pages: [
                { id: 'intro', name: 'Introduction', path: '/ethereum/transactions/intro.html' },
                { id: 'transaction-signing', name: 'Transaction Signing', path: '/ethereum/transactions/transaction-signing.html' }
            ]
        },
        {
            id: 'consensus-mechanisms',
            name: 'Consensus Mechanisms',
            icon: '🤝',
            expanded: false,
            pages: [
                { id: 'intro', name: 'Nodes in the Ecosystem', path: '/ethereum/consensus-mechanisms/intro.html' },
                { id: 'submit-transaction', name: 'Submit Transaction to Sepolia', path: '/ethereum/consensus-mechanisms/submit-transaction.html' }
            ]
        },
        {
            id: 'smart-contracts',
            name: 'Smart Contracts',
            icon: '📜',
            expanded: false,
            pages: [
                { id: 'intro', name: 'Introduction', path: '/ethereum/smart-contracts/intro.html' },
                { id: 'solidity', name: 'Solidity', path: '/ethereum/smart-contracts/solidity.html' }
            ]
        },
        {
            id: 'tokenization',
            name: 'Tokenization',
            icon: '🪙',
            expanded: false,
            pages: [
                { id: 'intro', name: 'Introduction', path: '/ethereum/tokenization/intro.html' }
            ]
        }
    ]
};
