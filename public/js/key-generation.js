// Key generation page functionality
let currentKeyPair = null;
const STORAGE_KEY = 'blockchain_tutorial_keypair';
const SIGNED_MESSAGE_KEY = 'blockchain_tutorial_signed_message';

document.addEventListener('DOMContentLoaded', () => {
    initializeKeyGenerationPage();
    // Load stored keys and recalculate signature if message exists
    loadStoredKeysAndRecalculateSignature();
});

function initializeKeyGenerationPage() {
    const generateBtn = document.getElementById('generateBtn');
    const clearKeyPairBtn = document.getElementById('clearKeyPairBtn');
    const signBtn = document.getElementById('signBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const copyCurrentPrivateKeyBtn = document.getElementById('copyCurrentPrivateKeyBtn');
    const copyCurrentPublicKeyBtn = document.getElementById('copyCurrentPublicKeyBtn');
    const copyCurrentAddressBtn = document.getElementById('copyCurrentAddressBtn');

    if (generateBtn) {
        generateBtn.addEventListener('click', generateKeyPair);
    }

    if (clearKeyPairBtn) {
        clearKeyPairBtn.addEventListener('click', clearKeyPair);
    }

    const importKeyPairBtn = document.getElementById('importKeyPairBtn');
    if (importKeyPairBtn) {
        importKeyPairBtn.addEventListener('click', importKeyPair);
    }

    const showImportSection = document.getElementById('showImportSection');
    const importKeyPairSection = document.getElementById('importKeyPairSection');
    if (showImportSection && importKeyPairSection && generateBtn) {
        showImportSection.addEventListener('change', () => {
            const isImport = showImportSection.checked;
            importKeyPairSection.style.display = isImport ? 'block' : 'none';
            generateBtn.disabled = isImport;
        });
        generateBtn.disabled = showImportSection.checked;
    }

    const importPrivateKeyShow = document.getElementById('importPrivateKeyShow');
    const importPrivateKeyInput = document.getElementById('importPrivateKey');
    if (importPrivateKeyShow && importPrivateKeyInput) {
        importPrivateKeyShow.addEventListener('change', () => {
            importPrivateKeyInput.type = importPrivateKeyShow.checked ? 'text' : 'password';
        });
    }

    if (signBtn) {
        signBtn.addEventListener('click', signMessage);
    }

    if (verifyBtn) {
        verifyBtn.addEventListener('click', verifySignature);
    }

    if (copyCurrentPrivateKeyBtn) {
        copyCurrentPrivateKeyBtn.addEventListener('click', (e) => copyToClipboard('privateKeyOutput', e.target));
    }

    if (copyCurrentPublicKeyBtn) {
        copyCurrentPublicKeyBtn.addEventListener('click', (e) => copyToClipboard('publicKeyOutput', e.target));
    }

    if (copyCurrentAddressBtn) {
        copyCurrentAddressBtn.addEventListener('click', (e) => copyToClipboard('addressOutput', e.target));
    }

    // Clear buttons
    setupClearButtons();
}

function setupClearButtons() {
    const clearSignBtn = document.getElementById('clearSignBtn');
    const clearVerifyBtn = document.getElementById('clearVerifyBtn');

    if (clearSignBtn) {
        clearSignBtn.addEventListener('click', () => {
            document.getElementById('signMessage').value = '';
            document.getElementById('signOutput').style.display = 'none';
            // Note: Don't clear the private key input - it should remain filled
            // Clear signed message from localStorage
            localStorage.removeItem(SIGNED_MESSAGE_KEY);
        });
    }

    if (clearVerifyBtn) {
        clearVerifyBtn.addEventListener('click', () => {
            document.getElementById('verifyMessage').value = '';
            document.getElementById('verifySignature').value = '';
            document.getElementById('verifyOutput').style.display = 'none';
            // Note: Don't clear the public key input - it should remain filled
        });
    }
}

async function generateKeyPair() {
    try {
        const response = await fetch('/api/generate-keypair', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            currentKeyPair = data;
            
            loadKeyPairIntoDisplay(data);
            
            // Save to localStorage
            saveKeysToStorage(data);
        } else {
            alert('Error generating key pair: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function loadKeyPairIntoDisplay(keyPair) {
    document.getElementById('privateKeyOutput').textContent = '0x' + keyPair.privateKey;
    document.getElementById('publicKeyOutput').textContent = '0x' + keyPair.publicKey;
    document.getElementById('addressOutput').textContent = keyPair.ethereumAddress;
    document.getElementById('keyPairOutput').style.display = 'block';
    
    // Auto-fill private key in signing section
    const signPrivateKeyInput = document.getElementById('signPrivateKey');
    if (signPrivateKeyInput) {
        signPrivateKeyInput.value = '0x' + keyPair.privateKey;
    }
    
    // Auto-fill public key in verification section
    const verifyPublicKeyInput = document.getElementById('verifyPublicKey');
    if (verifyPublicKeyInput) {
        verifyPublicKeyInput.value = '0x' + keyPair.publicKey;
    }
    
    // Enable buttons that require a key pair
    document.getElementById('signBtn').disabled = false;
}

function saveKeysToStorage(keyPair) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(keyPair));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function displaySignature(data) {
    document.getElementById('messageHashOutput').textContent = '0x' + data.messageHash;
    document.getElementById('signatureROutput').textContent = '0x' +data.signature.r;
    document.getElementById('signatureSOutput').textContent = '0x' +data.signature.s;
    document.getElementById('signatureFullOutput').textContent = '0x' +data.signature.full;
    document.getElementById('signOutput').style.display = 'block';
}

function saveSignedMessage(message) {
    try {
        localStorage.setItem(SIGNED_MESSAGE_KEY, message);
    } catch (error) {
        console.error('Error saving signed message to localStorage:', error);
    }
}

async function loadStoredKeysAndRecalculateSignature() {
    try {
        // First, check if there are keys in localStorage and update currentKeyPair
        const storedKeys = localStorage.getItem(STORAGE_KEY);
        if (storedKeys) {
            try {
                const keyPair = JSON.parse(storedKeys);
                currentKeyPair = keyPair;
                // Ensure keys are displayed if not already
                if (!document.getElementById('keyPairOutput').style.display || 
                    document.getElementById('keyPairOutput').style.display === 'none') {
                    loadKeyPairIntoDisplay(keyPair);
                }
                
                // Check if there's a stored message that was signed
                const storedMessage = localStorage.getItem(SIGNED_MESSAGE_KEY);
                if (storedMessage && currentKeyPair) {
                    // Recalculate signature from stored message and keys
                    document.getElementById('signMessage').value = storedMessage;
                    await recalculateSignature(storedMessage);
                }
            } catch (error) {
                console.error('Error loading stored keys:', error);
            }
        }
    } catch (error) {
        console.error('Error loading stored keys and recalculating signature:', error);
    }
}

async function recalculateSignature(message) {
    if (!message) {
        return;
    }

    // Get private key from input field or fallback to currentKeyPair
    const signPrivateKeyInput = document.getElementById('signPrivateKey');
    let privateKeyHex = '';
    
    if (signPrivateKeyInput && signPrivateKeyInput.value) {
        // Remove 0x prefix if present
        privateKeyHex = signPrivateKeyInput.value.startsWith('0x') 
            ? signPrivateKeyInput.value.slice(2) 
            : signPrivateKeyInput.value;
    } else if (currentKeyPair) {
        privateKeyHex = currentKeyPair.privateKey;
    } else {
        return; // No key available
    }

    try {
        const response = await fetch('/api/sign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                privateKeyHex: privateKeyHex
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Display the recalculated signature
            displaySignature(data);
            
            // Auto-fill verify fields
            document.getElementById('verifyMessage').value = message;
            document.getElementById('verifySignature').value = data.signature.full;
            document.getElementById('verifyBtn').disabled = false;
        }
    } catch (error) {
        console.error('Error recalculating signature:', error);
    }
}

async function importKeyPair() {
    const input = document.getElementById('importPrivateKey');
    if (!input) return;
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
            currentKeyPair = data;
            loadKeyPairIntoDisplay(data);
            saveKeysToStorage(data);
            input.value = ''; // Clear the import field after successful import
            const showCheckbox = document.getElementById('importPrivateKeyShow');
            if (showCheckbox) {
                showCheckbox.checked = false;
                input.type = 'password';
            }
        } else {
            alert('Error importing key: ' + (data.error || response.statusText));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function clearKeyPair() {
    if (confirm('Are you sure you want to clear the current key pair and remove it from storage? This action cannot be undone.')) {
        try {
            // Clear current display
            currentKeyPair = null;
            document.getElementById('keyPairOutput').style.display = 'none';
            
            // Clear private key input in signing section
            const signPrivateKeyInput = document.getElementById('signPrivateKey');
            if (signPrivateKeyInput) {
                signPrivateKeyInput.value = '';
            }
            
            // Clear public key input in verification section
            const verifyPublicKeyInput = document.getElementById('verifyPublicKey');
            if (verifyPublicKeyInput) {
                verifyPublicKeyInput.value = '';
            }
            
            // Clear localStorage
            localStorage.removeItem(STORAGE_KEY);
            // Also clear signed message when clearing key pair
            localStorage.removeItem(SIGNED_MESSAGE_KEY);
            
            // Disable buttons that require a key pair
            document.getElementById('signBtn').disabled = true;
            
            alert('Key pair cleared successfully!');
        } catch (error) {
            alert('Error clearing key pair: ' + error.message);
        }
    }
}

function copyToClipboard(elementId, button) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        // Show feedback
        if (button) {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.backgroundColor = '#27ae60';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '';
            }, 2000);
        }
    } catch (err) {
        // Try modern clipboard API
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                if (button) {
                    const originalText = button.textContent;
                    button.textContent = 'Copied!';
                    button.style.backgroundColor = '#27ae60';
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.backgroundColor = '';
                    }, 2000);
                }
            }).catch(() => {
                alert('Failed to copy to clipboard');
            });
        } else {
            alert('Failed to copy: ' + err);
        }
    }
    
    document.body.removeChild(textarea);
}

async function signMessage() {
    const message = document.getElementById('signMessage').value;
    if (!message) {
        alert('Please enter a message to sign!');
        return;
    }

    // Get private key from input field or fallback to currentKeyPair
    const signPrivateKeyInput = document.getElementById('signPrivateKey');
    let privateKeyHex = '';
    
    if (signPrivateKeyInput && signPrivateKeyInput.value) {
        // Remove 0x prefix if present
        privateKeyHex = signPrivateKeyInput.value.startsWith('0x') 
            ? signPrivateKeyInput.value.slice(2) 
            : signPrivateKeyInput.value;
    } else if (currentKeyPair) {
        privateKeyHex = currentKeyPair.privateKey;
    } else {
        alert('Please generate a key pair first or enter a private key!');
        return;
    }

    // Validate private key format
    if (!privateKeyHex.match(/^[a-fA-F0-9]{64}$/)) {
        alert('Invalid private key format. Must be 64 hexadecimal characters (with or without 0x prefix)');
        return;
    }

    try {
        const response = await fetch('/api/sign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                privateKeyHex: privateKeyHex
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Display signature
            displaySignature(data);
            
            // Save only the message to localStorage (signature will be recalculated)
            saveSignedMessage(message);
            
            // Auto-fill verify fields
            document.getElementById('verifyMessage').value = message;
            document.getElementById('verifySignature').value = data.signature.full;
            document.getElementById('verifyBtn').disabled = false;
        } else {
            alert('Error signing message: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function verifySignature() {
    const message = document.getElementById('verifyMessage').value;
    const signature = document.getElementById('verifySignature').value;

    if (!message || !signature) {
        alert('Please enter both message and signature!');
        return;
    }

    // Get public key from input field or fallback to currentKeyPair
    const verifyPublicKeyInput = document.getElementById('verifyPublicKey');
    let publicKeyHex = '';
    
    if (verifyPublicKeyInput && verifyPublicKeyInput.value) {
        // Remove 0x prefix if present
        publicKeyHex = verifyPublicKeyInput.value.startsWith('0x') 
            ? verifyPublicKeyInput.value.slice(2) 
            : verifyPublicKeyInput.value;
    } else if (currentKeyPair) {
        publicKeyHex = currentKeyPair.publicKey;
    } else {
        alert('Please generate a key pair first or enter a public key!');
        return;
    }

    // Validate public key format (should be 130 hex chars for uncompressed: 0x04 + 64 bytes = 130 chars)
    // Or 66 chars for compressed (0x02/0x03 + 32 bytes)
    const cleanPublicKey = publicKeyHex.startsWith('0x') ? publicKeyHex.slice(2) : publicKeyHex;
    if (cleanPublicKey.length !== 130 && cleanPublicKey.length !== 66) {
        alert('Invalid public key format. Must be 66 or 130 hexadecimal characters (compressed or uncompressed)');
        return;
    }

    try {
        const response = await fetch('/api/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                signatureHex: signature,
                publicKeyHex: publicKeyHex
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            const resultBox = document.getElementById('verifyResultOutput');
            if (data.isValid) {
                resultBox.style.backgroundColor = '#27ae60';
                resultBox.textContent = '✓ Signature is VALID - The message was signed by the holder of the private key!';
            } else {
                resultBox.style.backgroundColor = '#e74c3c';
                resultBox.textContent = '✗ Signature is INVALID - The message was NOT signed by the holder of the private key!';
            }
            document.getElementById('verifyOutput').style.display = 'block';
        } else {
            alert('Error verifying signature: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}


