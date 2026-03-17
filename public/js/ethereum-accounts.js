// Get or Import Address page: import account from private key
document.addEventListener('DOMContentLoaded', () => {
    const importBtn = document.getElementById('importBtn');
    const clearImportBtn = document.getElementById('clearImportBtn');
    const importPrivateKeyInput = document.getElementById('importPrivateKey');
    const importPrivateKeyShow = document.getElementById('importPrivateKeyShow');
    const importOutputSection = document.getElementById('importOutputSection');
    const copyPublicKeyBtn = document.getElementById('copyPublicKeyBtn');
    const copyImportAddressBtn = document.getElementById('copyImportAddressBtn');
    const importPublicKeyOutput = document.getElementById('importPublicKeyOutput');
    const importAddressOutput = document.getElementById('importAddressOutput');

    if (importBtn) importBtn.addEventListener('click', importFromPrivateKey);
    if (clearImportBtn) {
        clearImportBtn.addEventListener('click', () => {
            if (importPrivateKeyInput) importPrivateKeyInput.value = '';
            if (importOutputSection) importOutputSection.style.display = 'none';
            if (importPrivateKeyShow) importPrivateKeyShow.checked = false;
            if (importPrivateKeyInput) importPrivateKeyInput.type = 'password';
        });
    }
    if (importPrivateKeyShow && importPrivateKeyInput) {
        importPrivateKeyShow.addEventListener('change', () => {
            importPrivateKeyInput.type = importPrivateKeyShow.checked ? 'text' : 'password';
        });
    }
    if (copyPublicKeyBtn && importPublicKeyOutput) {
        copyPublicKeyBtn.addEventListener('click', () => copyToClipboardFromEl(importPublicKeyOutput, copyPublicKeyBtn, 'Copy Public Key'));
    }
    if (copyImportAddressBtn && importAddressOutput) {
        copyImportAddressBtn.addEventListener('click', () => copyToClipboardFromEl(importAddressOutput, copyImportAddressBtn, 'Copy Address'));
    }
});

function copyToClipboardFromEl(element, button, defaultLabel) {
    if (!element) return;
    const text = element.textContent;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            if (button) {
                button.textContent = 'Copied!';
                setTimeout(() => { button.textContent = defaultLabel; }, 2000);
            }
        }).catch(() => alert('Failed to copy'));
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            if (button) {
                button.textContent = 'Copied!';
                setTimeout(() => { button.textContent = defaultLabel; }, 2000);
            }
        } catch (e) { alert('Failed to copy'); }
        document.body.removeChild(ta);
    }
}

async function importFromPrivateKey() {
    const input = document.getElementById('importPrivateKey');
    const importOutputSection = document.getElementById('importOutputSection');
    const importPublicKeyOutput = document.getElementById('importPublicKeyOutput');
    const importAddressOutput = document.getElementById('importAddressOutput');
    if (!input || !importOutputSection || !importPublicKeyOutput || !importAddressOutput) return;

    let privateKeyHex = (input.value || '').replace(/^0x/i, '').trim();
    if (privateKeyHex.length !== 64 || !/^[a-fA-F0-9]+$/.test(privateKeyHex)) {
        alert('Invalid private key. Enter 64 hexadecimal characters (with or without 0x prefix).');
        return;
    }

    try {
        const response = await fetch('/api/import-keypair', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ privateKeyHex: privateKeyHex })
        });
        const data = await response.json();
        if (response.ok) {
            importPublicKeyOutput.textContent = '0x' + data.publicKey;
            importAddressOutput.textContent = data.ethereumAddress;
            importOutputSection.style.display = 'block';
        } else {
            alert(data.error || 'Failed to import key');
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}
