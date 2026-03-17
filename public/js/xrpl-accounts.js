// XRPL Create / Import Account page
const XRPL_ACCOUNT_STORAGE_KEY = 'xrpl_create_account';
const XRPL_WS_URL_KEY = 'xrpl_ws_url';
const XRPL_DEFAULT_WS = 'wss://testnet.xrpl-labs.com';

function saveAccountToStorage(payload) {
    try {
        localStorage.setItem(XRPL_ACCOUNT_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn('Could not save account to localStorage', e);
    }
}

function clearAccountStorage() {
    try {
        localStorage.removeItem(XRPL_ACCOUNT_STORAGE_KEY);
    } catch (e) {}
}

function loadAccountFromStorage() {
    try {
        const raw = localStorage.getItem(XRPL_ACCOUNT_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const importBtn = document.getElementById('importBtn');
    const clearBtn = document.getElementById('clearBtn');
    const secretInput = document.getElementById('secretInput');
    const privateKeyInput = document.getElementById('privateKeyInput');
    const showSecrets = document.getElementById('showSecrets');
    const outputSection = document.getElementById('outputSection');
    const copyClassicBtn = document.getElementById('copyClassicBtn');
    const copyPublicKeyBtn = document.getElementById('copyPublicKeyBtn');
    const copyXAddressBtn = document.getElementById('copyXAddressBtn');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const copySeedBtn = document.getElementById('copySeedBtn');

    if (createAccountBtn) createAccountBtn.addEventListener('click', createAccount);
    if (copySeedBtn) copySeedBtn.addEventListener('click', () => copyFromEl('seedOutput', copySeedBtn, 'Copy seed'));
    if (importBtn) importBtn.addEventListener('click', importAccount);
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (secretInput) secretInput.value = '';
            if (privateKeyInput) privateKeyInput.value = '';
            if (outputSection) outputSection.style.display = 'none';
            const seedWrap = document.getElementById('seedOutputWrap');
            const seedEl = document.getElementById('seedOutput');
            if (seedWrap) seedWrap.style.display = 'none';
            if (seedEl) seedEl.textContent = '';
            const statusEl = document.getElementById('accountStatusOutput');
            const balanceEl = document.getElementById('balanceOutput');
            if (statusEl) statusEl.textContent = '';
            if (balanceEl) balanceEl.textContent = '';
            if (showSecrets) showSecrets.checked = false;
            if (secretInput) secretInput.type = 'password';
            if (privateKeyInput) privateKeyInput.type = 'password';
            clearAccountStorage();
        });
    }
    if (showSecrets) {
        showSecrets.addEventListener('change', () => {
            const type = showSecrets.checked ? 'text' : 'password';
            if (secretInput) secretInput.type = type;
            if (privateKeyInput) privateKeyInput.type = type;
        });
    }
    if (copyClassicBtn) copyClassicBtn.addEventListener('click', () => copyFromEl('classicAddressOutput', copyClassicBtn, 'Copy Classic Address'));
    if (copyPublicKeyBtn) copyPublicKeyBtn.addEventListener('click', () => copyFromEl('publicKeyOutput', copyPublicKeyBtn, 'Copy Public Key'));
    if (copyXAddressBtn) copyXAddressBtn.addEventListener('click', () => copyFromEl('xAddressOutput', copyXAddressBtn, 'Copy X-Address'));

    // Restore WebSocket URL from localStorage or use default
    const wsUrlInput = document.getElementById('xrplWsUrl');
    if (wsUrlInput) {
        try {
            const saved = localStorage.getItem(XRPL_WS_URL_KEY);
            if (saved) wsUrlInput.value = saved;
            else wsUrlInput.value = XRPL_DEFAULT_WS;
        } catch (e) {}
        wsUrlInput.addEventListener('change', () => {
            try { localStorage.setItem(XRPL_WS_URL_KEY, wsUrlInput.value.trim() || XRPL_DEFAULT_WS); } catch (e) {}
        });
        wsUrlInput.addEventListener('input', () => {
            try { localStorage.setItem(XRPL_WS_URL_KEY, wsUrlInput.value.trim() || XRPL_DEFAULT_WS); } catch (e) {}
        });
    }

    // Restore account from localStorage on load
    const stored = loadAccountFromStorage();
    if (stored && stored.classicAddress) {
        showOutputWithSeed(
            stored.classicAddress,
            stored.publicKey || '',
            stored.xAddress || stored.classicAddress || '',
            null,
            false
        );
    }
});

function getWsUrl() {
    const el = document.getElementById('xrplWsUrl');
    const url = (el && el.value && el.value.trim()) || XRPL_DEFAULT_WS;
    return url;
}

async function fetchAccountInfo(classicAddress) {
    const statusEl = document.getElementById('accountStatusOutput');
    const balanceEl = document.getElementById('balanceOutput');
    if (!statusEl || !balanceEl) return;
    try {
        const response = await fetch('/api/xrpl-account-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classicAddress, wsUrl: getWsUrl() })
        });
        const data = await response.json();
        if (response.ok) {
            if (data.active) {
                statusEl.textContent = 'Active';
                statusEl.style.color = '';
                balanceEl.textContent = data.balance != null ? data.balance + ' XRP' : '—';
            } else {
                statusEl.textContent = 'Not active (account not yet recorded on the ledger)';
                statusEl.style.color = '#888';
                balanceEl.textContent = '—';
            }
        } else {
            statusEl.textContent = 'Unable to fetch (check network)';
            statusEl.style.color = '#c00';
            balanceEl.textContent = '—';
        }
    } catch (err) {
        statusEl.textContent = 'Unable to fetch (check network)';
        statusEl.style.color = '#c00';
        balanceEl.textContent = '—';
    }
}

function copyFromEl(elementId, button, label) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.textContent;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            if (button) { button.textContent = 'Copied!'; setTimeout(() => { button.textContent = label; }, 2000); }
        }).catch(() => alert('Failed to copy'));
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            if (button) { button.textContent = 'Copied!'; setTimeout(() => { button.textContent = label; }, 2000); }
        } catch (e) { alert('Failed to copy'); }
        document.body.removeChild(ta);
    }
}

function showOutputWithSeed(classicAddress, publicKey, xAddress, seed, saveToStorage = true, storagePayload = null) {
    document.getElementById('classicAddressOutput').textContent = classicAddress;
    document.getElementById('publicKeyOutput').textContent = publicKey || '';
    document.getElementById('xAddressOutput').textContent = xAddress || classicAddress || '';
    document.getElementById('outputSection').style.display = 'block';
    const seedWrap = document.getElementById('seedOutputWrap');
    const seedEl = document.getElementById('seedOutput');
    if (seed && seedWrap && seedEl) {
        seedEl.textContent = seed;
        seedWrap.style.display = 'block';
    } else if (seedWrap) {
        seedWrap.style.display = 'none';
    }
    document.getElementById('accountStatusOutput').textContent = 'Loading…';
    document.getElementById('balanceOutput').textContent = '—';
    fetchAccountInfo(classicAddress);
    if (saveToStorage && storagePayload) {
        saveAccountToStorage(storagePayload);
    }
}

async function createAccount() {
    try {
        const response = await fetch('/api/xrpl-generate-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const data = await response.json();
        if (response.ok) {
            const classicAddress = data.classicAddress || data.address || '';
            const seed = data.seed || null;
            showOutputWithSeed(
                classicAddress,
                data.publicKey || '',
                data.xAddress || classicAddress || '',
                seed,
                true,
                { type: 'seed', value: seed, classicAddress, publicKey: data.publicKey, xAddress: data.xAddress || classicAddress }
            );
        } else {
            alert(data.error || 'Failed to generate account');
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function importAccount() {
    const secret = (document.getElementById('secretInput')?.value || '').trim();
    let privateKeyHex = (document.getElementById('privateKeyInput')?.value || '').replace(/^0x/i, '').trim();

    if (secret && privateKeyHex) {
        alert('Enter either family seed or private key, not both.');
        return;
    }
    if (!secret && !privateKeyHex) {
        alert('Enter a family seed (secret) or a private key (hex).');
        return;
    }

    const body = secret ? { secret } : { privateKeyHex: privateKeyHex };

    try {
        const response = await fetch('/api/xrpl-import-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (response.ok) {
            const classicAddress = data.classicAddress || data.address || '';
            const payload = secret
                ? { type: 'seed', value: secret, classicAddress, publicKey: data.publicKey, xAddress: data.xAddress || classicAddress }
                : { type: 'privateKey', value: privateKeyHex, classicAddress, publicKey: data.publicKey, xAddress: data.xAddress || classicAddress };
            showOutputWithSeed(
                classicAddress,
                data.publicKey || '',
                data.xAddress || classicAddress || '',
                null,
                true,
                payload
            );
        } else {
            alert(data.error || 'Failed to import account');
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}
