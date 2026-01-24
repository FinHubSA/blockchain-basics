// Page content templates
const pages = {
    intro: {
        title: 'Introduction to Public Key Cryptography',
        content: `
            <div class="page-content">
                <h2>What is Public Key Cryptography?</h2>
                
                <p>
                    Public Key Cryptography, also known as asymmetric cryptography, is a cryptographic system 
                    that uses pairs of keys: a public key and a private key. These keys are mathematically 
                    related but cannot be derived from each other easily.
                </p>

                <div class="info-box">
                    <strong>Key Concept:</strong> The public key can be shared openly, while the private key 
                    must be kept secret. This fundamental property enables secure communication and digital 
                    signatures without requiring a shared secret beforehand.
                </div>

                <h3>How It Works</h3>
                <p>
                    In public key cryptography:
                </p>
                <ul>
                    <li><strong>Public Key:</strong> Can be freely distributed and used to encrypt messages 
                    or verify signatures. Anyone can have access to this key.</li>
                    <li><strong>Private Key:</strong> Must be kept secret. It's used to decrypt messages 
                    encrypted with the corresponding public key, or to create digital signatures.</li>
                </ul>

                <h3>Key Properties</h3>
                <ol>
                    <li><strong>One-way Function:</strong> It's computationally infeasible to derive the 
                    private key from the public key.</li>
                    <li><strong>Mathematical Relationship:</strong> The keys are mathematically linked, 
                    allowing operations performed with one key to be verified or reversed with the other.</li>
                    <li><strong>Security:</strong> The security relies on mathematical problems that are 
                    difficult to solve, such as the discrete logarithm problem in elliptic curve cryptography.</li>
                </ol>

                <h3>Common Use Cases</h3>
                <ul>
                    <li><strong>Encryption:</strong> Encrypt data with a public key so only the holder of 
                    the private key can decrypt it.</li>
                    <li><strong>Digital Signatures:</strong> Sign data with a private key so anyone with the 
                    public key can verify the signature's authenticity.</li>
                    <li><strong>Authentication:</strong> Prove identity without revealing the private key.</li>
                </ul>

                <h3>Elliptic Curve Cryptography (ECC)</h3>
                <p>
                    Ethereum uses <strong>secp256k1</strong>, a specific elliptic curve defined by the 
                    Standards for Efficient Cryptography Group (SECG). This curve is also used by Bitcoin.
                </p>
                <p>
                    Advantages of ECC:
                </p>
                <ul>
                    <li>Smaller key sizes for equivalent security compared to RSA</li>
                    <li>Faster computation</li>
                    <li>Lower memory and bandwidth requirements</li>
                </ul>

                <div class="warning-box">
                    <strong>Important:</strong> Never share your private key! If someone gains access to 
                    your private key, they can impersonate you and access all your assets.
                </div>
            </div>
        `
    },
    'key-generation': {
        title: 'Key Generation & Operations',
        content: `
            <div class="page-content">
                <h2>secp256k1 Key Pair Generation</h2>
                
                <p>
                    This page demonstrates how to generate Ethereum-compatible key pairs using the secp256k1 
                    elliptic curve and perform encryption and digital signing operations.
                </p>

                <div class="card">
                    <h3>Generate Key Pair</h3>
                    <p>Click the button below to generate a new secp256k1 key pair:</p>
                    <button class="button" id="generateBtn">Generate New Key Pair</button>
                    
                    <div id="keyPairOutput" style="display: none;">
                        <span class="output-label">Private Key (Keep Secret!):</span>
                        <div class="output-box" id="privateKeyOutput"></div>
                        
                        <span class="output-label">Public Key:</span>
                        <div class="output-box" id="publicKeyOutput"></div>
                        
                        <span class="output-label">Ethereum Address:</span>
                        <div class="output-box" id="addressOutput"></div>
                    </div>
                </div>

                <div class="card">
                    <h3>Digital Signing</h3>
                    <p>Sign a message using your private key. The signature can be verified by anyone with your public key.</p>
                    
                    <div class="input-group">
                        <label for="signMessage">Message to Sign:</label>
                        <textarea id="signMessage" placeholder="Enter a message to sign...">Hello, Blockchain!</textarea>
                    </div>
                    
                    <button class="button" id="signBtn" disabled>Sign Message</button>
                    <button class="button button-secondary" id="clearSignBtn">Clear</button>
                    
                    <div id="signOutput" style="display: none;">
                        <span class="output-label">Message Hash:</span>
                        <div class="output-box" id="messageHashOutput"></div>
                        
                        <span class="output-label">Signature (r):</span>
                        <div class="output-box" id="signatureROutput"></div>
                        
                        <span class="output-label">Signature (s):</span>
                        <div class="output-box" id="signatureSOutput"></div>
                        
                        <span class="output-label">Full Signature:</span>
                        <div class="output-box" id="signatureFullOutput"></div>
                    </div>
                </div>

                <div class="card">
                    <h3>Signature Verification</h3>
                    <p>Verify a signature using the public key. This demonstrates how anyone can verify the authenticity of a signed message.</p>
                    
                    <div class="input-group">
                        <label for="verifyMessage">Original Message:</label>
                        <textarea id="verifyMessage" placeholder="Enter the original message..."></textarea>
                    </div>
                    
                    <div class="input-group">
                        <label for="verifySignature">Signature (hex):</label>
                        <input type="text" id="verifySignature" placeholder="Paste the full signature here...">
                    </div>
                    
                    <button class="button" id="verifyBtn" disabled>Verify Signature</button>
                    <button class="button button-secondary" id="clearVerifyBtn">Clear</button>
                    
                    <div id="verifyOutput" style="display: none;">
                        <div class="output-box" id="verifyResultOutput"></div>
                    </div>
                </div>

                <div class="card">
                    <h3>Encryption & Decryption</h3>
                    <p>Encrypt a message using the public key. Only the holder of the corresponding private key can decrypt it.</p>
                    
                    <div class="input-group">
                        <label for="encryptMessage">Message to Encrypt:</label>
                        <textarea id="encryptMessage" placeholder="Enter a message to encrypt...">Secret message</textarea>
                    </div>
                    
                    <button class="button" id="encryptBtn" disabled>Encrypt Message</button>
                    <button class="button button-secondary" id="clearEncryptBtn">Clear</button>
                    
                    <div id="encryptOutput" style="display: none;">
                        <span class="output-label">Encrypted Data:</span>
                        <div class="output-box" id="encryptedOutput"></div>
                        
                        <span class="output-label">Initialization Vector (IV):</span>
                        <div class="output-box" id="ivOutput"></div>
                    </div>

                    <div style="margin-top: 30px;">
                        <h4>Decrypt Message</h4>
                        <p>Use the encrypted data and IV from above to decrypt the message.</p>
                        
                        <div class="input-group">
                            <label for="decryptData">Encrypted Data:</label>
                            <textarea id="decryptData" placeholder="Paste encrypted data here..."></textarea>
                        </div>
                        
                        <div class="input-group">
                            <label for="decryptIV">Initialization Vector (IV):</label>
                            <input type="text" id="decryptIV" placeholder="Paste IV here...">
                        </div>
                        
                        <button class="button" id="decryptBtn" disabled>Decrypt Message</button>
                        <button class="button button-secondary" id="clearDecryptBtn">Clear</button>
                        
                        <div id="decryptOutput" style="display: none;">
                            <span class="output-label">Decrypted Message:</span>
                            <div class="output-box" id="decryptedOutput"></div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
};

// State management
let currentKeyPair = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    loadPage('intro');
    initializeKeyGenerationPage();
});

// Navigation functionality
function initializeNavigation() {
    const menuToggle = document.getElementById('menuToggle');
    const drawer = document.getElementById('drawer');
    const navItems = document.querySelectorAll('.nav-item');

    // Menu toggle for mobile
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            drawer.classList.toggle('open');
        });
    }

    // Main item click (expand/collapse submenu)
    document.querySelectorAll('.nav-item.main-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const topic = item.dataset.topic;
            const submenu = document.getElementById(`${topic}-submenu`);
            const arrow = item.querySelector('.nav-arrow');
            
            if (submenu) {
                submenu.classList.toggle('expanded');
                item.classList.toggle('expanded');
            }
        });
    });

    // Sub item click (load page)
    document.querySelectorAll('.nav-item.sub-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const page = item.dataset.page;
            if (page) {
                // Update active state
                document.querySelectorAll('.nav-item.sub-item').forEach(nav => {
                    nav.classList.remove('active');
                });
                item.classList.add('active');
                
                // Load page
                loadPage(page);
                
                // Close drawer on mobile
                if (window.innerWidth <= 768) {
                    drawer.classList.remove('open');
                }
            }
        });
    });

    // Expand the first topic by default
    const firstSubmenu = document.getElementById('public-key-crypto-submenu');
    const firstMainItem = document.querySelector('[data-topic="public-key-crypto"]');
    if (firstSubmenu && firstMainItem) {
        firstSubmenu.classList.add('expanded');
        firstMainItem.classList.add('expanded');
    }
}

// Load page content
function loadPage(pageId) {
    const page = pages[pageId];
    if (!page) return;

    document.getElementById('pageTitle').textContent = page.title;
    document.getElementById('contentBody').innerHTML = page.content;

    // Reinitialize page-specific functionality
    if (pageId === 'key-generation') {
        initializeKeyGenerationPage();
    }
}

// Key generation page functionality
function initializeKeyGenerationPage() {
    const generateBtn = document.getElementById('generateBtn');
    const signBtn = document.getElementById('signBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');

    if (generateBtn) {
        generateBtn.addEventListener('click', generateKeyPair);
    }

    if (signBtn) {
        signBtn.addEventListener('click', signMessage);
    }

    if (verifyBtn) {
        verifyBtn.addEventListener('click', verifySignature);
    }

    if (encryptBtn) {
        encryptBtn.addEventListener('click', encryptMessage);
    }

    if (decryptBtn) {
        decryptBtn.addEventListener('click', decryptMessage);
    }

    // Clear buttons
    setupClearButtons();
}

function setupClearButtons() {
    const clearSignBtn = document.getElementById('clearSignBtn');
    const clearVerifyBtn = document.getElementById('clearVerifyBtn');
    const clearEncryptBtn = document.getElementById('clearEncryptBtn');
    const clearDecryptBtn = document.getElementById('clearDecryptBtn');

    if (clearSignBtn) {
        clearSignBtn.addEventListener('click', () => {
            document.getElementById('signMessage').value = '';
            document.getElementById('signOutput').style.display = 'none';
        });
    }

    if (clearVerifyBtn) {
        clearVerifyBtn.addEventListener('click', () => {
            document.getElementById('verifyMessage').value = '';
            document.getElementById('verifySignature').value = '';
            document.getElementById('verifyOutput').style.display = 'none';
        });
    }

    if (clearEncryptBtn) {
        clearEncryptBtn.addEventListener('click', () => {
            document.getElementById('encryptMessage').value = '';
            document.getElementById('encryptOutput').style.display = 'none';
        });
    }

    if (clearDecryptBtn) {
        clearDecryptBtn.addEventListener('click', () => {
            document.getElementById('decryptData').value = '';
            document.getElementById('decryptIV').value = '';
            document.getElementById('decryptOutput').style.display = 'none';
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
            
            document.getElementById('privateKeyOutput').textContent = '0x' + data.privateKey;
            document.getElementById('publicKeyOutput').textContent = '0x' + data.publicKey;
            document.getElementById('addressOutput').textContent = data.ethereumAddress;
            document.getElementById('keyPairOutput').style.display = 'block';
            
            // Enable buttons that require a key pair
            document.getElementById('signBtn').disabled = false;
            document.getElementById('encryptBtn').disabled = false;
            document.getElementById('decryptBtn').disabled = false;
        } else {
            alert('Error generating key pair: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function signMessage() {
    if (!currentKeyPair) {
        alert('Please generate a key pair first!');
        return;
    }

    const message = document.getElementById('signMessage').value;
    if (!message) {
        alert('Please enter a message to sign!');
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
                privateKeyHex: currentKeyPair.privateKey
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('messageHashOutput').textContent = '0x' + data.messageHash;
            document.getElementById('signatureROutput').textContent = data.signature.r;
            document.getElementById('signatureSOutput').textContent = data.signature.s;
            document.getElementById('signatureFullOutput').textContent = data.signature.full;
            document.getElementById('signOutput').style.display = 'block';
            
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
    if (!currentKeyPair) {
        alert('Please generate a key pair first!');
        return;
    }

    const message = document.getElementById('verifyMessage').value;
    const signature = document.getElementById('verifySignature').value;

    if (!message || !signature) {
        alert('Please enter both message and signature!');
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
                publicKeyHex: currentKeyPair.publicKey
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

async function encryptMessage() {
    if (!currentKeyPair) {
        alert('Please generate a key pair first!');
        return;
    }

    const message = document.getElementById('encryptMessage').value;
    if (!message) {
        alert('Please enter a message to encrypt!');
        return;
    }

    try {
        const response = await fetch('/api/encrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                publicKeyHex: currentKeyPair.publicKey
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('encryptedOutput').textContent = data.encrypted;
            document.getElementById('ivOutput').textContent = data.iv;
            document.getElementById('encryptOutput').style.display = 'block';
            
            // Auto-fill decrypt fields
            document.getElementById('decryptData').value = data.encrypted;
            document.getElementById('decryptIV').value = data.iv;
            document.getElementById('decryptBtn').disabled = false;
        } else {
            alert('Error encrypting message: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function decryptMessage() {
    if (!currentKeyPair) {
        alert('Please generate a key pair first!');
        return;
    }

    const encrypted = document.getElementById('decryptData').value;
    const iv = document.getElementById('decryptIV').value;

    if (!encrypted || !iv) {
        alert('Please enter both encrypted data and IV!');
        return;
    }

    try {
        const response = await fetch('/api/decrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                encrypted: encrypted,
                ivHex: iv,
                privateKeyHex: currentKeyPair.privateKey,
                publicKeyHex: currentKeyPair.publicKey
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('decryptedOutput').textContent = data.decrypted;
            document.getElementById('decryptOutput').style.display = 'block';
        } else {
            alert('Error decrypting message: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

