;; Mock USDC Token (SIP-010)
(impl-trait .sip-010-trait.sip-010-trait)

(define-fungible-token mock-usdc)

(define-constant ERR-NOT-AUTHORIZED (err u100))

;; SIP-010 Functions
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
        (try! (ft-transfer? mock-usdc amount sender recipient))
        (match memo to-print (begin (print to-print) true) true)
        (ok true)
    )
)

(define-read-only (get-name)
    (ok "Mock USDC")
)

(define-read-only (get-symbol)
    (ok "USDC")
)

(define-read-only (get-decimals)
    (ok u6)
)

(define-read-only (get-balance (who principal))
    (ok (ft-get-balance mock-usdc who))
)

(define-read-only (get-total-supply)
    (ok (ft-get-supply mock-usdc))
)

(define-read-only (get-token-uri)
    (ok none)
)

;; Faucet function for testing
(define-public (faucet)
    (ft-mint? mock-usdc u1000000000 tx-sender) ;; Mint 1000 USDC
)
