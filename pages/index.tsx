
"use client";
import { useState, useEffect, useRef } from "react";
import JSZip from "jszip";
import { FiDownload, FiPlayCircle } from "react-icons/fi";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(code || "<h2 style='color:#999; text-align:center;'>Preview will appear here</h2>");
        doc.close();
      }
    }
  }, [code]);

  const generateDesign = async () => {
    setLoading(true);
    setError(null);
    setCode("");

    try {
      const response = await fetch("http://127.0.0.1:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(`Error: ${errorData.detail || "Failed to generate design."}`);
        return;
      }

      const data = await response.json();
      if (data.generated_code) {
        setCode(data.generated_code);
      } else {
        setError("Error: Backend did not return generated_code.");
      }
    }finally {
      setLoading(false);
    }
  };

  const downloadZip = async () => {
    if (!code.trim()) {
      setError("Nothing to download!");
      return;
    }

    try {
      const zip = new JSZip();
      zip.file("index.html", code);
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "website.zip";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Failed to create zip file.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white font-poppins p-6">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-blue-500 tracking-tight">
          Alishba Rehman AI Web App
          </h1>
          <button
            onClick={downloadZip}
            disabled={!code.trim()}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 transition px-4 py-2 rounded-lg shadow"
          >
            <FiDownload />
            Download ZIP
          </button>
        </header>

        {/* Prompt Input */}
        <section className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-3">Enter Your Design Prompt</h2>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder="e.g., Modern portfolio with 3 sections and contact form..."
            className="w-full bg-gray-700 text-white rounded-lg p-4 border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button
            onClick={generateDesign}
            disabled={loading || !prompt.trim()}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-lg font-bold transition"
          >
            {loading ? (
              <span className="flex justify-center items-center gap-2 animate-pulse">
                <FiPlayCircle size={20} /> Generating...
              </span>
            ) : (
              "Generate Design"
            )}
          </button>
          {error && <p className="mt-3 text-red-400 text-center">{error}</p>}
        </section>

        {/* Live Preview */}
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-blue-400 text-center">
            Live Preview
          </h2>
          <iframe
            ref={iframeRef}
            title="Live Preview"
            className="w-full h-[400px] bg-white border border-gray-700 rounded-lg shadow-lg"
            sandbox="allow-scripts allow-same-origin"
          />
        </section>

        {/* Code Editor */}
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-green-400 text-center">
            Code Output (Editable)
          </h2>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-[300px] bg-gray-900 text-green-400 p-4 rounded-lg border border-gray-700 font-mono text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          />
        </section>
      </div>
    </div>
  );
}
