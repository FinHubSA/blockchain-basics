// Submit XRPL transaction – same design pattern as Ethereum submit-transaction
const STORAGE_KEY = 'xrplSubmitTransactionData';
const XRPL_WS_URL_KEY = 'xrpl_ws_url';
const XRPL_DEFAULT_WS = 'wss://testnet.xrpl-labs.com';
const EXPLORER_TX_URL_MAINNET = 'https://livenet.xrpl.org/transactions/';
const EXPLORER_TX_URL_TESTNET = 'https://testnet.xrpl.org/transactions/';

document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submitBtn');
    const clearBtn = document.getElementById('clearBtn');
    const wsUrlInput = document.getElementById('xrplWsUrl');

    if (wsUrlInput) {
        try {
            const saved = localStorage.getItem(XRPL_WS_URL_KEY);
            wsUrlInput.value = (saved && saved.trim()) || XRPL_DEFAULT_WS;
        } catch (e) {}
        wsUrlInput.addEventListener('change', saveWsUrl);
        wsUrlInput.addEventListener('input', saveWsUrl);
    }

    loadStoredTransactionData();
    setupInputListeners();

    if (submitBtn) submitBtn.addEventListener('click', submitTransaction);
    if (clearBtn) clearBtn.addEventListener('click', clearForm);
});

function saveWsUrl() {
    const el = document.getElementById('xrplWsUrl');
    if (el) try { localStorage.setItem(XRPL_WS_URL_KEY, (el.value && el.value.trim()) || XRPL_DEFAULT_WS); } catch (e) {}
}

function getWsUrl() {
    const el = document.getElementById('xrplWsUrl');
    return (el && el.value && el.value.trim()) || XRPL_DEFAULT_WS;
}

function getExplorerTxUrl(wsUrl) {
    return (wsUrl && wsUrl.toLowerCase().indexOf('testnet') !== -1) ? EXPLORER_TX_URL_TESTNET : EXPLORER_TX_URL_MAINNET;
}

function setupInputListeners() {
    const signedTxInput = document.getElementById('signedTx');
    if (signedTxInput) {
        signedTxInput.addEventListener('input', saveTransactionData);
        signedTxInput.addEventListener('change', saveTransactionData);
    }
}

function saveTransactionData() {
    const signedTx = (document.getElementById('signedTx') && document.getElementById('signedTx').value) || '';
    const wsUrl = getWsUrl();
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ signedTx, wsUrl }));
    } catch (e) {
        console.error('Error saving transaction data to localStorage', e);
    }
}

function loadStoredTransactionData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            const el = document.getElementById('signedTx');
            if (el && data.signedTx) el.value = data.signedTx;
        }
    } catch (e) {
        console.error('Error loading transaction data from localStorage', e);
    }
}

function clearForm() {
    const signedTxEl = document.getElementById('signedTx');
    if (signedTxEl) signedTxEl.value = '';
    const resultEl = document.getElementById('transactionResult');
    if (resultEl) resultEl.style.display = 'none';
    const errorEl = document.getElementById('errorResult');
    if (errorEl) errorEl.style.display = 'none';
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
}

async function submitTransaction() {
    const signedTxRaw = (document.getElementById('signedTx') && document.getElementById('signedTx').value) || '';
    const signedTx = signedTxRaw.replace(/^0x/i, '').trim();

    if (!signedTx) {
        alert('Please enter a signed transaction (tx_blob).');
        return;
    }

    if (!/^[a-fA-F0-9]+$/.test(signedTx)) {
        alert('Signed transaction must be a hexadecimal string.');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn ? submitBtn.textContent : 'Submit Transaction';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }

    document.getElementById('transactionResult').style.display = 'none';
    document.getElementById('errorResult').style.display = 'none';

    const wsUrl = getWsUrl();

    try {
        const response = await fetch('/api/xrpl-submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tx_blob: signedTx, wsUrl })
        });

        const data = await response.json();

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }

        if (response.ok && data.success) {
            const hash = data.transactionHash || '';
            document.getElementById('txHashOutput').textContent = hash;
            const explorerLink = document.getElementById('explorerLink');
            const explorerBase = getExplorerTxUrl(wsUrl);
            if (explorerLink) {
                explorerLink.href = explorerBase + hash;
                explorerLink.textContent = 'View Transaction on XRPL Explorer (' + (hash ? hash.slice(0, 10) + '...' : '') + ')';
            }
            document.getElementById('transactionResult').style.display = 'block';
            document.getElementById('transactionResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            document.getElementById('errorOutput').innerHTML =
                '<strong>Error:</strong> ' + (data.error || data.engine_result || 'Failed to submit transaction');
            document.getElementById('errorResult').style.display = 'block';
        }
    } catch (error) {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
        alert('Error: ' + error.message);
    }
}
