'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, UserPlus, History, Wallet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { authenticate, getUserAddress, userSession, network, disconnect } from '@/lib/stacks';
import { parseVoiceCommand, getAddressFromAlias, saveAlias, getAllAliases } from '@/lib/voice';
import { buildIntentBuffer, generateNonce } from '@/lib/intent';
import { openSignatureRequestPopup, openContractCall } from '@stacks/connect';
import {
    bufferCV,
    contractPrincipalCV,
    uintCV,
    principalCV,
    serializeCV
} from '@stacks/transactions';

// Mock USDC contract for demo purposes
const USDC_CONTRACT = 'ST3HZSQ3EVYVFAX6KR3077S69FNZHB0XWMQ2WWTNJ.mock-usdc-v2';
const VAULT_CONTRACT = 'ST3HZSQ3EVYVFAX6KR3077S69FNZHB0XWMQ2WWTNJ.voice-transfer-v2';

export default function VoiceTransfer() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [status, setStatus] = useState<'idle' | 'parsing' | 'signing' | 'submitting' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [aliases, setAliases] = useState<Record<string, string>>({});
    const [newAlias, setNewAlias] = useState({ name: '', address: '' });
    const [pendingCommand, setPendingCommand] = useState<{ amount: number, token: string, recipient: string, alias: string } | null>(null);
    const [vaultBalance, setVaultBalance] = useState<number>(0);
    const [manualForm, setManualForm] = useState<{ amount: string; alias: string; address: string }>({
        amount: '',
        alias: '',
        address: '',
      });
    

    const recognitionRef = useRef<any>(null);

    const fetchVaultBalance = async (userAddress: string) => {
        try {
            console.log('Fetching vault balance for:', userAddress);
            const response = await fetch(`${(network as any).coreApiUrl}/v2/contracts/call-read/${VAULT_CONTRACT.split('.')[0]}/${VAULT_CONTRACT.split('.')[1]}/get-vault-balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: userAddress,
                    arguments: [serializeCV(principalCV(userAddress))]
                })
            });
            const result = await response.json();
            console.log('Vault balance API response:', result);
            if (result.okay && result.result) {
                // Clarity uint is serialized as hex
                const hex = result.result.replace('0x', '');
                const balance = parseInt(hex, 16) / 1000000;
                console.log('Vault balance updated:', balance);
                setVaultBalance(balance);
            }
        } catch (err) {
            console.error('Error fetching vault balance:', err);
        }
    };

    useEffect(() => {
        const userAddr = getUserAddress();
        setAddress(userAddr);
        setAliases(getAllAliases());

        if (userAddr) {
            fetchVaultBalance(userAddr);
        }

        if (typeof window !== 'undefined' && ('Uint8Array' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: any) => {
                    const text = event.results[0][0].transcript;
                    setTranscript(text);
                    handleCommand(text);
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsListening(false);
                    setError(`Voice recognition error: ${event.error}`);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setError(null);
            setTranscript('');
            setStatus('idle');
            setPendingCommand(null);
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };
    

    const handleCommand = async (text: string) => {
        setStatus('parsing');
        const command = parseVoiceCommand(text);

        if (!command) {
            setStatus('error');
            setError('Could not understand command. Try "Send 20 USDC to mom"');
            return;
        }

        const recipientAddress = getAddressFromAlias(command.alias);
        if (!recipientAddress) {
            setStatus('error');
            setError(`Alias "${command.alias}" not found in your catalog.`);
            return;
        }

        setPendingCommand({ ...command, recipient: recipientAddress });
        setStatus('idle');
    };

    const handleFaucet = async () => {
        if (!address) return authenticate();
        setStatus('submitting');
        setError(null);

        try {
            await openContractCall({
                contractAddress: USDC_CONTRACT.split('.')[0],
                contractName: USDC_CONTRACT.split('.')[1],
                functionName: 'faucet',
                functionArgs: [],
                network,
                onFinish: (data) => {
                    console.log('Faucet transaction submitted:', data.txId);
                    setStatus('success');
                    setTimeout(() => fetchVaultBalance(address), 5000);
                },
                onCancel: () => {
                    console.log('Faucet transaction cancelled');
                    setStatus('error');
                    setError('Transaction was cancelled. Please try again.');
                }
            });
        } catch (err: any) {
            console.error('Faucet error:', err);
            setStatus('error');
            setError(err.message || 'Failed to call faucet');
        }
    };

    const handleDeposit = async () => {
        if (!address) return authenticate();
        const amountStr = prompt("Enter amount to deposit (USDC):");
        if (!amountStr) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setStatus('submitting');
        setError(null);

        try {
            await openContractCall({
                contractAddress: VAULT_CONTRACT.split('.')[0],
                contractName: VAULT_CONTRACT.split('.')[1],
                functionName: 'deposit',
                functionArgs: [
                    uintCV(Math.floor(amount * 1000000)),
                    principalCV(USDC_CONTRACT)
                ],
                network,
                onFinish: (data) => {
                    console.log('Deposit transaction submitted:', data.txId);
                    setStatus('success');
                    setTimeout(() => fetchVaultBalance(address), 5000);
                },
                onCancel: () => {
                    console.log('Deposit transaction cancelled');
                    setStatus('error');
                    setError('Deposit was cancelled. Please try again.');
                }
            });
        } catch (err: any) {
            console.error('Deposit error:', err);
            setStatus('error');
            setError(err.message || 'Failed to deposit');
        }
    };

    const executeTransfer = async (amount: number, token: string, recipient: string) => {
        console.log('executeTransfer called:', { amount, token, recipient });
        if (!userSession.isUserSignedIn()) {
            console.log('User not signed in, authenticating...');
            authenticate();
            return;
        }

        if (vaultBalance < amount) {
            setStatus('error');
            setError(`Insufficient vault balance. You have ${vaultBalance} USDC but need ${amount} USDC.`);
            return;
        }

        setStatus('signing');
        setError(null);

        try {
            // 1. Build Intent
            console.log('Building intent...');
            const intent = {
                token: USDC_CONTRACT,
                amount: BigInt(Math.floor(amount * 1000000)), // Ensure integer
                recipient: recipient,
                nonce: generateNonce(),
                expiry: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour expiry
            };

            const intentBuffer = buildIntentBuffer(intent);
            console.log('Intent buffer:', intentBuffer);

            // 2. Request Signature
            console.log('Hashing intent buffer...');
            const intentHash = await crypto.subtle.digest('SHA-256', intentBuffer as any);
            const intentHashHex = Array.from(new Uint8Array(intentHash))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            console.log('Intent hash:', intentHashHex);

            if (typeof openSignatureRequestPopup !== 'function') {
                throw new Error('openSignatureRequestPopup is not a function. Check @stacks/connect installation.');
            }

            console.log('Opening signature request...');
            openSignatureRequestPopup({
                message: `Transfer Intent Hash: ${intentHashHex}\nAmount: ${amount} ${token}\nTo: ${recipient}\n(Funds will be deducted from your Voice Vault)`,
                network,
                onFinish: async (data) => {
                    console.log('Signature received:', data);
                    const signature = data.signature;
                    setStatus('submitting');

                    const hexToUint8Array = (hex: string) => {
                        const matches = hex.match(/.{1,2}/g);
                        if (!matches) return new Uint8Array();
                        return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
                    };

                    // 3. Submit to Contract
                    console.log('Submitting contract call...');
                    const sigBuffer = hexToUint8Array(signature);
                    if (sigBuffer.length !== 65) {
                        throw new Error(`Invalid signature length: ${sigBuffer.length} bytes (expected 65)`);
                    }

                    await openContractCall({
                        contractAddress: VAULT_CONTRACT.split('.')[0],
                        contractName: VAULT_CONTRACT.split('.')[1],
                        functionName: 'execute-transfer',
                        functionArgs: [
                            bufferCV(intentBuffer),
                            bufferCV(sigBuffer),
                            principalCV(USDC_CONTRACT)
                        ],
                        network,
                        onFinish: (result) => {
                            console.log('Transaction submitted:', result);
                            setStatus('success');
                            setPendingCommand(null);
                            setTimeout(() => fetchVaultBalance(address!), 5000);
                        },
                        onCancel: () => {
                            console.log('Contract call cancelled');
                            setStatus('idle');
                        }
                    });
                },
                onCancel: () => {
                    console.log('Signature request cancelled');
                    setStatus('idle');
                }
            });
        } catch (err: any) {
            console.error('executeTransfer error:', err);
            setStatus('error');
            setError(err.message || 'Failed to prepare transfer');
        }
    };

    const handleAddAlias = (e: React.FormEvent) => {
        e.preventDefault();
        if (newAlias.name && newAlias.address) {
            saveAlias(newAlias.name, newAlias.address);
            setAliases(getAllAliases());
            setNewAlias({ name: '', address: '' });
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Voice Stables
                    </h1>
                    <p className="text-gray-500 mt-2">Intent-based stablecoin transfers via voice.</p>
                </div>
                {!address ? (
                    <button
                        onClick={authenticate}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-all shadow-lg"
                    >
                        <Wallet size={20} />
                        Connect Wallet
                    </button>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-gray-700">
                                {address.slice(0, 6)}...{address.slice(-4)}
                            </span>
                        </div>
                        <button
                            onClick={disconnect}
                            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                        >
                            Log Out
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Voice Interface */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                        <button
                            onClick={toggleListening}
                            disabled={status === 'signing' || status === 'submitting'}
                            className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isListening
                                ? 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)] scale-110'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-xl'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isListening ? (
                                <MicOff size={48} className="text-white animate-pulse" />
                            ) : (
                                <Mic size={48} className="text-white" />
                            )}

                            {isListening && (
                                <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75" />
                            )}
                        </button>

                        <div className="mt-8 text-center space-y-4 max-w-md">
                            {status === 'idle' && !isListening && (
                                <p className="text-gray-400 text-lg">Tap the mic and say something like<br />"Send 20 USDC to mom"</p>
                            )}

                            {isListening && (
                                <p className="text-blue-600 font-medium text-xl animate-pulse">Listening...</p>
                            )}

                            {transcript && (
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                    <p className="text-gray-700 italic">"{transcript}"</p>
                                </div>
                            )}

                            {status === 'parsing' && (
                                <div className="flex items-center justify-center gap-2 text-blue-600">
                                    <Loader2 className="animate-spin" />
                                    <span>Parsing command...</span>
                                </div>
                            )}

                            {pendingCommand && status === 'idle' && (
                                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div className="text-left">
                                            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Ready to Send</p>
                                            <p className="text-2xl font-bold text-gray-900">{pendingCommand.amount} {pendingCommand.token}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">To</p>
                                            <p className="text-lg font-medium text-gray-900 capitalize">{pendingCommand.alias}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            onClick={() => executeTransfer(pendingCommand.amount, pendingCommand.token, pendingCommand.recipient)}
                                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Send size={18} />
                                            Confirm & Sign
                                        </button>
                                        <button
                                            onClick={() => setPendingCommand(null)}
                                            className="w-full mt-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {status === 'signing' && (
                                <div className="flex flex-col items-center gap-2 text-purple-600">
                                    <Loader2 className="animate-spin" />
                                    <span className="font-medium">Waiting for signature...</span>
                                    <p className="text-xs text-gray-400">Please check your wallet popup</p>
                                </div>
                            )}

                            {status === 'submitting' && (
                                <div className="flex flex-col items-center gap-2 text-orange-600">
                                    <Loader2 className="animate-spin" />
                                    <span className="font-medium">Submitting transaction...</span>
                                </div>
                            )}

                            {status === 'success' && (
                                <div className="flex flex-col items-center gap-2 text-green-600">
                                    <CheckCircle2 size={48} />
                                    <span className="font-bold text-xl">Success!</span>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="text-sm text-gray-500 underline mt-2"
                                    >
                                        Continue
                                    </button>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="flex flex-col items-center gap-2 text-red-600">
                                    <AlertCircle size={48} />
                                    <span className="font-medium">{error}</span>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="text-sm text-gray-500 underline mt-2"
                                    >
                                        Try again
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tips/Help */}
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <h3 className="text-blue-800 font-semibold flex items-center gap-2 mb-2">
                            <History size={18} />
                            How it works
                        </h3>
                        <ul className="text-blue-700 text-sm space-y-2 list-disc list-inside opacity-80">
                            <li>Deposit USDC into your Voice Vault to enable gasless transfers.</li>
                            <li>Voice is converted to a cryptographic intent off-chain.</li>
                            <li>You sign the intent with your wallet to authorize the transfer.</li>
                            <li>The smart contract verifies your signature and moves funds from your vault.</li>
                        </ul>
                    </div>
                </div>

                {/* Sidebar: Vault & Address Catalog */}
                <div className="space-y-6">
                    {/* Voice Vault */}
                    <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-6 rounded-3xl shadow-lg text-white">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <Wallet size={20} />
                            Voice Vault
                        </h2>
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm mb-4">
                            <p className="text-blue-100 text-xs uppercase font-bold tracking-wider">Vault Balance</p>
                            <p className="text-3xl font-bold">{vaultBalance.toFixed(2)} <span className="text-sm font-normal">USDC</span></p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleDeposit}
                                className="bg-white text-blue-600 py-2 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
                            >
                                Deposit
                            </button>
                            <button
                                onClick={handleFaucet}
                                className="bg-blue-500/30 border border-white/20 text-white py-2 rounded-xl font-bold text-sm hover:bg-blue-500/50 transition-colors"
                            >
                                Faucet
                            </button>
                        </div>
                        <p className="text-[10px] text-blue-200 mt-3 text-center opacity-70">
                            Funding your vault allows for gasless voice transfers.
                        </p>
                    </div>

                    {/* Address Catalog */}
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <UserPlus size={20} className="text-blue-600" />
                            Address Catalog
                        </h2>

                        <form onSubmit={handleAddAlias} className="space-y-3 mb-6">
                            <input
                                type="text"
                                placeholder="Alias (e.g. mom)"
                                value={newAlias.name}
                                onChange={e => setNewAlias({ ...newAlias, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm placeholder-gray-600"
                            />
                            <input
                                type="text"
                                placeholder="Stacks Address"
                                value={newAlias.address}
                                onChange={e => setNewAlias({ ...newAlias, address: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm placeholder-gray-600"
                            />
                            <button
                                type="submit"
                                className="w-full bg-gray-900 text-white py-2 rounded-xl hover:bg-black transition-colors text-sm font-medium"
                            >
                                Add Recipient
                            </button>
                        </form>

                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                            {Object.entries(aliases).length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-4">No recipients added yet.</p>
                            ) : (
                                Object.entries(aliases).map(([alias, addr]) => (
                                    <div key={alias} className="flex flex-col p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <span className="font-bold text-gray-900 capitalize">{alias}</span>
                                        <span className="text-[10px] text-gray-500 truncate">{addr}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
