;; voice-transfer.clar
;; Voice-Driven Stablecoin Transfers
;; Intent-Based Payments with Address Catalogs

;; Traits
(use-trait sip-010-trait .sip-010-trait.sip-010-trait)

;; Constants
(define-constant ERR-INVALID-SIGNATURE (err u100))
(define-constant ERR-EXPIRED (err u101))
(define-constant ERR-NONCE-USED (err u102))
(define-constant ERR-INVALID-MAGIC (err u103))
(define-constant ERR-INVALID-VERSION (err u104))
(define-constant ERR-TRANSFER-FAILED (err u106))
(define-constant ERR-INSUFFICIENT-BALANCE (err u108))

(define-constant MAGIC-BYTES 0x564f4943) ;; "VOIC"
(define-constant VERSION u1)

;; Data Maps
(define-map used-nonces (buff 32) bool)
(define-map vault-balances principal uint)

;; Helper to convert buff to uint (big-endian)
(define-read-only (decode-u32 (b (buff 4)))
    (buff-to-uint-be b)
)

(define-read-only (decode-u128 (b (buff 16)))
    (buff-to-uint-be b)
)

(define-read-only (decode-u64 (b (buff 8)))
    (buff-to-uint-be b)
)

;; Public Functions

;; @desc Deposit tokens into the voice vault
(define-public (deposit (amount uint) (token-contract <sip-010-trait>))
    (let
        (
            (current-balance (default-to u0 (map-get? vault-balances tx-sender)))
        )
        (asserts! (> amount u0) (err u109))
        (try! (contract-call? token-contract transfer amount tx-sender (as-contract tx-sender) none))
        (map-set vault-balances tx-sender (+ current-balance amount))
        (ok true)
    )
)

;; @desc Withdraw tokens from the voice vault
(define-public (withdraw (amount uint) (token-contract <sip-010-trait>))
    (let
        (
            (current-balance (default-to u0 (map-get? vault-balances tx-sender)))
        )
        (asserts! (> amount u0) (err u109))
        (asserts! (>= current-balance amount) ERR-INSUFFICIENT-BALANCE)
        (map-set vault-balances tx-sender (- current-balance amount))
        (as-contract (contract-call? token-contract transfer amount (as-contract tx-sender) tx-sender none))
    )
)

;; @desc Execute a transfer based on a signed intent (using vault balance)
(define-public (execute-transfer (intent (buff 128)) (signature (buff 65)) (token-contract <sip-010-trait>))
    (let
        (
            ;; Parse Intent (Fixed Layout)
            (magic (unwrap-panic (as-max-len? (unwrap-panic (slice? intent u0 u4)) u4)))
            (version (decode-u32 (unwrap-panic (as-max-len? (unwrap-panic (slice? intent u4 u8)) u4))))
            (amount (decode-u128 (unwrap-panic (as-max-len? (unwrap-panic (slice? intent u8 u24)) u16))))
            (nonce (unwrap-panic (as-max-len? (unwrap-panic (slice? intent u24 u56)) u32)))
            (expiry (decode-u64 (unwrap-panic (as-max-len? (unwrap-panic (slice? intent u56 u64)) u8))))
            
            ;; Recipient (64-85)
            (recipient-buff (unwrap-panic (as-max-len? (unwrap-panic (slice? intent u64 u85)) u21)))
            (recipient (unwrap! (from-consensus-buff? principal recipient-buff) ERR-TRANSFER-FAILED))
            
            ;; Token (85-128)
            (token-addr-buff (unwrap-panic (as-max-len? (unwrap-panic (slice? intent u85 u106)) u21)))
            (token-name-len (decode-u8 (unwrap-panic (as-max-len? (unwrap-panic (slice? intent u106 u107)) u1))))
            
            ;; Hash Intent
            (intent-hash (sha256 intent))
            
            ;; Recover Signer
            (signer-pubkey (unwrap! (secp256k1-recover? intent-hash signature) ERR-INVALID-SIGNATURE))
            (signer (unwrap-panic (principal-of? signer-pubkey)))
            
            ;; Check Vault Balance
            (signer-balance (default-to u0 (map-get? vault-balances signer)))
        )
        
        ;; Validate Magic & Version
        (asserts! (is-eq magic MAGIC-BYTES) ERR-INVALID-MAGIC)
        (asserts! (is-eq version VERSION) ERR-INVALID-VERSION)
        
        ;; Validate Expiry
        (asserts! (< block-height expiry) ERR-EXPIRED)
        
        ;; Validate Nonce
        (asserts! (is-none (map-get? used-nonces nonce)) ERR-NONCE-USED)
        
        ;; Validate Balance
        (asserts! (>= signer-balance amount) ERR-INSUFFICIENT-BALANCE)
        
        ;; Mark Nonce as Used
        (map-set used-nonces nonce true)
        
        ;; Deduct from Vault
        (map-set vault-balances signer (- signer-balance amount))
        
        ;; Execute Transfer from Contract
        (print { event: "transfer-intent", signer: signer, amount: amount, recipient: recipient, nonce: nonce })
        
        (as-contract (contract-call? token-contract transfer amount (as-contract tx-sender) recipient none))
    )
)

(define-private (decode-u8 (data (buff 1)))
    (buff-to-uint-be data)
)

;; Read-only functions

(define-read-only (get-vault-balance (who principal))
    (default-to u0 (map-get? vault-balances who))
)

(define-read-only (is-nonce-used (nonce (buff 32)))
    (is-some (map-get? used-nonces nonce))
)
