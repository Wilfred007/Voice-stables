"use client";

import React, { useEffect, useState } from "react";
import {
  Send,
  Wallet,
  Loader2,
  AlertCircle,
  Mic,
  Book,
} from "lucide-react";
import { authenticate, getUserAddress, network } from "@/lib/stacks";
import { openContractCall } from "@stacks/connect";
import {
  uintCV,
  principalCV,
  noneCV,
  someCV,
  bufferCV,
} from "@stacks/transactions";

/* ---------------------------------- config --------------------------------- */

const USDC_CONTRACT =
  "ST3HZSQ3EVYVFAX6KR3077S69FNZHB0XWMQ2WWTNJ.mock-usdc-v2";

const ADDRESS_BOOK_KEY = "voice_stables_address_book";

/* ---------------------------------- types ---------------------------------- */

type Status =
  | "idle"
  | "listening"
  | "parsed"
  | "signing"
  | "submitting"
  | "success"
  | "error";

type BookEntry = {
  name: string;
  address: string;
};

/* -------------------------------- utilities -------------------------------- */

const isStacksPrincipal = (v: string) =>
  /^ST[0-9A-Z]{38,41}$/.test(v.toUpperCase());

const parseUSDC = (value: string) => {
  if (!value) throw new Error("Enter amount");
  const [whole, frac = ""] = value.split(".");
  if (frac.length > 6) throw new Error("USDC supports max 6 decimals");
  return BigInt(whole + frac.padEnd(6, "0"));
};

const resolveNameOrAddress = (
  input: string,
  book: BookEntry[]
): string | null => {
  const needle = input.trim().toLowerCase();
  const found = book.find(
    (b) => b.name.trim().toLowerCase() === needle
  );
  if (found) return found.address;
  if (isStacksPrincipal(input.trim())) return input.trim();
  return null;
};

/* -------------------------------- component -------------------------------- */

export default function ManualTransfer() {
  const [address, setAddress] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [memo, setMemo] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  /* ------------------------------ voice state ------------------------------ */

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  /* ---------------------------- address book ---------------------------- */

  const [book, setBook] = useState<BookEntry[]>([]);
  const [newName, setNewName] = useState("");
  const [newAddr, setNewAddr] = useState("");

  useEffect(() => {
    setAddress(getUserAddress());
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ADDRESS_BOOK_KEY);
      if (raw) setBook(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const saveBook = (next: BookEntry[]) => {
    setBook(next);
    localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(next));
  };

  /* ------------------------------ voice logic ------------------------------ */

  const parseVoice = (text: string) => {
    const lower = text.toLowerCase();
    const amt = lower.match(/send\s+([0-9]+(?:\.[0-9]+)?)/)?.[1];
    const rec = lower.match(/\bto\s+([^\s]+)/)?.[1];
    const mem = lower.match(/\bmemo\s+(.+)$/)?.[1];

    const resolved = rec ? resolveNameOrAddress(rec, book) : null;

    if (amt) setAmount(amt);
    if (resolved) setRecipient(resolved);
    if (mem) setMemo(mem);

    if (amt && resolved) {
      setStatus("parsed");
      setError(null);
    } else {
      setStatus("error");
      setError("Could not parse amount or recipient");
    }
  };

  const startVoice = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      setStatus("error");
      setError("Speech recognition not supported");
      return;
    }

    setIsListening(true);
    setTranscript("");
    setStatus("listening");

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;

    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      parseVoice(text);
      setIsListening(false);
    };

    rec.onerror = () => {
      setIsListening(false);
      setStatus("error");
      setError("Voice recognition failed");
    };

    rec.start();
  };

  /* ------------------------------- submit ------------------------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTxId(null);

    if (!address) {
      authenticate();
      return;
    }

    const resolvedRecipient = resolveNameOrAddress(recipient, book);
    if (!resolvedRecipient) {
      setStatus("error");
      setError("Invalid recipient");
      return;
    }

    try {
      const raw = parseUSDC(amount);
      setStatus("signing");

      const memoArg = memo
        ? someCV(bufferCV(new TextEncoder().encode(memo).slice(0, 34)))
        : noneCV();

      await openContractCall({
        contractAddress: USDC_CONTRACT.split(".")[0],
        contractName: USDC_CONTRACT.split(".")[1],
        functionName: "transfer",
        functionArgs: [
          uintCV(Number(raw)),
          noneCV(),
          principalCV(resolvedRecipient),
          memoArg,
        ],
        network,
        onFinish: (data) => {
          setStatus("success");
          setTxId(data.txId);
          setAmount("");
          setRecipient("");
          setMemo("");
        },
        onCancel: () => setStatus("idle"),
      });

      setStatus("submitting");
    } catch (err: any) {
      setStatus("error");
      setError(err.message ?? "Transfer failed");
    }
  };

  /* ---------------------------------- UI ---------------------------------- */

  return (
    <div className="max-w-2xl mx-auto p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Send USDC</h2>

        {!address ? (
          <button
            onClick={authenticate}
            className="flex items-center gap-2 rounded-full
                       bg-foreground text-background px-4 py-2 font-medium
                       transition-all hover:scale-[1.02]
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-foreground/50
                       focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Wallet size={16} /> Connect
          </button>
        ) : (
          <span className="text-sm bg-secondary text-foreground px-3 py-1 rounded-full">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
        )}
      </div>

      {/* Voice */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={startVoice}
          disabled={isListening}
          className="rounded-full bg-secondary text-foreground px-4 py-2
                     flex gap-2 items-center transition-colors
                     hover:bg-muted disabled:opacity-60"
        >
          <Mic size={16} />
          {isListening ? "Listening…" : "Voice"}
        </button>

        {transcript && (
          <span className="text-xs text-muted-foreground">
            “{transcript}”
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {/* Address book */}
        <div>
          <h3 className="text-sm font-semibold flex gap-2 mb-2 text-foreground">
            <Book size={16} /> Address Book
          </h3>

          <div className="grid md:grid-cols-3 gap-3">
            <input
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm
                         bg-background/50 border border-border
                         text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-2 focus:ring-foreground/30"
            />
            <input
              placeholder="ST..."
              value={newAddr}
              onChange={(e) => setNewAddr(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm
                         bg-background/50 border border-border
                         text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-2 focus:ring-foreground/30"
            />
            <button
              type="button"
              onClick={() => {
                if (!newName || !isStacksPrincipal(newAddr)) return;
                saveBook([...book, { name: newName, address: newAddr }]);
                setNewName("");
                setNewAddr("");
              }}
              className="rounded-xl bg-foreground text-background px-4 py-2
                         font-medium transition-all hover:scale-[1.01]"
            >
              Add
            </button>
          </div>

          {book.map((b) => (
            <div key={b.name} className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{b.name}</span>{" "}
                — {b.address}
              </span>
              <button
                type="button"
                onClick={() => setRecipient(b.address)}
                className="text-sm text-muted-foreground
                           hover:text-foreground underline-offset-4 hover:underline"
              >
                Use
              </button>
            </div>
          ))}
        </div>

        {/* Inputs */}
        <input
          placeholder="Amount (USDC)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-xl px-3 py-2
                     bg-background/50 border border-border bg-gray-700 placeholder:text-gray-700
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-foreground/30"
        />

<input
  placeholder="Recipient (ST...) or name"
  value={recipient}
  onChange={(e) => setRecipient(e.target.value)}
  className="rounded-xl px-3 py-2
             bg-gray-700 border border-gray-600
             text-white placeholder:text-gray-400
             focus:outline-none focus:ring-2 focus:ring-gray-500"
/>


        <input
          placeholder="Memo (optional)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="rounded-xl px-3 py-2
                     bg-background/50 border border-border bg-gray-700 placeholder:text-gray-300
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-foreground/30"
        />

        {/* Submit */}
        <button
          disabled={status === "signing" || status === "submitting"}
          className="rounded-xl bg-foreground text-background py-2
                     flex gap-2 justify-center font-medium transition-all
                     hover:scale-[1.01] disabled:opacity-60
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-foreground/40"
        >
          {status === "signing" || status === "submitting" ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Send size={16} />
          )}
          Send
        </button>

        {/* Status */}
        {status === "success" && txId && (
          <div className="text-emerald-400 text-sm">
            Sent!{" "}
            <a
              href={`https://explorer.hiro.so/txid/${txId}?chain=testnet`}
              target="_blank"
              className="underline underline-offset-4 hover:text-emerald-300"
            >
              View tx
            </a>
          </div>
        )}

        {status === "error" && (
          <div className="text-red-400 text-sm flex gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </form>
    </div>
  );
}
