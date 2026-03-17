document.addEventListener('DOMContentLoaded', () => {
    const coldInput = document.getElementById('coldAddress');
    const hotInput = document.getElementById('hotAddress');
    const currencyInput = document.getElementById('currencyCode');
    const amountInput = document.getElementById('issueAmount');
    const stepsList = document.getElementById('fungibleStepsList');
    const messageEl = document.getElementById('fungibleStepsMessage');

    if (!stepsList) return;

    const state = {
        coldActive: false,
        coldDefaultRipple: false,
        hotActive: false,
        trustLineDone: false,
        issueDone: false,
    };

    function setMessage(text, isError = false) {
        if (!messageEl) return;
        messageEl.textContent = text || '';
        messageEl.style.color = isError ? '#b00020' : '#444';
    }

    function updateStepStatus() {
        const stepEls = stepsList.querySelectorAll('.xrpl-step');
        stepEls.forEach((li) => {
            const id = li.getAttribute('data-step-id');
            if (!id) return;

            let done = false;
            if (id === 'check-cold') done = state.coldActive && state.coldDefaultRipple;
            if (id === 'check-hot') done = state.hotActive;
            if (id === 'trust-line') done = state.trustLineDone;
            if (id === 'issue-token') done = state.issueDone;

            if (done) li.classList.add('done');
            else li.classList.remove('done');
        });
    }

    async function fetchAccountInfo(addressRaw) {
        const address = (addressRaw || '').trim();
        if (!address) {
            throw new Error('Address is required.');
        }
        const res = await fetch('/api/xrpl-account-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classicAddress: address }),
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Failed to query XRPL account.');
        }
        return data;
    }

    async function handleCheckCold() {
        try {
            setMessage('Checking cold (issuer) account and settings on XRPL...');
            const info = await fetchAccountInfo(coldInput && coldInput.value);
            if (!info.active) {
                state.coldActive = false;
                state.coldDefaultRipple = false;
                updateStepStatus();
                setMessage('Cold account is not active on XRPL (no account root found).', true);
                return;
            }
            state.coldActive = true;
            state.coldDefaultRipple = !!info.defaultRippleEnabled;
            updateStepStatus();
            if (!info.defaultRippleEnabled) {
                setMessage(
                    `Cold account is active with balance ${info.balance} XRP, but Default Ripple is not enabled. ` +
                    'For most token issuers, enabling Default Ripple on the cold/issuer account is recommended.',
                    true
                );
            } else {
                setMessage(`Cold account is active, Default Ripple is enabled, balance ${info.balance} XRP.`);
            }
        } catch (err) {
            state.coldActive = false;
            state.coldDefaultRipple = false;
            updateStepStatus();
            setMessage(err.message || String(err), true);
        }
    }

    async function handleCheckHot() {
        try {
            setMessage('Checking hot account on XRPL...');
            const info = await fetchAccountInfo(hotInput && hotInput.value);
            if (!info.active) {
                state.hotActive = false;
                updateStepStatus();
                setMessage('Hot account is not active on XRPL (no account root found).', true);
                return;
            }
            state.hotActive = true;
            updateStepStatus();
            setMessage(`Hot account is active with balance ${info.balance} XRP.`);
        } catch (err) {
            state.hotActive = false;
            updateStepStatus();
            setMessage(err.message || String(err), true);
        }
    }

    function requireBasicInputs() {
        const cold = (coldInput && coldInput.value || '').trim();
        const hot = (hotInput && hotInput.value || '').trim();
        const currency = (currencyInput && currencyInput.value || '').trim();
        const amount = (amountInput && amountInput.value || '').trim();
        if (!cold || !hot || !currency || !amount) {
            setMessage('Enter cold address, hot address, currency code, and amount before marking this step.', true);
            return false;
        }
        return true;
    }

    function handleMarkTrustLine() {
        if (!requireBasicInputs()) return;
        state.trustLineDone = true;
        updateStepStatus();
        const currency = (currencyInput && currencyInput.value || '').trim();
        setMessage(`Marked: trust line from hot to cold created for ${currency}.`);
    }

    function handleMarkIssue() {
        if (!requireBasicInputs()) return;
        state.issueDone = true;
        updateStepStatus();
        const currency = (currencyInput && currencyInput.value || '').trim();
        const amount = (amountInput && amountInput.value || '').trim();
        setMessage(`Marked: issued ${amount} ${currency} from cold to hot.`);
    }

    stepsList.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (!target.classList.contains('step-action')) return;
        const action = target.getAttribute('data-action');
        if (!action) return;

        if (action === 'check-cold') {
            handleCheckCold();
        } else if (action === 'check-hot') {
            handleCheckHot();
        } else if (action === 'mark-trust-line') {
            handleMarkTrustLine();
        } else if (action === 'mark-issue') {
            handleMarkIssue();
        }
    });

    updateStepStatus();
});

