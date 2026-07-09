"use client";

import { useState, useEffect, useRef } from "react";

export default function SeoKeywordResearch() {
  const [query, setQuery] = useState("");
  const [selectedEngines, setSelectedEngines] = useState(["ac", "paa", "rs"]);
  const [domain, setDomain] = useState("google.co.in");
  const [country, setCountry] = useState("in");
  const [language, setLanguage] = useState("en");
  const [depthLimit, setDepthLimit] = useState(1);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null); // 'autocomplete' | 'paa' | 'rs' | 'all' | null
  const [copiedItem, setCopiedItem] = useState(null);

  // History state
  const [history, setHistory] = useState([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Pre-load API Key and History from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("serpapiKey") || "";
      setApiKey(savedKey);

      const savedHistory = localStorage.getItem("seo_research_history");
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to parse SEO research history:", e);
        }
      }
    }
  }, []);

  // Save API Key to localStorage when updated
  const handleApiKeyChange = (e) => {
    const key = e.target.value;
    setApiKey(key);
    if (typeof window !== "undefined") {
      localStorage.setItem("serpapiKey", key);
    }
  };

  // Toggle engine selection
  const toggleEngine = (engine) => {
    if (selectedEngines.includes(engine)) {
      if (selectedEngines.length > 1) {
        setSelectedEngines(selectedEngines.filter((e) => e !== engine));
      }
    } else {
      setSelectedEngines([...selectedEngines, engine]);
    }
  };

  // Loading messages interval rotation
  useEffect(() => {
    let interval;
    if (loading) {
      const messages = [
        "Connecting to SerpApi secure servers...",
        "Querying Google Search Engine database...",
        "Extracting Autocomplete keyword suggestions...",
        "Scraping 'People Also Ask' recursive question tree...",
        "Compiling 'Related Searches' keywords...",
        "Formatting results into responsive data packages..."
      ];
      let index = 0;
      setLoadingMessage(messages[0]);
      interval = setInterval(() => {
        index = (index + 1) % messages.length;
        setLoadingMessage(messages[index]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Submit keyword research query
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      setError("Please enter a search query.");
      return;
    }
    if (!apiKey.trim()) {
      setError("Please provide a SerpApi key. A free plan is available at serpapi.com.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch(`${apiUrl}/api/admin/seo-keywords`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        },
        body: JSON.stringify({
          query: query.trim(),
          engines: selectedEngines,
          domain,
          country,
          language,
          depthLimit,
          apiKey: apiKey.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResults(data.data);
        
        // Add to history
        const newHistoryItem = {
          id: Date.now(),
          query: query.trim(),
          engines: [...selectedEngines],
          date: new Date().toLocaleString(),
          data: data.data,
        };

        const updatedHistory = [newHistoryItem, ...history.filter((h) => h.query.toLowerCase() !== query.trim().toLowerCase())].slice(0, 10);
        setHistory(updatedHistory);
        if (typeof window !== "undefined") {
          localStorage.setItem("seo_research_history", JSON.stringify(updatedHistory));
        }
      } else {
        setError(data.message || "An error occurred during keyword research.");
      }
    } catch (err) {
      console.error("SEO research request failed:", err);
      setError("Failed to communicate with the keyword research API.");
    } finally {
      setLoading(false);
    }
  };

  // Load research result from history
  const loadHistoryItem = (item) => {
    setQuery(item.query);
    setSelectedEngines(item.engines);
    setResults(item.data);
    setError(null);
  };

  // Clear history list
  const clearHistory = () => {
    setHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("seo_research_history");
    }
  };

  // Copy helper
  const copyToClipboard = (text, key, itemVal = null) => {
    navigator.clipboard.writeText(text);
    if (itemVal) {
      setCopiedItem(itemVal);
      setTimeout(() => setCopiedItem(null), 1500);
    } else {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  };

  // Export functions
  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsJson = () => {
    if (!results) return;
    const jsonString = JSON.stringify(results, null, 2);
    const safeQuery = query.toLowerCase().replace(/[^a-z0-9]/g, "_");
    downloadFile(jsonString, `seo_keywords_${safeQuery}.json`, "application/json");
  };

  const exportAsTxt = () => {
    if (!results) return;
    let txt = `SEO Keyword Research Report for: "${query}"\n`;
    txt += `Generated on: ${new Date().toLocaleString()}\n`;
    txt += `==========================================\n\n`;

    if (results.autocomplete && results.autocomplete.length > 0) {
      txt += `GOOGLE AUTOCOMPLETE SUGGESTIONS\n`;
      txt += `--------------------------------\n`;
      results.autocomplete.forEach((keyword) => {
        txt += `- ${keyword}\n`;
      });
      txt += `\n`;
    }

    if (results.people_also_ask && results.people_also_ask.length > 0) {
      txt += `PEOPLE ALSO ASK QUESTIONS\n`;
      txt += `-------------------------\n`;
      results.people_also_ask.forEach((q) => {
        txt += `- ${q}\n`;
      });
      txt += `\n`;
    }

    if (results.related_searches && results.related_searches.length > 0) {
      txt += `RELATED SEARCHES (PEOPLE ALSO SEARCH FOR)\n`;
      txt += `-----------------------------------------\n`;
      results.related_searches.forEach((keyword) => {
        txt += `- ${keyword}\n`;
      });
    }

    const safeQuery = query.toLowerCase().replace(/[^a-z0-9]/g, "_");
    downloadFile(txt, `seo_keywords_${safeQuery}.txt`, "text/plain");
  };

  const exportAsCsv = () => {
    if (!results) return;
    let csv = `"Engine","Keyword/Question"\n`;

    if (results.autocomplete) {
      results.autocomplete.forEach((keyword) => {
        csv += `"Autocomplete","${keyword.replace(/"/g, '""')}"\n`;
      });
    }

    if (results.people_also_ask) {
      results.people_also_ask.forEach((q) => {
        csv += `"People Also Ask","${q.replace(/"/g, '""')}"\n`;
      });
    }

    if (results.related_searches) {
      results.related_searches.forEach((keyword) => {
        csv += `"Related Searches","${keyword.replace(/"/g, '""')}"\n`;
      });
    }

    const safeQuery = query.toLowerCase().replace(/[^a-z0-9]/g, "_");
    downloadFile(csv, `seo_keywords_${safeQuery}.csv`, "text/csv");
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 scale-125 pointer-events-none">
          <i className="fas fa-search-plus text-9xl text-white"></i>
        </div>
        <div className="relative z-10 max-w-3xl space-y-2">
          <span className="bg-white/20 text-white text-xs uppercase tracking-wider font-semibold px-3 py-1 rounded-full backdrop-blur-md">
            SEO Optimization Suite
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2">
            SEO Keyword Research Tool
          </h1>
          <p className="text-blue-100 font-medium">
            Generate high-performing, user-intent-focused keyword ideas by scraping Google Autocomplete, People Also Ask questions, and Related Searches. Use these insights to optimize petition descriptions, headlines, and tags.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Search Panel - Left (Take 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <i className="fas fa-filter text-blue-600"></i> Research Parameters
            </h2>

            <form onSubmit={handleSearch} className="space-y-6">
              {/* Search Query */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">
                  Primary Search Term / Keyword
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <i className="fas fa-search"></i>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. start a petition, verification in India, environment crowdfunding..."
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm outline-none"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Scraping Engines Selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">
                  Keyword Sources (Select one or more)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => toggleEngine("ac")}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                      selectedEngines.includes("ac")
                        ? "border-emerald-500 bg-emerald-50/40 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "border-gray-200 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <i className="fas fa-keyboard text-emerald-600"></i>
                      <div className="text-sm">
                        <span className="font-semibold block">Autocomplete</span>
                        <span className="text-xs text-gray-500">Google Suggestions</span>
                      </div>
                    </div>
                    {selectedEngines.includes("ac") && (
                      <i className="fas fa-check-circle text-emerald-600"></i>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleEngine("paa")}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                      selectedEngines.includes("paa")
                        ? "border-purple-500 bg-purple-50/40 text-purple-800 ring-2 ring-purple-500/20"
                        : "border-gray-200 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <i className="fas fa-question-circle text-purple-600"></i>
                      <div className="text-sm">
                        <span className="font-semibold block">People Also Ask</span>
                        <span className="text-xs text-gray-500">Related Questions</span>
                      </div>
                    </div>
                    {selectedEngines.includes("paa") && (
                      <i className="fas fa-check-circle text-purple-600"></i>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleEngine("rs")}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                      selectedEngines.includes("rs")
                        ? "border-amber-500 bg-amber-50/40 text-amber-800 ring-2 ring-amber-500/20"
                        : "border-gray-200 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <i className="fas fa-link text-amber-600"></i>
                      <div className="text-sm">
                        <span className="font-semibold block">Related Searches</span>
                        <span className="text-xs text-gray-500">People Also Search For</span>
                      </div>
                    </div>
                    {selectedEngines.includes("rs") && (
                      <i className="fas fa-check-circle text-amber-600"></i>
                    )}
                  </button>
                </div>
              </div>

              {/* SerpApi Key Panel */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-blue-900 flex items-center gap-1.5">
                    <i className="fas fa-key text-blue-600"></i> SerpApi Credentials
                  </label>
                  <a
                    href="https://serpapi.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Get Free Key <i className="fas fa-external-link-alt text-[10px]"></i>
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    required
                    placeholder="Enter your SerpApi API Key..."
                    className="block w-full pr-10 pl-4 py-2.5 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none font-mono"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <i className={showKey ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  </button>
                </div>
                <p className="text-xs text-blue-800">
                  Your API Key will be stored locally in your browser's secure cache so you won't need to re-enter it next time.
                </p>
              </div>

              {/* Advanced Controls Toggle */}
              <div className="border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <i className={`fas fa-chevron-${showAdvanced ? "up" : "down"} text-xs`}></i>
                  Advanced SEO Scraper Options
                </button>

                {showAdvanced && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Google Domain</label>
                      <input
                        type="text"
                        placeholder="google.co.in"
                        className="block w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Country Code (gl)</label>
                      <input
                        type="text"
                        placeholder="in"
                        className="block w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Language Code (hl)</label>
                      <input
                        type="text"
                        placeholder="en"
                        className="block w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 flex items-center justify-between">
                        <span>PAA Depth Limit</span>
                        <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                          {depthLimit}
                        </span>
                      </label>
                      <select
                        className="block w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500"
                        value={depthLimit}
                        onChange={(e) => setDepthLimit(parseInt(e.target.value))}
                        disabled={!selectedEngines.includes("paa")}
                      >
                        <option value="1">1 (Fast - ~5 q's)</option>
                        <option value="2">2 (Medium - ~25 q's)</option>
                        <option value="3">3 (Deep - ~125 q's)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold px-6 py-3.5 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2.5 disabled:from-blue-400 disabled:to-indigo-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <i className="fas fa-circle-notch animate-spin"></i>
                    <span>Researching Keywords...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-cogs"></i>
                    <span>Generate SEO Keywords</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* History Sidebar - Right (Take 1 column) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <i className="fas fa-history text-indigo-600"></i> Session History
                </h2>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs text-red-600 hover:underline hover:text-red-700 font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-8 text-center text-gray-400 space-y-2">
                  <i className="fas fa-folder-open text-4xl opacity-50"></i>
                  <p className="text-sm font-medium">No search history yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5 overflow-y-auto max-h-[400px] pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className="group cursor-pointer p-3.5 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 rounded-2xl transition-all duration-200 relative overflow-hidden"
                    >
                      <div className="absolute right-2 top-2 text-[10px] text-gray-400 group-hover:text-indigo-500 font-mono">
                        {item.engines.map((eng) => eng.toUpperCase()).join(", ")}
                      </div>
                      <div className="font-semibold text-gray-800 group-hover:text-indigo-900 text-sm truncate max-w-[80%]">
                        {item.query}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                        <i className="far fa-clock"></i> {item.date.split(",")[1]?.trim() || item.date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-indigo-50/60 border border-indigo-100/50 rounded-2xl p-4 mt-4 space-y-2">
              <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                SEO Placement Strategy:
              </h3>
              <ul className="text-xs text-indigo-800 space-y-1.5 list-disc pl-4 font-medium">
                <li>Embed <strong>Autocomplete</strong> keywords in tags and URL slugs.</li>
                <li>Write <strong>People Also Ask</strong> questions verbatim as H2/H3 headings, with verified petition facts as answers.</li>
                <li>Sprinkle <strong>Related Searches</strong> in petition problem descriptions and titles for better search semantic rank.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 shadow-xl p-12 flex flex-col items-center justify-center min-h-[350px] space-y-4 transition-all duration-300">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-search text-blue-600 text-xl animate-pulse"></i>
            </div>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-gray-900">Scraping Intent Keywords</h3>
            <p className="text-sm text-gray-500 font-medium animate-pulse">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-5 rounded-3xl shadow-sm flex items-start gap-3.5 max-w-4xl mx-auto">
          <div className="bg-red-100 text-red-600 p-2.5 rounded-2xl">
            <i className="fas fa-exclamation-triangle text-xl"></i>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-red-950">Keyword Research Failed</h3>
            <p className="text-sm text-red-700 leading-relaxed font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results && !loading && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden animate-slide-up space-y-6 p-6">
          
          {/* Results Action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest block">
                Research Results
              </span>
              <h2 className="text-2xl font-extrabold text-gray-900">
                SEO Keywords for: <span className="text-indigo-600">"{query}"</span>
              </h2>
            </div>
            
            {/* Export buttons */}
            <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
              <span className="text-xs text-gray-500 font-bold px-3">Export:</span>
              <button
                onClick={exportAsJson}
                className="bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-700 text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <i className="fas fa-file-code text-blue-600"></i> JSON
              </button>
              <button
                onClick={exportAsCsv}
                className="bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-700 text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <i className="fas fa-file-csv text-emerald-600"></i> CSV
              </button>
              <button
                onClick={exportAsTxt}
                className="bg-white border border-gray-200 hover:border-purple-500 hover:text-purple-600 text-gray-700 text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <i className="fas fa-file-alt text-purple-600"></i> TXT
              </button>
            </div>
          </div>

          {/* 3-Column Results Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Col 1: Google Autocomplete */}
            <div className="bg-emerald-50/20 rounded-2xl border border-emerald-100 p-5 space-y-4 flex flex-col justify-between min-h-[400px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-100/50 pb-2">
                  <h3 className="font-extrabold text-emerald-950 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <i className="fas fa-keyboard text-emerald-600"></i> Google Autocomplete ({results.autocomplete?.length || 0})
                  </h3>
                  {results.autocomplete && results.autocomplete.length > 0 && (
                    <button
                      onClick={() =>
                        copyToClipboard(results.autocomplete.join("\n"), "autocomplete")
                      }
                      className="text-emerald-700 hover:text-emerald-800 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      {copiedKey === "autocomplete" ? (
                        <>
                          <i className="fas fa-check text-[10px]"></i> Copied!
                        </>
                      ) : (
                        <>
                          <i className="far fa-copy text-[10px]"></i> Copy All
                        </>
                      )}
                    </button>
                  )}
                </div>

                {(!results.autocomplete || results.autocomplete.length === 0) ? (
                  <p className="text-xs text-gray-500 font-medium italic py-4">
                    No suggestions returned. Try a broader search term.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
                    {results.autocomplete.map((keyword, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 bg-white border border-emerald-100/30 rounded-xl text-xs font-medium text-gray-700 hover:border-emerald-300 transition-colors"
                      >
                        <span className="truncate max-w-[85%]">{keyword}</span>
                        <button
                          onClick={() => copyToClipboard(keyword, null, `ac-${index}`)}
                          className="text-gray-400 hover:text-emerald-600"
                        >
                          <i className={copiedItem === `ac-${index}` ? "fas fa-check text-emerald-600" : "far fa-copy"}></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Col 2: People Also Ask */}
            <div className="bg-purple-50/20 rounded-2xl border border-purple-100 p-5 space-y-4 flex flex-col justify-between min-h-[400px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100/50 pb-2">
                  <h3 className="font-extrabold text-purple-950 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <i className="fas fa-question-circle text-purple-600"></i> People Also Ask ({results.people_also_ask?.length || 0})
                  </h3>
                  {results.people_also_ask && results.people_also_ask.length > 0 && (
                    <button
                      onClick={() =>
                        copyToClipboard(results.people_also_ask.join("\n"), "paa")
                      }
                      className="text-purple-700 hover:text-purple-800 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      {copiedKey === "paa" ? (
                        <>
                          <i className="fas fa-check text-[10px]"></i> Copied!
                        </>
                      ) : (
                        <>
                          <i className="far fa-copy text-[10px]"></i> Copy All
                        </>
                      )}
                    </button>
                  )}
                </div>

                {(!results.people_also_ask || results.people_also_ask.length === 0) ? (
                  <p className="text-xs text-gray-500 font-medium italic py-4">
                    No questions returned. Some keywords don't trigger query trees.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
                    {results.people_also_ask.map((question, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-2.5 bg-white border border-purple-100/30 rounded-xl text-xs font-medium text-gray-700 hover:border-purple-300 transition-colors gap-2"
                      >
                        <span className="leading-relaxed">{question}</span>
                        <button
                          onClick={() => copyToClipboard(question, null, `paa-${index}`)}
                          className="text-gray-400 hover:text-purple-600 flex-shrink-0 mt-0.5"
                        >
                          <i className={copiedItem === `paa-${index}` ? "fas fa-check text-purple-600" : "far fa-copy"}></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Col 3: Related Searches */}
            <div className="bg-amber-50/20 rounded-2xl border border-amber-100 p-5 space-y-4 flex flex-col justify-between min-h-[400px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-amber-100/50 pb-2">
                  <h3 className="font-extrabold text-amber-950 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <i className="fas fa-link text-amber-600"></i> Related Searches ({results.related_searches?.length || 0})
                  </h3>
                  {results.related_searches && results.related_searches.length > 0 && (
                    <button
                      onClick={() =>
                        copyToClipboard(results.related_searches.join("\n"), "rs")
                      }
                      className="text-amber-700 hover:text-amber-800 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      {copiedKey === "rs" ? (
                        <>
                          <i className="fas fa-check text-[10px]"></i> Copied!
                        </>
                      ) : (
                        <>
                          <i className="far fa-copy text-[10px]"></i> Copy All
                        </>
                      )}
                    </button>
                  )}
                </div>

                {(!results.related_searches || results.related_searches.length === 0) ? (
                  <p className="text-xs text-gray-500 font-medium italic py-4">
                    No related searches returned.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
                    {results.related_searches.map((keyword, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 bg-white border border-amber-100/30 rounded-xl text-xs font-medium text-gray-700 hover:border-amber-300 transition-colors"
                      >
                        <span className="truncate max-w-[85%]">{keyword}</span>
                        <button
                          onClick={() => copyToClipboard(keyword, null, `rs-${index}`)}
                          className="text-gray-400 hover:text-amber-600"
                        >
                          <i className={copiedItem === `rs-${index}` ? "fas fa-check text-amber-600" : "far fa-copy"}></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
