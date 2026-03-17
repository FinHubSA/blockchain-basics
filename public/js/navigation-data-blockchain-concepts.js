// Navigation data for Blockchain Concepts section
window.navigationTitle = 'Blockchain Concepts';
const navigationData = {
    topics: [
        {
            id: 'public-key-crypto',
            name: 'Public Key Cryptography',
            icon: '🔐',
            expanded: true,
            pages: [
                { id: 'intro', name: 'Introduction', path: '/blockchain-concepts/public-key-cryptography/intro.html' },
                { id: 'key-generation', name: 'Key Generation & Operations', path: '/blockchain-concepts/public-key-cryptography/key-generation.html' }
            ]
        },
        {
            id: 'distributed-ledgers',
            name: 'Distributed Ledgers',
            icon: '📚',
            expanded: false,
            pages: [
                { id: 'intro', name: 'Introduction', path: '/blockchain-concepts/distributed-ledgers/intro.html' }
            ]
        },
        {
            id: 'consensus-mechanisms',
            name: 'Consensus Mechanisms',
            icon: '🤝',
            expanded: false,
            pages: [
                { id: 'intro', name: 'Introduction', path: '/blockchain-concepts/consensus-mechanisms/intro.html' }
            ]
        }
    ]
};
