// Transaction signing functionality
const STORAGE_KEY = 'transactionSigningData';
let codeEditor = null;
let compiledBytecode = null;
let encodedFunctionData = null;

document.addEventListener('DOMContentLoaded', () => {
    const signBtn = document.getElementById('signTransactionBtn');
    const clearBtn = document.getElementById('clearTransactionBtn');
    const compileBtn = document.getElementById('compileBtn');
    const clearSolidityBtn = document.getElementById('clearSolidityBtn');
    const contractToggle = document.getElementById('includeContractToggle');
    const callContractToggle = document.getElementById('callContractToggle');
    const encodeFunctionBtn = document.getElementById('encodeFunctionBtn');

    // Set up contract toggle first (before loading data)
    if (contractToggle) {
        contractToggle.addEventListener('change', toggleContractSection);
        // Initialize toggle state (off by default)
        toggleContractSection();
    }

    // Set up call contract toggle
    if (callContractToggle) {
        callContractToggle.addEventListener('change', toggleCallContractSection);
        // Initialize toggle state (off by default)
        toggleCallContractSection();
    }

    if (encodeFunctionBtn) {
        encodeFunctionBtn.addEventListener('click', encodeFunctionCall);
    }

    // Initialize CodeMirror for Solidity
    initializeCodeEditor();

    // Load stored data on page load
    loadStoredTransactionData();

    // Set up input listeners to save data on change
    setupInputListeners();

    if (signBtn) {
        signBtn.addEventListener('click', signTransaction);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearTransaction);
    }

    if (compileBtn) {
        compileBtn.addEventListener('click', compileSolidity);
    }

    if (clearSolidityBtn) {
        clearSolidityBtn.addEventListener('click', clearSolidityCode);
    }
});

function toggleContractSection() {
    const toggle = document.getElementById('includeContractToggle');
    const solidityGroup = document.getElementById('solidityCodeGroup');
    
    if (toggle && solidityGroup) {
        if (toggle.checked) {
            solidityGroup.style.display = 'block';
            // Uncheck call contract toggle if this is checked
            const callToggle = document.getElementById('callContractToggle');
            if (callToggle && callToggle.checked) {
                console.log('** unchecking call contract toggle');
                callToggle.checked = false;
                toggleCallContractSection();
            }
        } else {
            solidityGroup.style.display = 'none';
            // Clear compiled bytecode when hiding
            compiledBytecode = null;
            document.getElementById('bytecodeOutput').style.display = 'none';
            document.getElementById('compileStatus').textContent = '';
            // saveTransactionData();
        }
    }
}

function toggleCallContractSection() {
    const toggle = document.getElementById('callContractToggle');
    const callContractGroup = document.getElementById('callContractGroup');
    
    if (toggle && callContractGroup) {
        if (toggle.checked) {
            callContractGroup.style.display = 'block';
            // Uncheck contract deployment toggle if this is checked
            const deployToggle = document.getElementById('includeContractToggle');
            if (deployToggle && deployToggle.checked) {
                deployToggle.checked = false;
                toggleContractSection();
            }
        } else {
            callContractGroup.style.display = 'none';
            // Clear encoded function data when hiding
            encodedFunctionData = null;
            document.getElementById('encodingOutput').style.display = 'none';
            document.getElementById('encodeStatus').textContent = '';
            // saveTransactionData();
        }
    }
}

function initializeCodeEditor() {
    const textarea = document.getElementById('solidityCode');
    if (textarea && typeof CodeMirror !== 'undefined') {
        // Get any existing value from textarea before initializing CodeMirror
        const existingValue = textarea.value;
        
        codeEditor = CodeMirror.fromTextArea(textarea, {
            lineNumbers: true,
            mode: 'text/x-c++src', // Use C++ mode which works well for Solidity
            theme: 'monokai',
            indentUnit: 4,
            indentWithTabs: false,
            lineWrapping: true,
            matchBrackets: true,
            autoCloseBrackets: true
        });
        
        // Restore existing value if any
        if (existingValue) {
            codeEditor.setValue(existingValue);
        }
        
        // Update storage when code changes
        codeEditor.on('change', () => {
            saveTransactionData();
        });
        
    } else if (textarea) {
        // If CodeMirror is not available, still set up change listener for textarea
        textarea.addEventListener('input', saveTransactionData);
        textarea.addEventListener('change', saveTransactionData);
    }
}

function clearSolidityCode() {
    if (codeEditor) {
        codeEditor.setValue('');
        compiledBytecode = null;
        document.getElementById('bytecodeOutput').style.display = 'none';
        document.getElementById('compileStatus').textContent = '';
        saveTransactionData();
    }
}

function setupInputListeners() {
    const inputs = [
        'fromAddress',
        'toAddress',
        'amount',
        'nonce',
        'gasPrice',
        'gasLimit',
        'chainId',
        'privateKey',
        'contractAddress',
        'functionSignature',
        'functionParameters'
    ];

    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', saveTransactionData);
            input.addEventListener('change', saveTransactionData);
        }
    });
}

function saveTransactionData() {
    // Get all field values with null checks
    const fromAddressEl = document.getElementById('fromAddress');
    const toAddressEl = document.getElementById('toAddress');
    const amountEl = document.getElementById('amount');
    const nonceEl = document.getElementById('nonce');
    const gasPriceEl = document.getElementById('gasPrice');
    const gasLimitEl = document.getElementById('gasLimit');
    const chainIdEl = document.getElementById('chainId');
    const privateKeyEl = document.getElementById('privateKey');
    const contractAddressEl = document.getElementById('contractAddress');
    const functionSignatureEl = document.getElementById('functionSignature');
    const functionParametersEl = document.getElementById('functionParameters');
    const solidityCodeEl = document.getElementById('solidityCode');
    
    // Get Solidity code from CodeMirror editor or textarea
    const solidityCode = codeEditor ? codeEditor.getValue() : (solidityCodeEl ? solidityCodeEl.value : '');
    
    // Get toggle states
    const includeContractToggle = document.getElementById('includeContractToggle');
    const callContractToggle = document.getElementById('callContractToggle');
    const includeContract = includeContractToggle ? includeContractToggle.checked : false;
    const callContract = callContractToggle ? callContractToggle.checked : false;
    
    // Build transaction data object with all fields
    const transactionData = {
        fromAddress: fromAddressEl ? fromAddressEl.value : '',
        toAddress: toAddressEl ? toAddressEl.value : '',
        amount: amountEl ? amountEl.value : '',
        nonce: nonceEl ? nonceEl.value : '',
        gasPrice: gasPriceEl ? gasPriceEl.value : '',
        gasLimit: gasLimitEl ? gasLimitEl.value : '',
        chainId: chainIdEl ? chainIdEl.value : '',
        privateKey: privateKeyEl ? privateKeyEl.value : '',
        includeContract: includeContract,
        solidityCode: solidityCode,
        compiledBytecode: compiledBytecode,
        callContract: callContract,
        contractAddress: contractAddressEl ? contractAddressEl.value : '',
        functionSignature: functionSignatureEl ? functionSignatureEl.value : '',
        functionParameters: functionParametersEl ? functionParametersEl.value : '',
        encodedFunctionData: encodedFunctionData
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactionData));
        // console.log('** localStorage');
        // console.log(localStorage.getItem(STORAGE_KEY));
    } catch (error) {
        console.error('Error saving transaction data to localStorage:', error);
    }
}

function loadStoredTransactionData() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        // console.log('** storedData');
        // console.log(storedData);
        if (storedData) {
            const transactionData = JSON.parse(storedData);
            
            // Load fromAddress (sender)
            if (transactionData.fromAddress !== undefined && transactionData.fromAddress !== null) {
                const fromAddressEl = document.getElementById('fromAddress');
                if (fromAddressEl) {
                    fromAddressEl.value = transactionData.fromAddress;
                }
            }
            // Load toAddress (recipient)
            if (transactionData.toAddress !== undefined && transactionData.toAddress !== null) {
                const toAddressEl = document.getElementById('toAddress');
                if (toAddressEl) {
                    toAddressEl.value = transactionData.toAddress;
                }
            }
            if (transactionData.amount !== undefined && transactionData.amount !== null && transactionData.amount !== '') {
                document.getElementById('amount').value = transactionData.amount;
            }
            if (transactionData.nonce !== undefined && transactionData.nonce !== null && transactionData.nonce !== '') {
                document.getElementById('nonce').value = transactionData.nonce;
            }
            if (transactionData.gasPrice !== undefined && transactionData.gasPrice !== null && transactionData.gasPrice !== '') {
                document.getElementById('gasPrice').value = transactionData.gasPrice;
            }
            if (transactionData.gasLimit !== undefined && transactionData.gasLimit !== null && transactionData.gasLimit !== '') {
                document.getElementById('gasLimit').value = transactionData.gasLimit;
            }
            if (transactionData.chainId !== undefined && transactionData.chainId !== null && transactionData.chainId !== '') {
                document.getElementById('chainId').value = transactionData.chainId;
            }
            if (transactionData.privateKey) {
                document.getElementById('privateKey').value = transactionData.privateKey;
            }
            if (transactionData.includeContract !== undefined) {
                const toggle = document.getElementById('includeContractToggle');
                if (toggle) {
                    toggle.checked = transactionData.includeContract;
                    toggleContractSection();
                }
            }
            if (transactionData.callContract !== undefined) {
                const toggle = document.getElementById('callContractToggle');
                if (toggle) {
                    toggle.checked = transactionData.callContract;
                    toggleCallContractSection();
                }
            }
            // Load function call fields
            if (transactionData.contractAddress) {
                const contractAddrInput = document.getElementById('contractAddress');
                if (contractAddrInput) {
                    contractAddrInput.value = transactionData.contractAddress;
                }
            }
            if (transactionData.functionSignature) {
                const funcSigInput = document.getElementById('functionSignature');
                if (funcSigInput) {
                    funcSigInput.value = transactionData.functionSignature;
                }
            }
            if (transactionData.functionParameters) {
                const funcParamsInput = document.getElementById('functionParameters');
                if (funcParamsInput) {
                    funcParamsInput.value = transactionData.functionParameters;
                }
            }
            if (transactionData.encodedFunctionData) {
                encodedFunctionData = transactionData.encodedFunctionData;
                const encodedDataOutput = document.getElementById('encodedDataOutput');
                const encodingOutput = document.getElementById('encodingOutput');
                if (encodedDataOutput) {
                    encodedDataOutput.textContent = '0x' + encodedFunctionData;
                }
                if (encodingOutput) {
                    encodingOutput.style.display = 'block';
                }
            }
            // Load Solidity code - try CodeMirror first, fallback to textarea
            if (transactionData.solidityCode) {
                const solidityTextarea = document.getElementById('solidityCode');
                if (codeEditor) {
                    codeEditor.setValue(transactionData.solidityCode);
                } else if (solidityTextarea) {
                    // Set textarea value - CodeMirror will pick it up when initialized
                    solidityTextarea.value = transactionData.solidityCode;
                }
            }
            if (transactionData.compiledBytecode) {
                compiledBytecode = transactionData.compiledBytecode;
                document.getElementById('bytecodeDisplay').textContent = '0x' + compiledBytecode;
                document.getElementById('bytecodeOutput').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading transaction data from localStorage:', error);
    }
}

function clearTransaction() {
    document.getElementById('fromAddress').value = '';
    document.getElementById('toAddress').value = '';
    document.getElementById('amount').value = '1.0';
    document.getElementById('nonce').value = '0';
    document.getElementById('gasPrice').value = '20';
    document.getElementById('gasLimit').value = '21000';
    document.getElementById('chainId').value = '11155111';
    document.getElementById('privateKey').value = '';
    document.getElementById('transactionOutput').style.display = 'none';
    
    // Reset contract toggles
    const deployToggle = document.getElementById('includeContractToggle');
    if (deployToggle) {
        deployToggle.checked = false;
        toggleContractSection();
    }
    const callToggle = document.getElementById('callContractToggle');
    if (callToggle) {
        callToggle.checked = false;
        toggleCallContractSection();
    }
    
    // Clear Solidity code
    if (codeEditor) {
        codeEditor.setValue('');
    }
    compiledBytecode = null;
    document.getElementById('bytecodeOutput').style.display = 'none';
    document.getElementById('compileStatus').textContent = '';
    
    // Clear localStorage
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing transaction data from localStorage:', error);
    }
}

async function signTransaction() {
    // Get form values
    const fromAddress = document.getElementById('fromAddress').value.trim();
    const toAddress = document.getElementById('toAddress').value.trim();
    const amount = document.getElementById('amount').value;
    const nonce = document.getElementById('nonce').value;
    const gasPrice = document.getElementById('gasPrice').value;
    const gasLimit = document.getElementById('gasLimit').value;
    const chainId = document.getElementById('chainId').value;
    let privateKey = document.getElementById('privateKey').value.trim();

    // Check which mode we're in
    const includeContract = document.getElementById('includeContractToggle') ? document.getElementById('includeContractToggle').checked : false;
    const callContract = document.getElementById('callContractToggle') ? document.getElementById('callContractToggle').checked : false;

    // Validate inputs based on mode
    if (includeContract) {
        // Contract deployment: From Address, Private Key, Nonce, Gas Price, Gas Limit, Chain ID, and Compiled Bytecode are required
        if (!fromAddress || !privateKey || !nonce || !gasPrice || !gasLimit || !chainId) {
            alert('Please fill in all required fields: From Address, Private Key, Nonce, Gas Price, Gas Limit, and Chain ID');
            return;
        }
        if (!compiledBytecode) {
            alert('Please compile your Solidity code first. The compiled bytecode is required for contract deployment.');
            return;
        }
    } else if (callContract) {
        // Function call: From Address, Private Key, Contract Address, Nonce, Gas Price, Gas Limit, Chain ID, and Encoded Function Data are required
        const contractAddress = document.getElementById('contractAddress').value.trim();
        if (!fromAddress || !privateKey || !contractAddress || !nonce || !gasPrice || !gasLimit || !chainId) {
            alert('Please fill in all required fields: From Address, Contract Address, Private Key, Nonce, Gas Price, Gas Limit, and Chain ID');
            return;
        }
        if (!encodedFunctionData) {
            alert('Please encode your function call first. The encoded function data is required.');
            return;
        }
        // Validate contract address
        if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            alert('Invalid contract address format. Must be a valid Ethereum address (0x followed by 40 hex characters)');
            return;
        }
    } else {
        // Regular transaction: From Address, To Address, Amount, Private Key, Nonce, Gas Price, Gas Limit, and Chain ID are required
        if (!fromAddress || !toAddress || !amount || !privateKey || !nonce || !gasPrice || !gasLimit || !chainId) {
            alert('Please fill in all required fields: From Address, To Address, Amount, Private Key, Nonce, Gas Price, Gas Limit, and Chain ID');
            return;
        }
        // Validate Ethereum addresses
        if (!toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            alert('Invalid "To" address format. Must be a valid Ethereum address (0x followed by 40 hex characters)');
            return;
        }
        // Validate amount for regular transactions
        if (isNaN(amount) || parseFloat(amount) < 0) {
            alert('Amount must be a valid positive number');
            return;
        }
    }

    // Validate From Address (always required)
    if (!fromAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        alert('Invalid "From" address format. Must be a valid Ethereum address (0x followed by 40 hex characters)');
        return;
    }

    // Remove 0x prefix from private key if present
    if (privateKey.startsWith('0x')) {
        privateKey = privateKey.slice(2);
    }

    // Validate private key format
    if (!privateKey.match(/^[a-fA-F0-9]{64}$/)) {
        alert('Invalid private key format. Must be 64 hexadecimal characters (with or without 0x prefix)');
        return;
    }

    // Validate amount (optional for contract deployment, required for regular transactions)
    if (!includeContract && !callContract) {
        if (isNaN(amount) || parseFloat(amount) < 0) {
            alert('Amount must be a valid positive number');
            return;
        }
    } else if (amount && amount !== '' && (isNaN(amount) || parseFloat(amount) < 0)) {
        // For contract deployment/calls, amount is optional but if provided must be valid
        alert('Amount must be a valid positive number');
        return;
    }

    // Validate numeric inputs
    if (isNaN(nonce) || parseInt(nonce) < 0) {
        alert('Nonce must be a valid non-negative integer');
        return;
    }

    if (isNaN(gasPrice) || parseFloat(gasPrice) < 0) {
        alert('Gas Price must be a valid positive number');
        return;
    }

    if (isNaN(gasLimit) || parseInt(gasLimit) < 0) {
        alert('Gas Limit must be a valid non-negative integer');
        return;
    }

    if (isNaN(chainId) || parseInt(chainId) < 0) {
        alert('Chain ID must be a valid non-negative integer');
        return;
    }

    try {
        // Show loading state
        const signBtn = document.getElementById('signTransactionBtn');
        const originalText = signBtn.textContent;
        signBtn.disabled = true;
        signBtn.textContent = 'Signing...';

        // Determine the 'to' address based on mode
        let toAddressValue;
        if (callContract) {
            toAddressValue = document.getElementById('contractAddress').value.trim();
        } else if (includeContract) {
            // Contract deployment uses null for 'to' field
            toAddressValue = null;
        } else {
            toAddressValue = toAddress;
        }

        const response = await fetch('/api/sign-transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: fromAddress,
                to: toAddressValue,
                value: amount || '0',
                nonce: parseInt(nonce),
                gasPrice: gasPrice,
                gasLimit: parseInt(gasLimit),
                chainId: parseInt(chainId),
                privateKey: privateKey,
                data: encodedFunctionData ? '0x' + encodedFunctionData : (compiledBytecode ? '0x' + compiledBytecode : undefined)
            })
        });
        
        const data = await response.json();

        // Restore button
        signBtn.disabled = false;
        signBtn.textContent = originalText;

        if (response.ok) {
            // Display results
            document.getElementById('rawTransactionOutput').textContent = JSON.stringify(data.rawTransaction, null, 2);
            document.getElementById('transactionHashOutput').textContent = data.transactionHash;
            document.getElementById('signedTransactionOutput').textContent = data.signedTransaction;
            document.getElementById('recoveryIdOutput').textContent = data.recoveryId || 'N/A';
            document.getElementById('transactionOutput').style.display = 'block';
        } else {
            alert('Error signing transaction: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
        const signBtn = document.getElementById('signTransactionBtn');
        signBtn.disabled = false;
        signBtn.textContent = 'Sign Transaction';
    }
}

async function compileSolidity() {
    const solidityCode = codeEditor ? codeEditor.getValue() : document.getElementById('solidityCode').value;
    
    if (!solidityCode || !solidityCode.trim()) {
        alert('Please enter Solidity code to compile');
        return;
    }

    const compileBtn = document.getElementById('compileBtn');
    const compileStatus = document.getElementById('compileStatus');
    
    try {
        compileBtn.disabled = true;
        compileBtn.textContent = 'Compiling...';
        compileStatus.textContent = '';
        compileStatus.style.color = '#666';

        const response = await fetch('/api/compile-solidity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: solidityCode
            })
        });

        const data = await response.json();

        compileBtn.disabled = false;
        compileBtn.textContent = 'Compile Solidity';

        if (response.ok) {
            compiledBytecode = data.bytecode;
            document.getElementById('bytecodeDisplay').textContent = '0x' + compiledBytecode;
            document.getElementById('bytecodeOutput').style.display = 'block';
            compileStatus.textContent = '✓ Compiled successfully';
            compileStatus.style.color = '#27ae60';
            
            // Save to localStorage
            saveTransactionData();
        } else {
            compileStatus.textContent = '✗ Compilation failed: ' + (data.error || 'Unknown error');
            compileStatus.style.color = '#e74c3c';
            document.getElementById('bytecodeOutput').style.display = 'none';
        }
    } catch (error) {
        compileBtn.disabled = false;
        compileBtn.textContent = 'Compile Solidity';
        compileStatus.textContent = '✗ Error: ' + error.message;
        compileStatus.style.color = '#e74c3c';
    }
}

async function encodeFunctionCall() {
    const functionSignature = document.getElementById('functionSignature').value.trim();
    const functionParameters = document.getElementById('functionParameters').value.trim();
    
    if (!functionSignature) {
        alert('Please enter a function signature');
        return;
    }

    const encodeBtn = document.getElementById('encodeFunctionBtn');
    const encodeStatus = document.getElementById('encodeStatus');
    
    try {
        encodeBtn.disabled = true;
        encodeBtn.textContent = 'Encoding...';
        encodeStatus.textContent = '';
        encodeStatus.style.color = '#666';

        let params = [];
        if (functionParameters) {
            try {
                params = JSON.parse(functionParameters);
                if (!Array.isArray(params)) {
                    throw new Error('Parameters must be a JSON array');
                }
            } catch (e) {
                alert('Invalid JSON format for parameters. Please use a valid JSON array.');
                encodeBtn.disabled = false;
                encodeBtn.textContent = 'Encode Function Call';
                return;
            }
        }

        const response = await fetch('/api/encode-function', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                functionSignature: functionSignature,
                parameters: params
            })
        });

        const data = await response.json();

        encodeBtn.disabled = false;
        encodeBtn.textContent = 'Encode Function Call';

        if (response.ok) {
            encodedFunctionData = data.data;
            document.getElementById('encodedDataOutput').textContent = '0x' + encodedFunctionData;
            document.getElementById('encodingOutput').style.display = 'block';
            encodeStatus.textContent = '✓ Encoded successfully';
            encodeStatus.style.color = '#27ae60';
            
            // Save to localStorage
            saveTransactionData();
        } else {
            encodeStatus.textContent = '✗ Encoding failed: ' + (data.error || 'Unknown error');
            encodeStatus.style.color = '#e74c3c';
            document.getElementById('encodingOutput').style.display = 'none';
        }
    } catch (error) {
        encodeBtn.disabled = false;
        encodeBtn.textContent = 'Encode Function Call';
        encodeStatus.textContent = '✗ Error: ' + error.message;
        encodeStatus.style.color = '#e74c3c';
    }
}

