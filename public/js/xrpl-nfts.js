document.addEventListener('DOMContentLoaded', () => {
    const addressInput = document.getElementById('nftAddressInput');
    const loadButton = document.getElementById('loadNftsBtn');
    const listContainer = document.getElementById('nftList');
    const summaryEl = document.getElementById('nftSummary');

    if (!addressInput || !loadButton || !listContainer) return;

    function setSummary(text, isError = false) {
        if (!summaryEl) return;
        summaryEl.textContent = text || '';
        summaryEl.style.color = isError ? '#b00020' : '#444';
    }

    function clearList() {
        listContainer.innerHTML = '';
    }

    function renderNftCard(nft, history) {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginTop = '10px';

        const id = nft.NFTokenID || nft.nft_id || '';
        const uriHex = nft.URI || '';
        let uriText = '';
        if (uriHex) {
            try {
                const bytes = new Uint8Array(uriHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                uriText = new TextDecoder().decode(bytes);
            } catch (e) {
                uriText = uriHex;
            }
        }

        const details = document.createElement('div');
        details.innerHTML = `
            <h4 style="margin-top:0;">NFT ${id ? id.slice(0, 10) + '…' : ''}</h4>
            <p style="font-size:0.9rem;">
                <strong>NFTokenID:</strong> <code>${id}</code><br/>
                ${uriText ? `<strong>URI:</strong> <code>${uriText}</code><br/>` : ''}
                <strong>Issuer:</strong> <code>${nft.Issuer || nft.issuer || 'Unknown'}</code><br/>
                <strong>Taxon:</strong> ${typeof nft.NFTokenTaxon === 'number' ? nft.NFTokenTaxon : nft.nft_taxon ?? 'N/A'}
            </p>
        `;
        card.appendChild(details);

        const historyBox = document.createElement('div');
        historyBox.style.marginTop = '8px';
        historyBox.style.fontSize = '0.85rem';

        if (history && Array.isArray(history.transactions) && history.transactions.length > 0) {
            const list = document.createElement('ul');
            list.style.paddingLeft = '18px';
            history.transactions.slice(0, 5).forEach((tx: any) => {
                const li = document.createElement('li');
                const type = tx.tx && tx.tx.TransactionType ? tx.tx.TransactionType : 'Transaction';
                const hash = tx.tx && tx.tx.hash ? tx.tx.hash : tx.hash || '';
                li.innerHTML = `${type}${hash ? ` (<code>${hash.slice(0, 10)}…</code>)` : ''}`;
                list.appendChild(li);
            });
            historyBox.innerHTML = '<strong>Recent NFT history (up to 5 entries):</strong>';
            historyBox.appendChild(list);
        } else if (history && history.error) {
            historyBox.innerHTML = `<strong>NFT history:</strong> <span style="color:#b00020;">${history.error}</span>`;
        } else {
            historyBox.textContent = 'No history information available for this NFT.';
        }

        card.appendChild(historyBox);
        listContainer.appendChild(card);
    }

    async function fetchNftsForAddress(address: string) {
        const res = await fetch('/api/xrpl-account-nfts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classicAddress: address }),
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Failed to load NFTs for account.');
        }
        return data;
    }

    async function fetchNftHistory(nftId: string) {
        try {
            const res = await fetch('/api/xrpl-nft-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nftId }),
            });
            const data = await res.json();
            if (!res.ok) {
                return { error: data.error || 'Failed to load NFT history.' };
            }
            return data;
        } catch (err) {
            return { error: (err as Error).message || String(err) };
        }
    }

    async function handleLoad() {
        const address = (addressInput.value || '').trim();
        if (!address) {
            setSummary('Enter an address to inspect NFTs.', true);
            return;
        }
        clearList();
        setSummary('Loading NFTs for address…');

        try {
            const result = await fetchNftsForAddress(address);
            const nfts = Array.isArray(result.account_nfts) ? result.account_nfts : [];
            if (nfts.length === 0) {
                setSummary('This account has no NFTs in the validated ledger.');
                return;
            }
            setSummary(`Found ${nfts.length} NFT(s) for this account.`);

            for (const nft of nfts) {
                const nftId = nft.NFTokenID || nft.nft_id;
                let history = undefined;
                if (nftId) {
                    history = await fetchNftHistory(nftId);
                }
                renderNftCard(nft, history);
            }
        } catch (err) {
            clearList();
            setSummary((err as Error).message || String(err), true);
        }
    }

    loadButton.addEventListener('click', () => {
        handleLoad();
    });
});

