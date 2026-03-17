// XRPL Sign Transaction page – same design pattern as Ethereum transaction-signing (HTML inputs)
const XRPL_ACCOUNT_STORAGE_KEY = 'xrpl_create_account';
const DROPS_PER_XRP = 1_000_000;

function loadSavedAccount() {
    try {
        const raw = localStorage.getItem(XRPL_ACCOUNT_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function stringToHex(s) {
    const bytes = new TextEncoder().encode(s);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function buildTransactionFromForm() {
    const account = (document.getElementById('account')?.value || '').trim();
    const destination = (document.getElementById('destination')?.value || '').trim();
    const amountXrp = parseFloat(document.getElementById('amount')?.value || '0', 10);
    const fee = (document.getElementById('fee')?.value || '12').trim();
    const sequence = parseInt(document.getElementById('sequence')?.value || '1', 10);
    const lastLedgerRaw = (document.getElementById('lastLedgerSequence')?.value || '').trim();
    const memoTextareas = Array.from(document.querySelectorAll('.memo-json'));

    const isNft = document.getElementById('isNft')?.checked || false;
    const isSignerList = document.getElementById('isSignerList')?.checked || false;

    if (!account) return null;

    if (isSignerList) {
        const quorumRaw = (document.getElementById('signerQuorum')?.value || '').trim();
        const signerEntryTextareas = Array.from(document.querySelectorAll('.signer-entry-json'));
        const signerEntries = [];

        const quorum = parseInt(quorumRaw || '0', 10);
        if (!quorum || quorum < 1) {
            alert('SignerQuorum must be a positive integer.');
            return null;
        }

        for (const el of signerEntryTextareas) {
            const raw = (el.value || '').trim();
            if (!raw) continue;
            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                alert('Each SignerEntry must be valid JSON. Please fix or clear invalid entries.');
                return null;
            }
            signerEntries.push(parsed);
        }

        if (signerEntries.length === 0) {
            alert('Add at least one SignerEntry JSON object.');
            return null;
        }

        const tx = {
            TransactionType: 'SignerListSet',
            Account: account,
            SignerQuorum: quorum,
            SignerEntries: signerEntries,
            Fee: fee,
            Sequence: sequence
        };

        if (lastLedgerRaw) {
            const lastLedger = parseInt(lastLedgerRaw, 10);
            if (!isNaN(lastLedger) && lastLedger > 0) tx.LastLedgerSequence = lastLedger;
        }

        const memos = [];
        if (memoTextareas.length > 0) {
            for (const el of memoTextareas) {
                const raw = (el.value || '').trim();
                if (!raw) continue;
                let parsed;
                try {
                    parsed = JSON.parse(raw);
                } catch (e) {
                    alert('Each memo must be valid JSON. Please fix or clear invalid memo entries.');
                    return null;
                }
                const jsonString = JSON.stringify(parsed);
                memos.push({
                    Memo: {
                        MemoData: stringToHex(jsonString),
                        MemoFormat: stringToHex('application/json')
                    }
                });
            }
        }
        if (memos.length > 0) {
            tx.Memos = memos;
        }

        return tx;
    }

    if (!destination) return null;
    if (isNaN(amountXrp) || amountXrp < 0) return null;

    const amountDrops = String(Math.round(amountXrp * DROPS_PER_XRP));
    if (amountDrops === '0' && amountXrp > 0) return null;

    const tx = {
        TransactionType: isNft ? 'NFTokenCreateOffer' : 'Payment',
        Account: account,
        Destination: destination,
        Amount: amountDrops,
        Fee: fee,
        Sequence: sequence
    };
    if (lastLedgerRaw) {
        const lastLedger = parseInt(lastLedgerRaw, 10);
        if (!isNaN(lastLedger) && lastLedger > 0) tx.LastLedgerSequence = lastLedger;
    }
    const memos = [];
    if (memoTextareas.length > 0) {
        for (const el of memoTextareas) {
            const raw = (el.value || '').trim();
            if (!raw) continue;
            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                alert('Each memo must be valid JSON. Please fix or clear invalid memo entries.');
                return null;
            }
            const jsonString = JSON.stringify(parsed);
            memos.push({
                Memo: {
                    MemoData: stringToHex(jsonString),
                    MemoFormat: stringToHex('application/json')
                }
            });
        }
    }
    if (memos.length > 0) {
        tx.Memos = memos;
    }
    return tx;
}

document.addEventListener('DOMContentLoaded', () => {
    const accountInput = document.getElementById('account');
    const secretInput = document.getElementById('secretInput');
    const privateKeyInput = document.getElementById('privateKeyInput');
    const signBtn = document.getElementById('signBtn');
    const clearBtn = document.getElementById('clearBtn');
    const transactionOutput = document.getElementById('transactionOutput');
    const txBlobOutput = document.getElementById('txBlobOutput');
    const hashOutput = document.getElementById('hashOutput');
    const copyTxBlobBtn = document.getElementById('copyTxBlobBtn');
    const copyHashBtn = document.getElementById('copyHashBtn');
    const memosContainer = document.getElementById('memosContainer');
    const addMemoBtn = document.getElementById('addMemoBtn');
    const isNftCheckbox = document.getElementById('isNft');
    const nftFields = document.getElementById('nftFields');
    const isSignerListCheckbox = document.getElementById('isSignerList');
    const signerListFields = document.getElementById('signerListFields');
    const transactionTypeInput = document.getElementById('transactionType');
    const signerEntriesContainer = document.getElementById('signerEntriesContainer');
    const addSignerEntryBtn = document.getElementById('addSignerEntryBtn');
    const multiSigModeCheckbox = document.getElementById('multiSigMode');
    const multiSigBlobsWrap = document.getElementById('multiSigBlobsWrap');
    const multiSigBlobsOutput = document.getElementById('multiSigBlobsOutput');
    const combineMultiSigBtn = document.getElementById('combineMultiSigBtn');
    const combinedMultiSigWrap = document.getElementById('combinedMultiSigWrap');
    const combinedTxBlobOutput = document.getElementById('combinedTxBlobOutput');
    const copyCombinedTxBlobBtn = document.getElementById('copyCombinedTxBlobBtn');

    let multiSigTxBlobs = [];

    const saved = loadSavedAccount();
    if (saved && saved.classicAddress) {
        if (accountInput) accountInput.value = saved.classicAddress;
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

    function renderMultiSigBlobs() {
        if (!multiSigBlobsWrap || !multiSigBlobsOutput) return;
        const enabled = !!(multiSigModeCheckbox && multiSigModeCheckbox.checked);
        if (!enabled) {
            multiSigBlobsWrap.style.display = 'none';
            if (combinedMultiSigWrap) combinedMultiSigWrap.style.display = 'none';
            if (combinedTxBlobOutput) combinedTxBlobOutput.textContent = '';
            return;
        }
        multiSigBlobsWrap.style.display = 'block';
        multiSigBlobsOutput.textContent = multiSigTxBlobs.join('\n\n');
        if (combinedMultiSigWrap) combinedMultiSigWrap.style.display = 'none';
        if (combinedTxBlobOutput) combinedTxBlobOutput.textContent = '';
    }

    if (copyTxBlobBtn) copyTxBlobBtn.addEventListener('click', () => copyFromEl('txBlobOutput', copyTxBlobBtn, 'Copy tx_blob'));
    if (copyHashBtn) copyHashBtn.addEventListener('click', () => copyFromEl('hashOutput', copyHashBtn, 'Copy hash'));
    if (copyCombinedTxBlobBtn) copyCombinedTxBlobBtn.addEventListener('click', () => copyFromEl('combinedTxBlobOutput', copyCombinedTxBlobBtn, 'Copy combined tx_blob'));

    if (addMemoBtn && memosContainer) {
        addMemoBtn.addEventListener('click', () => {
            const textarea = document.createElement('textarea');
            textarea.className = 'memo-json';
            textarea.rows = 2;
            textarea.placeholder = '{"invoice_id":"12345","description":"Coffee and Milk","date":"2024-07-02"}';
            textarea.style.marginTop = '8px';
            memosContainer.appendChild(textarea);
        });
    }

    function updateTransactionType() {
        if (!transactionTypeInput) return;
        const isSignerList = !!(isSignerListCheckbox && isSignerListCheckbox.checked);
        const isNft = !!(isNftCheckbox && isNftCheckbox.checked);
        if (isSignerList) transactionTypeInput.value = 'SignerListSet';
        else if (isNft) transactionTypeInput.value = 'NFTokenCreateOffer';
        else transactionTypeInput.value = 'Payment';
    }

    if (isNftCheckbox && nftFields) {
        isNftCheckbox.addEventListener('change', () => {
            nftFields.style.display = isNftCheckbox.checked ? 'block' : 'none';
            if (isNftCheckbox.checked && isSignerListCheckbox) {
                isSignerListCheckbox.checked = false;
                if (signerListFields) signerListFields.style.display = 'none';
            }
            updateTransactionType();
        });
    }

    if (isSignerListCheckbox && signerListFields) {
        isSignerListCheckbox.addEventListener('change', () => {
            signerListFields.style.display = isSignerListCheckbox.checked ? 'block' : 'none';
            if (isSignerListCheckbox.checked && isNftCheckbox) {
                isNftCheckbox.checked = false;
                if (nftFields) nftFields.style.display = 'none';
            }
            updateTransactionType();
        });
    }

    if (addSignerEntryBtn && signerEntriesContainer) {
        addSignerEntryBtn.addEventListener('click', () => {
            const textarea = document.createElement('textarea');
            textarea.className = 'signer-entry-json';
            textarea.rows = 2;
            textarea.placeholder = '{"SignerEntry":{"Account":"r...","SignerWeight":1}}';
            textarea.style.marginTop = '8px';
            signerEntriesContainer.appendChild(textarea);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (accountInput) accountInput.value = '';
            const dest = document.getElementById('destination');
            if (dest) dest.value = '';
            const amount = document.getElementById('amount');
            if (amount) amount.value = '1';
            const fee = document.getElementById('fee');
            if (fee) fee.value = '12';
            const seq = document.getElementById('sequence');
            if (seq) seq.value = '1';
            const lastLedger = document.getElementById('lastLedgerSequence');
            if (lastLedger) lastLedger.value = '';
            if (memosContainer) {
                memosContainer.innerHTML = '';
                const textarea = document.createElement('textarea');
                textarea.className = 'memo-json';
                textarea.rows = 2;
                textarea.placeholder = '{"invoice_id":"12345","description":"Coffee and Milk","date":"2024-07-02"}';
                memosContainer.appendChild(textarea);
            }
            if (secretInput) secretInput.value = '';
            if (privateKeyInput) privateKeyInput.value = '';
            if (secretInput) secretInput.type = 'text';
            if (privateKeyInput) privateKeyInput.type = 'text';
            if (transactionOutput) transactionOutput.style.display = 'none';
            if (txBlobOutput) txBlobOutput.textContent = '';
            if (hashOutput) hashOutput.textContent = '';
            multiSigTxBlobs = [];
            if (multiSigModeCheckbox) multiSigModeCheckbox.checked = false;
            renderMultiSigBlobs();
            if (isNftCheckbox && nftFields) {
                isNftCheckbox.checked = false;
                nftFields.style.display = 'none';
            }
            if (isSignerListCheckbox && signerListFields) {
                isSignerListCheckbox.checked = false;
                signerListFields.style.display = 'none';
            }
            if (signerEntriesContainer) {
                signerEntriesContainer.innerHTML = '';
                const textarea = document.createElement('textarea');
                textarea.className = 'signer-entry-json';
                textarea.rows = 2;
                textarea.placeholder = '{"SignerEntry":{"Account":"r...","SignerWeight":1}}';
                signerEntriesContainer.appendChild(textarea);
            }
            const quorumEl = document.getElementById('signerQuorum');
            if (quorumEl) quorumEl.value = '2';
            updateTransactionType();
            if (saved && saved.classicAddress) {
                accountInput.value = saved.classicAddress;
            }
        });
    }

    if (signBtn) {
        signBtn.addEventListener('click', async () => {
            const transaction = buildTransactionFromForm();
            if (!transaction) {
                alert('Fill in Account, Destination, and a valid Amount (XRP).');
                return;
            }

            let secret = null;
            let privateKeyHex = null;

            secret = (secretInput?.value || '').trim();
            const pk = (privateKeyInput?.value || '').replace(/^0x/i, '').trim();
            if (secret && pk) {
                alert('Enter either family seed or private key, not both.');
                return;
            }
            if (pk) privateKeyHex = pk;

            // If manual inputs are empty and we have saved credentials, use them automatically.
            if (!secret && !privateKeyHex && saved) {
                if (saved.type === 'seed') {
                    secret = saved.value;
                } else if (saved.type === 'privateKey') {
                    privateKeyHex = saved.value;
                }
            }

            if (!secret && !privateKeyHex) {
                alert('No signing key available. Create/import an account first or enter seed/private key.');
                return;
            }

            signBtn.disabled = true;
            try {
                const body = { transaction };
                if (secret) body.secret = secret;
                else body.privateKeyHex = privateKeyHex;

                const response = await fetch('/api/xrpl-sign-transaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await response.json();

                if (response.ok) {
                    txBlobOutput.textContent = data.tx_blob || '';
                    hashOutput.textContent = data.hash || '';
                    transactionOutput.style.display = 'block';

                    if (multiSigModeCheckbox && multiSigModeCheckbox.checked && data.tx_blob) {
                        multiSigTxBlobs.push(data.tx_blob);
                        renderMultiSigBlobs();
                    }
                } else {
                    alert(data.error || 'Failed to sign transaction');
                }
            } catch (err) {
                alert('Error: ' + err.message);
            } finally {
                signBtn.disabled = false;
            }
        });
    }

    if (multiSigModeCheckbox) {
        multiSigModeCheckbox.addEventListener('change', () => {
            if (!multiSigModeCheckbox.checked) {
                multiSigTxBlobs = [];
            }
            renderMultiSigBlobs();
        });
    }

    if (combineMultiSigBtn) {
        combineMultiSigBtn.addEventListener('click', async () => {
            if (multiSigTxBlobs.length < 2) {
                alert('Collect at least 2 signed tx_blobs before combining.');
                return;
            }
            try {
                const res = await fetch('/api/xrpl-multisign-combine', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tx_blobs: multiSigTxBlobs })
                });
                const out = await res.json();
                if (!res.ok) {
                    alert(out.error || 'Failed to combine multi-sig tx_blobs.');
                    return;
                }
                if (combinedTxBlobOutput) combinedTxBlobOutput.textContent = out.combinedTxBlob || '';
                if (combinedMultiSigWrap) combinedMultiSigWrap.style.display = 'block';
            } catch (err) {
                alert('Error: ' + err.message);
            }
        });
    }

    updateTransactionType();
    renderMultiSigBlobs();
});
