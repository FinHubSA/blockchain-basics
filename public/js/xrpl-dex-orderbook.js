document.addEventListener('DOMContentLoaded', () => {
    const baseCurrencyInput = document.getElementById('baseCurrency');
    const baseIssuerInput = document.getElementById('baseIssuer');
    const counterCurrencyInput = document.getElementById('counterCurrency');
    const counterIssuerInput = document.getElementById('counterIssuer');
    const ledgerIndexInput = document.getElementById('ledgerIndex');
    const wsUrlInput = document.getElementById('wsUrl');
    const loadBtn = document.getElementById('loadOrderbookBtn');
    const summaryEl = document.getElementById('orderbookSummary');
    const sellContainer = document.getElementById('sellOffers');
    const buyContainer = document.getElementById('buyOffers');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const orderAccountInput = document.getElementById('orderAccount');
    const orderSeedInput = document.getElementById('orderSeed');
    const orderSideRadios = document.querySelectorAll('input[name="orderSide"]');
    const orderAmountBaseInput = document.getElementById('orderAmountBase');
    const orderPriceInput = document.getElementById('orderPrice');
    const orderFeeInput = document.getElementById('orderFee');
    const orderStatusEl = document.getElementById('orderStatus');

    if (!loadBtn || !baseCurrencyInput || !counterCurrencyInput || !sellContainer || !buyContainer) {
        return;
    }

    function setSummary(text, isError = false) {
        if (!summaryEl) return;
        summaryEl.textContent = text || '';
        summaryEl.style.color = isError ? '#b00020' : '#444';
    }

    function clearOffers() {
        sellContainer.innerHTML = '';
        buyContainer.innerHTML = '';
    }

    function setOrderStatus(text, isError = false) {
        if (!orderStatusEl) return;
        orderStatusEl.textContent = text || '';
        orderStatusEl.style.color = isError ? '#b00020' : '#444';
    }

    function renderOffers(container, offers, baseLabel, counterLabel) {
        container.innerHTML = '';
        if (!offers || offers.length === 0) {
            const p = document.createElement('p');
            p.style.fontSize = '0.9rem';
            p.style.color = '#666';
            p.textContent = 'No offers in this book.';
            container.appendChild(p);
            return;
        }

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.innerHTML = `
            <thead>
                <tr>
                    <th style="text-align:left;padding:4px 6px;border-bottom:1px solid #ddd;">Price (${counterLabel}/${baseLabel})</th>
                    <th style="text-align:left;padding:4px 6px;border-bottom:1px solid #ddd;">Amount (${baseLabel})</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');

        offers.slice(0, 20).forEach((offer) => {
            const row = document.createElement('tr');
            const gets = offer.TakerGets;
            const pays = offer.TakerPays;

            function asValueAndCurrency(amount) {
                if (typeof amount === 'string') {
                    return { value: parseFloat(amount) / 1_000_000, currency: 'XRP' };
                }
                return { value: parseFloat(amount.value), currency: amount.currency };
            }

            const getsParsed = asValueAndCurrency(gets);
            const paysParsed = asValueAndCurrency(pays);
            let price = NaN;
            if (getsParsed.value && paysParsed.value) {
                price = paysParsed.value / getsParsed.value;
            }

            const priceTd = document.createElement('td');
            priceTd.style.padding = '4px 6px';
            priceTd.textContent = isNaN(price) ? '-' : price.toFixed(6);

            const amountTd = document.createElement('td');
            amountTd.style.padding = '4px 6px';
            amountTd.textContent = getsParsed.value ? getsParsed.value.toFixed(6) : '-';

            row.appendChild(priceTd);
            row.appendChild(amountTd);
            tbody.appendChild(row);
        });

        container.appendChild(table);
    }

    async function fetchOrderbook() {
        const baseCurrency = (baseCurrencyInput.value || '').trim().toUpperCase();
        const baseIssuer = (baseIssuerInput && baseIssuerInput.value || '').trim();
        const counterCurrency = (counterCurrencyInput.value || '').trim().toUpperCase();
        const counterIssuer = (counterIssuerInput && counterIssuerInput.value || '').trim();
        const ledgerIndex = (ledgerIndexInput && ledgerIndexInput.value || '').trim();
        const wsUrl = (wsUrlInput && wsUrlInput.value || '').trim();

        if (!baseCurrency || !counterCurrency) {
            setSummary('Enter both Token 1 and Token 2 currency codes.', true);
            return;
        }

        clearOffers();
        setSummary('Loading order book from XRPL…');

        try {
            const res = await fetch('/api/xrpl-orderbook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseCurrency,
                    baseIssuer,
                    counterCurrency,
                    counterIssuer,
                    ledgerIndex,
                    wsUrl,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to load order book.');
            }

            const effectiveLedger = data.ledger_index || (ledgerIndex || 'validated');
            setSummary(
                `Loaded ${data.sells.length} sell offer(s) and ${data.buys.length} buy offer(s) for ` +
                `${baseCurrency}/${counterCurrency} from ledger ${effectiveLedger}.`
            );

            renderOffers(sellContainer, data.sells, baseCurrency, counterCurrency);
            renderOffers(buyContainer, data.buys, counterCurrency, baseCurrency);
        } catch (err) {
            clearOffers();
            setSummary((err && err.message) ? err.message : String(err), true);
        }
    }

    loadBtn.addEventListener('click', () => {
        fetchOrderbook();
    });

    async function placeOrder() {
        const baseCurrency = (baseCurrencyInput.value || '').trim().toUpperCase();
        const baseIssuer = (baseIssuerInput && baseIssuerInput.value || '').trim();
        const counterCurrency = (counterCurrencyInput.value || '').trim().toUpperCase();
        const counterIssuer = (counterIssuerInput && counterIssuerInput.value || '').trim();
        const wsUrl = (wsUrlInput && wsUrlInput.value || '').trim();

        const account = (orderAccountInput && orderAccountInput.value || '').trim();
        const seed = (orderSeedInput && orderSeedInput.value || '').trim();
        const sideRadio = orderSideRadios && Array.from(orderSideRadios).find(r => r.checked);
        const side = (sideRadio && sideRadio.value) || 'sell-base';
        const amountBase = parseFloat(orderAmountBaseInput && orderAmountBaseInput.value || '0');
        const price = parseFloat(orderPriceInput && orderPriceInput.value || '0');
        const feeDrops = (orderFeeInput && orderFeeInput.value || '12').trim();

        if (!baseCurrency || !counterCurrency) {
            setOrderStatus('Enter Token 1 and Token 2 before placing an order.', true);
            return;
        }
        if (!account || !seed) {
            setOrderStatus('Enter trader account and family seed (Testnet only) to place an order.', true);
            return;
        }
        if (!(amountBase > 0) || !(price > 0)) {
            setOrderStatus('Enter a positive amount and price.', true);
            return;
        }

        function buildAmount(currency, issuer, value) {
            if (currency === 'XRP') {
                // Express XRP in drops
                return String(Math.round(value * 1_000_000));
            }
            const iss = (issuer || '').trim();
            if (!iss) {
                throw new Error(`Issuer required for non-XRP currency ${currency}.`);
            }
            return {
                currency,
                issuer: iss,
                value: String(value),
            };
        }

        let tx;
        try {
            const getsValueBase = amountBase;
            const paysValueBase = amountBase * price;

            if (side === 'sell-base') {
                // Sell Token 1 for Token 2: TakerGets = base, TakerPays = counter
                tx = {
                    TransactionType: 'OfferCreate',
                    Account: account,
                    TakerGets: buildAmount(baseCurrency, baseIssuer, getsValueBase),
                    TakerPays: buildAmount(counterCurrency, counterIssuer, paysValueBase),
                    Fee: feeDrops,
                    Flags: 0,
                };
            } else {
                // Buy Token 1 using Token 2: TakerGets = counter, TakerPays = base
                tx = {
                    TransactionType: 'OfferCreate',
                    Account: account,
                    TakerGets: buildAmount(counterCurrency, counterIssuer, paysValueBase),
                    TakerPays: buildAmount(baseCurrency, baseIssuer, getsValueBase),
                    Fee: feeDrops,
                    Flags: 0,
                };
            }
        } catch (err) {
            setOrderStatus((err && err.message) ? err.message : String(err), true);
            return;
        }

        setOrderStatus('Signing and submitting order to XRPL…');

        try {
            // Sign transaction
            const signRes = await fetch('/api/xrpl-sign-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transaction: tx, secret: seed }),
            });
            const signData = await signRes.json();
            if (!signRes.ok) {
                throw new Error(signData.error || 'Failed to sign order transaction.');
            }

            // Submit to XRPL
            const submitRes = await fetch('/api/xrpl-submit-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tx_blob: signData.tx_blob, wsUrl }),
            });
            const submitData = await submitRes.json();
            if (!submitRes.ok || !submitData.success) {
                throw new Error(submitData.error || 'Failed to submit order transaction.');
            }

            setOrderStatus(
                `Order submitted successfully. Transaction hash: ${submitData.transactionHash || '(unknown)'}.`
            );
            // Reload order book for updated view
            fetchOrderbook();
        } catch (err) {
            setOrderStatus((err && err.message) ? err.message : String(err), true);
        }
    }

    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', () => {
            placeOrder();
        });
    }
});

