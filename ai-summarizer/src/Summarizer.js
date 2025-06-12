import React, { useState, useEffect } from "react";
import "./App.css";

const Summarizer = () => {
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    originalWords: 0,
    summaryWords: 0,
    compressionRatio: 0,
  });

  // Character limit
  const MAX_CHARS = 10000;
  const charCount = inputText.length;
  const isNearLimit = charCount > MAX_CHARS * 0.8;
  const isOverLimit = charCount > MAX_CHARS;

  // Calculate stats
  useEffect(() => {
    const originalWords = inputText.trim()
      ? inputText.trim().split(/\s+/).length
      : 0;
    const summaryWords = summary.trim()
      ? summary.trim().split(/\s+/).length
      : 0;
    const compressionRatio =
      originalWords > 0
        ? Math.round(((originalWords - summaryWords) / originalWords) * 100)
        : 0;

    setStats({ originalWords, summaryWords, compressionRatio });
  }, [inputText, summary]);

  const handleSummarize = async () => {
    if (!inputText.trim() || isOverLimit) return;

    setLoading(true);
    setSummary("");

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "Kamu adalah asisten AI yang ahli dalam meringkas teks. Buatlah ringkasan yang jelas, padat, dan mudah dipahami dalam bahasa Indonesia.",
              },
              {
                role: "user",
                content: `Ringkas teks berikut menjadi poin-poin utama yang paling penting:\n\n${inputText}`,
              },
            ],
            temperature: 0.5,
            max_tokens: 500,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const summaryText =
        data.choices?.[0]?.message?.content || "Gagal mendapatkan ringkasan.";
      setSummary(summaryText);
    } catch (error) {
      console.error("Error:", error);
      setSummary("Terjadi kesalahan saat memproses teks. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleClear = () => {
    setInputText("");
    setSummary("");
    setStats({ originalWords: 0, summaryWords: 0, compressionRatio: 0 });
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      handleSummarize();
    }
  };

  return (
    <div className="app-container">
      <h1>AI Text Summarizer</h1>
      <p className="subtitle">
        Ringkas teks panjang menjadi poin-poin utama dengan bantuan AI
      </p>

      <div className="input-section">
        <label className="input-label">
          Masukkan teks yang ingin diringkas:
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tempel atau ketik teks panjang di sini... (Ctrl + Enter untuk ringkas)"
          maxLength={MAX_CHARS}
        />
        <div
          className={`char-counter ${isNearLimit ? "warning" : ""} ${
            isOverLimit ? "danger" : ""
          }`}
        >
          {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} karakter
          {stats.originalWords > 0 && ` • ${stats.originalWords} kata`}
        </div>
      </div>

      <div className="button-container">
        <button
          onClick={handleSummarize}
          disabled={loading || !inputText.trim() || isOverLimit}
        >
          {loading && <span className="loading-spinner"></span>}
          {loading ? "Memproses Ringkasan..." : "Ringkas Teks"}
        </button>

        {inputText && (
          <button
            onClick={handleClear}
            style={{
              marginTop: "10px",
              background: "transparent",
              color: "#6b7280",
              border: "2px solid #e5e7eb",
              fontSize: "14px",
              padding: "12px 24px",
              textTransform: "none",
              letterSpacing: "normal",
            }}
          >
            Bersihkan
          </button>
        )}
      </div>

      {summary && (
        <div className="result">
          <h2>Hasil Ringkasan</h2>
          <div className="result-content">
            {summary}
            <button
              className={`copy-button ${copied ? "copied" : ""}`}
              onClick={handleCopy}
            >
              {copied ? "✓ Tersalin" : "Salin"}
            </button>
          </div>

          <div className="stats">
            <div className="stat-item">
              <span className="stat-number">{stats.originalWords}</span>
              <span>Kata Asli</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.summaryWords}</span>
              <span>Kata Ringkasan</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.compressionRatio}%</span>
              <span>Kompresi</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Summarizer;
