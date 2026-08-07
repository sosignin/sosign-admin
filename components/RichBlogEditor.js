"use client";

import { useState, useRef, useEffect } from "react";

export default function RichBlogEditor({ value, onChange, title, author, category, imagePreview }) {
    const editorRef = useRef(null);
    const lastHtmlRef = useRef(value || "");

    const [activeTab, setActiveTab] = useState("visual"); // "visual" | "html" | "preview"
    const [htmlContent, setHtmlContent] = useState(value || "");
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [imageAlt, setImageAlt] = useState("");
    const [selectedFont, setSelectedFont] = useState("Outfit");
    const [selectedSize, setSelectedSize] = useState("16px");

    // Colors
    const [textColor, setTextColor] = useState("#0f172a");
    const [bgColor, setBgColor] = useState("#ffffff");
    const [showTextColorPicker, setShowTextColorPicker] = useState(false);
    const [showBgColorPicker, setShowBgColorPicker] = useState(false);

    // Sync external value with editor ONLY when value changes externally (e.g., initial fetch)
    useEffect(() => {
        const incomingVal = value || "";
        if (incomingVal !== lastHtmlRef.current) {
            lastHtmlRef.current = incomingVal;
            setHtmlContent(incomingVal);
            if (editorRef.current && activeTab === "visual") {
                editorRef.current.innerHTML = incomingVal;
            }
        }
    }, [value, activeTab]);

    // Handle tab switching
    useEffect(() => {
        if (activeTab === "visual" && editorRef.current) {
            if (editorRef.current.innerHTML !== htmlContent) {
                editorRef.current.innerHTML = htmlContent;
            }
        }
    }, [activeTab]);

    // Called on every input event in contentEditable
    const handleInput = () => {
        if (editorRef.current) {
            const newContent = editorRef.current.innerHTML;
            lastHtmlRef.current = newContent;
            setHtmlContent(newContent);
            if (onChange) onChange(newContent);
        }
    };

    // Smart Paste Handler: Preserves exact paragraph structure, headings, lists, formatting & line breaks
    const handlePaste = (e) => {
        e.preventDefault();

        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        const pastedHtml = clipboardData.getData("text/html");
        const pastedText = clipboardData.getData("text/plain");

        let finalHtml = "";

        if (pastedHtml && pastedHtml.trim().length > 0) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(pastedHtml, "text/html");

                // Remove scripts, styles, meta, xml tags
                const elementsToRemove = doc.querySelectorAll("script, style, meta, link, xml, object, embed");
                elementsToRemove.forEach((el) => el.remove());

                // Remove MS Word comments
                const iterator = doc.createNodeIterator(doc.body, NodeFilter.SHOW_COMMENT);
                let commentNode;
                while ((commentNode = iterator.nextNode())) {
                    if (commentNode.parentNode) {
                        commentNode.parentNode.removeChild(commentNode);
                    }
                }

                // Clean attributes & styles from MS Word/Office while preserving semantics
                const body = doc.body;

                // Ensure top-level block structure: wrap orphan text or inline elements into <p> tags
                const newNodes = [];
                let currentP = null;

                Array.from(body.childNodes).forEach((node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const text = node.textContent;
                        if (text && text.trim().length > 0) {
                            if (!currentP) {
                                currentP = doc.createElement("p");
                                newNodes.push(currentP);
                            }
                            currentP.appendChild(node.cloneNode(true));
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        const tag = node.tagName.toLowerCase();
                        const isBlock = [
                            "p",
                            "h1",
                            "h2",
                            "h3",
                            "h4",
                            "h5",
                            "h6",
                            "ul",
                            "ol",
                            "li",
                            "blockquote",
                            "pre",
                            "table",
                            "div",
                            "hr",
                        ].includes(tag);

                        if (isBlock) {
                            currentP = null;
                            if (tag === "div") {
                                // Convert <div> to <p> if it only contains text/inline elements
                                const hasBlockChild = Array.from(node.children).some((child) =>
                                    [
                                        "p",
                                        "h1",
                                        "h2",
                                        "h3",
                                        "h4",
                                        "h5",
                                        "h6",
                                        "ul",
                                        "ol",
                                        "div",
                                        "blockquote",
                                    ].includes(child.tagName.toLowerCase())
                                );
                                if (!hasBlockChild) {
                                    const p = doc.createElement("p");
                                    p.innerHTML = node.innerHTML;
                                    newNodes.push(p);
                                } else {
                                    newNodes.push(node.cloneNode(true));
                                }
                            } else {
                                newNodes.push(node.cloneNode(true));
                            }
                        } else {
                            if (!currentP) {
                                currentP = doc.createElement("p");
                                newNodes.push(currentP);
                            }
                            currentP.appendChild(node.cloneNode(true));
                        }
                    }
                });

                if (newNodes.length > 0) {
                    body.innerHTML = "";
                    newNodes.forEach((n) => body.appendChild(n));
                }

                finalHtml = body.innerHTML;
            } catch (err) {
                console.error("Error parsing pasted HTML:", err);
            }
        }

        // Fallback to plain text with preserved paragraph breaks (\n\n or \n)
        if (!finalHtml || finalHtml.trim().length === 0) {
            if (pastedText) {
                const blocks = pastedText
                    .split(/\r?\n\r?\n/)
                    .map((block) => block.trim())
                    .filter((block) => block.length > 0);

                if (blocks.length > 0) {
                    finalHtml = blocks
                        .map((block) => {
                            const lines = block
                                .split(/\r?\n/)
                                .map((l) => l.trim())
                                .filter((l) => l.length > 0);
                            return `<p>${lines.join("<br>")}</p>`;
                        })
                        .join("");
                } else {
                    finalHtml = `<p>${pastedText.replace(/\r?\n/g, "<br>")}</p>`;
                }
            }
        }

        if (finalHtml) {
            document.execCommand("insertHTML", false, finalHtml);
            handleInput();
        }
    };

    // Called when editing raw HTML in HTML tab
    const handleHtmlChange = (e) => {
        const newContent = e.target.value;
        lastHtmlRef.current = newContent;
        setHtmlContent(newContent);
        if (onChange) onChange(newContent);
    };

    // Rich Text Formatting Commands using document.execCommand
    const exec = (command, val = null) => {
        if (activeTab !== "visual") return;
        document.execCommand(command, false, val);
        handleInput();
        if (editorRef.current) editorRef.current.focus();
    };

    // Custom Font Family change
    const applyFontFamily = (fontName) => {
        setSelectedFont(fontName);
        if (activeTab !== "visual" || !editorRef.current) return;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const span = document.createElement("span");
            span.style.fontFamily = fontName;
            span.appendChild(range.extractContents());
            range.insertNode(span);
        } else {
            // Apply font-family to entire editor content if no text selected
            const currentHtml = editorRef.current.innerHTML;
            if (currentHtml.trim()) {
                editorRef.current.innerHTML = `<div style="font-family: ${fontName}">${currentHtml}</div>`;
            } else {
                exec("fontName", fontName);
            }
        }
        handleInput();
    };

    // Custom Font Size change
    const applyFontSize = (sizePx) => {
        setSelectedSize(sizePx);
        if (activeTab !== "visual" || !editorRef.current) return;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const span = document.createElement("span");
            span.style.fontSize = sizePx;
            span.appendChild(range.extractContents());
            range.insertNode(span);
        } else {
            // Apply font-size to entire editor content if no text selected
            const currentHtml = editorRef.current.innerHTML;
            if (currentHtml.trim()) {
                editorRef.current.innerHTML = `<div style="font-size: ${sizePx}">${currentHtml}</div>`;
            }
        }
        handleInput();
    };

    // Apply Text Color
    const applyTextColor = (color) => {
        setTextColor(color);
        setShowTextColorPicker(false);
        if (activeTab !== "visual" || !editorRef.current) return;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const span = document.createElement("span");
            span.style.color = color;
            span.appendChild(range.extractContents());
            range.insertNode(span);
        } else {
            exec("foreColor", color);
        }
        handleInput();
    };

    // Apply Background / Highlight Color
    const applyBgColor = (color) => {
        setBgColor(color);
        setShowBgColorPicker(false);
        if (activeTab !== "visual" || !editorRef.current) return;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const span = document.createElement("span");
            span.style.backgroundColor = color;
            span.style.padding = "2px 4px";
            span.style.borderRadius = "4px";
            span.appendChild(range.extractContents());
            range.insertNode(span);
        } else {
            exec("hiliteColor", color);
        }
        handleInput();
    };

    // Block formatting (Heading 1..4, p, blockquote, pre)
    const applyBlockFormat = (tag) => {
        if (activeTab !== "visual") return;
        if (tag === "blockquote") {
            exec("formatBlock", "blockquote");
        } else if (tag === "pre") {
            exec("formatBlock", "pre");
        } else if (tag.startsWith("h")) {
            exec("formatBlock", tag);
        } else {
            exec("formatBlock", "p");
        }
    };

    // Insert Callout Box
    const insertCallout = () => {
        if (activeTab !== "visual") return;
        const calloutHtml = `<div class="callout-box"><strong>💡 Tip / Note:</strong> Write your highlighted note or message here...</div><p><br></p>`;
        exec("insertHTML", calloutHtml);
    };

    // Insert Horizontal Divider
    const insertHr = () => {
        if (activeTab !== "visual") return;
        exec("insertHorizontalRule");
    };

    // Add Link Modal submit
    const handleInsertLink = (e) => {
        e.preventDefault();
        if (!linkUrl) return;
        if (activeTab === "visual") {
            const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText || linkUrl}</a>`;
            exec("insertHTML", linkHtml);
        }
        setLinkUrl("");
        setLinkText("");
        setShowLinkModal(false);
    };

    // Add Image Modal submit
    const handleInsertImage = (e) => {
        e.preventDefault();
        if (!imageUrl) return;
        if (activeTab === "visual") {
            const imgHtml = `<img src="${imageUrl}" alt="${imageAlt || "Blog image"}" class="rounded-xl my-4 max-w-full shadow-md" />`;
            exec("insertHTML", imgHtml);
        }
        setImageUrl("");
        setImageAlt("");
        setShowImageModal(false);
    };

    // Stats calculations
    const cleanText = htmlContent.replace(/<[^>]*>/g, " ").trim();
    const wordCount = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Preset color palettes
    const textColors = [
        "#0f172a", "#334155", "#06b6d4", "#0284c7", "#3b82f6",
        "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#10b981"
    ];

    const bgColors = [
        "transparent", "#fef08a", "#cffaff", "#dcfce7", "#fce7f3",
        "#f3e8ff", "#ffedd5", "#e0f2fe", "#f1f5f9", "#fee2e2"
    ];

    // Font families definition
    const fontOptions = [
        { label: "Outfit (Modern Sans)", value: "'Outfit', sans-serif" },
        { label: "Inter (Clean Sans)", value: "'Inter', sans-serif" },
        { label: "Playfair Display (Editorial)", value: "'Playfair Display', serif" },
        { label: "Merriweather (Serif)", value: "'Merriweather', serif" },
        { label: "Montserrat (Geometric)", value: "'Montserrat', sans-serif" },
        { label: "Fira Code (Monospace)", value: "'Fira Code', monospace" },
        { label: "Caveat (Handwritten)", value: "'Caveat', cursive" },
        { label: "Georgia (Classic)", value: "Georgia, serif" },
        { label: "Impact (Bold Display)", value: "Impact, sans-serif" },
    ];

    // Font sizes definition
    const fontSizes = [
        { label: "12px - Small", value: "12px" },
        { label: "14px - Compact", value: "14px" },
        { label: "16px - Regular", value: "16px" },
        { label: "18px - Medium", value: "18px" },
        { label: "20px - Large", value: "20px" },
        { label: "24px - Extra Large", value: "24px" },
        { label: "30px - Heading 2", value: "30px" },
        { label: "36px - Heading 1", value: "36px" },
        { label: "48px - Hero", value: "48px" },
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all">
            {/* Top Toolbar Tabs & Stats Header */}
            <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 text-white p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                    <button
                        type="button"
                        onClick={() => setActiveTab("visual")}
                        className={`px-4 py-2 rounded-lg font-medium text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === "visual"
                                ? "bg-cyan-500 text-white shadow-md font-semibold"
                                : "text-gray-300 hover:text-white hover:bg-slate-700/50"
                        }`}
                    >
                        <i className="fas fa-edit text-cyan-200"></i>
                        Visual Editor
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("html")}
                        className={`px-4 py-2 rounded-lg font-medium text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === "html"
                                ? "bg-cyan-500 text-white shadow-md font-semibold"
                                : "text-gray-300 hover:text-white hover:bg-slate-700/50"
                        }`}
                    >
                        <i className="fas fa-code text-cyan-200"></i>
                        HTML Source
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("preview")}
                        className={`px-4 py-2 rounded-lg font-medium text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === "preview"
                                ? "bg-cyan-500 text-white shadow-md font-semibold"
                                : "text-gray-300 hover:text-white hover:bg-slate-700/50"
                        }`}
                    >
                        <i className="fas fa-eye text-cyan-200"></i>
                        Live Preview
                    </button>
                </div>

                {/* Word & Reading Time Stats */}
                <div className="flex items-center gap-4 text-xs md:text-sm text-slate-300">
                    <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                        <i className="fas fa-file-alt text-cyan-400"></i>
                        <strong>{wordCount}</strong> words
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                        <i className="fas fa-clock text-pink-400"></i>
                        <strong>{readingTime}</strong> min read
                    </span>
                </div>
            </div>

            {/* Formatting Toolbar (Only in Visual Editor) */}
            {activeTab === "visual" && (
                <div className="bg-slate-50 border-b border-gray-200 p-3 flex flex-wrap items-center gap-2 text-sm sticky top-0 z-20 shadow-xs">
                    {/* Font Family Selector */}
                    <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-1">
                        <i className="fas fa-font text-gray-500 text-xs"></i>
                        <select
                            value={selectedFont}
                            onChange={(e) => applyFontFamily(e.target.value)}
                            className="bg-transparent text-xs font-medium text-gray-700 outline-none cursor-pointer pr-1"
                            title="Font Family / Style"
                        >
                            {fontOptions.map((f) => (
                                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                                    {f.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Font Size Selector */}
                    <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-1">
                        <i className="fas fa-text-height text-gray-500 text-xs"></i>
                        <select
                            value={selectedSize}
                            onChange={(e) => applyFontSize(e.target.value)}
                            className="bg-transparent text-xs font-medium text-gray-700 outline-none cursor-pointer pr-1"
                            title="Font Size"
                        >
                            {fontSizes.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-[1px] bg-gray-300 mx-1 hidden sm:block"></div>

                    {/* Headings / Block Type Dropdown */}
                    <select
                        onChange={(e) => applyBlockFormat(e.target.value)}
                        defaultValue="p"
                        className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-700 outline-none cursor-pointer"
                        title="Headings & Format Block"
                    >
                        <option value="p">Paragraph</option>
                        <option value="h1">Heading 1 (H1)</option>
                        <option value="h2">Heading 2 (H2)</option>
                        <option value="h3">Heading 3 (H3)</option>
                        <option value="h4">Heading 4 (H4)</option>
                        <option value="blockquote">Quote Block</option>
                        <option value="pre">Code Block</option>
                    </select>

                    {/* Divider */}
                    <div className="h-6 w-[1px] bg-gray-300 mx-1"></div>

                    {/* Text Styling Actions */}
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => exec("bold")}
                            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold cursor-pointer"
                            title="Bold (Ctrl+B)"
                        >
                            <i className="fas fa-bold"></i>
                        </button>
                        <button
                            type="button"
                            onClick={() => exec("italic")}
                            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 italic cursor-pointer"
                            title="Italic (Ctrl+I)"
                        >
                            <i className="fas fa-italic"></i>
                        </button>
                        <button
                            type="button"
                            onClick={() => exec("underline")}
                            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 underline cursor-pointer"
                            title="Underline (Ctrl+U)"
                        >
                            <i className="fas fa-underline"></i>
                        </button>
                        <button
                            type="button"
                            onClick={() => exec("strikeThrough")}
                            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 line-through cursor-pointer"
                            title="Strikethrough"
                        >
                            <i className="fas fa-strikethrough"></i>
                        </button>
                    </div>

                    {/* Text & Background Color Pickers */}
                    <div className="relative flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                        {/* Forecolor */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowTextColorPicker(!showTextColorPicker);
                                    setShowBgColorPicker(false);
                                }}
                                className="w-7 h-7 rounded hover:bg-gray-100 flex flex-col items-center justify-center text-gray-700 cursor-pointer"
                                title="Text Color"
                            >
                                <span className="font-bold text-xs">A</span>
                                <span className="w-4 h-1 rounded-full" style={{ backgroundColor: textColor }}></span>
                            </button>

                            {showTextColorPicker && (
                                <div className="absolute top-9 left-0 z-30 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-48 space-y-2">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Text Color</p>
                                    <div className="grid grid-cols-5 gap-2">
                                        {textColors.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => applyTextColor(c)}
                                                className="w-6 h-6 rounded-full border border-gray-300 shadow-xs hover:scale-110 transition-transform cursor-pointer"
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                    <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={textColor}
                                            onChange={(e) => applyTextColor(e.target.value)}
                                            className="w-7 h-7 rounded cursor-pointer border-0"
                                        />
                                        <span className="text-xs text-gray-600 font-mono">{textColor}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Backcolor / Highlight */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowBgColorPicker(!showBgColorPicker);
                                    setShowTextColorPicker(false);
                                }}
                                className="w-7 h-7 rounded hover:bg-gray-100 flex flex-col items-center justify-center text-gray-700 cursor-pointer"
                                title="Background Highlight Color"
                            >
                                <i className="fas fa-highlighter text-xs"></i>
                                <span className="w-4 h-1 rounded-full border" style={{ backgroundColor: bgColor }}></span>
                            </button>

                            {showBgColorPicker && (
                                <div className="absolute top-9 left-0 z-30 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-48 space-y-2">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Highlight Color</p>
                                    <div className="grid grid-cols-5 gap-2">
                                        {bgColors.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => applyBgColor(c)}
                                                className="w-6 h-6 rounded-full border border-gray-300 shadow-xs hover:scale-110 transition-transform cursor-pointer"
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                    <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={bgColor === "transparent" ? "#ffffff" : bgColor}
                                            onChange={(e) => applyBgColor(e.target.value)}
                                            className="w-7 h-7 rounded cursor-pointer border-0"
                                        />
                                        <span className="text-xs text-gray-600 font-mono">{bgColor}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-[1px] bg-gray-300 mx-1"></div>

                    {/* Text Alignment */}
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => exec("justifyLeft")}
                            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 cursor-pointer"
                            title="Align Left"
                        >
                            <i className="fas fa-align-left"></i>
                        </button>
                        <button
                            type="button"
                            onClick={() => exec("justifyCenter")}
                            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 cursor-pointer"
                            title="Align Center"
                        >
                            <i className="fas fa-align-center"></i>
                        </button>
                        <button
                            type="button"
                            onClick={() => exec("justifyRight")}
                            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 cursor-pointer"
                            title="Align Right"
                        >
                            <i className="fas fa-align-right"></i>
                        </button>
                        <button
                            type="button"
                            onClick={() => exec("justifyFull")}
                            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 cursor-pointer"
                            title="Justify"
                        >
                            <i className="fas fa-align-justify"></i>
                        </button>
                    </div>

                    {/* Lists */}
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => exec("insertUnorderedList")}
                            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 cursor-pointer"
                            title="Bullet List"
                        >
                            <i className="fas fa-list-ul"></i>
                        </button>
                        <button
                            type="button"
                            onClick={() => exec("insertOrderedList")}
                            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 cursor-pointer"
                            title="Numbered List"
                        >
                            <i className="fas fa-list-ol"></i>
                        </button>
                    </div>

                    {/* Insert Link, Image, Callout */}
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setShowLinkModal(true)}
                            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-[#0284c7] cursor-pointer"
                            title="Insert Link"
                        >
                            <i className="fas fa-link"></i>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowImageModal(true)}
                            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-emerald-600 cursor-pointer"
                            title="Insert Image URL"
                        >
                            <i className="fas fa-image"></i>
                        </button>
                        <button
                            type="button"
                            onClick={insertCallout}
                            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-amber-500 cursor-pointer"
                            title="Insert Callout Note Box"
                        >
                            <i className="fas fa-lightbulb"></i>
                        </button>
                        <button
                            type="button"
                            onClick={insertHr}
                            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
                            title="Insert Horizontal Line"
                        >
                            <i className="fas fa-minus"></i>
                        </button>
                    </div>

                    {/* Clear Formatting */}
                    <button
                        type="button"
                        onClick={() => exec("removeFormat")}
                        className="w-7 h-7 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 flex items-center justify-center text-red-500 ml-auto cursor-pointer"
                        title="Clear Selection Formatting"
                    >
                        <i className="fas fa-eraser"></i>
                    </button>
                </div>
            )}

            {/* TAB CONTENT AREAS */}
            <div className="p-4 md:p-6 bg-white min-h-[380px]">
                {/* 1. VISUAL EDITOR */}
                {activeTab === "visual" && (
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleInput}
                        onPaste={handlePaste}
                        className="rich-editor-content p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
                        data-placeholder="Start typing or formatting your blog post content here..."
                    />
                )}

                {/* 2. HTML SOURCE CODE VIEW */}
                {activeTab === "html" && (
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Raw HTML Markup
                        </label>
                        <textarea
                            value={htmlContent}
                            onChange={handleHtmlChange}
                            rows={16}
                            className="w-full p-4 font-mono text-sm bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-cyan-500/40 resize-y leading-relaxed"
                            placeholder="<div>Write custom HTML or edit direct markup here...</div>"
                        />
                    </div>
                )}

                {/* 3. LIVE READER PREVIEW */}
                {activeTab === "preview" && (
                    <div className="space-y-6 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                        <div className="bg-cyan-950 text-white p-6 rounded-2xl shadow-lg">
                            <div className="flex items-center gap-2 text-xs text-cyan-300 uppercase tracking-widest font-semibold mb-3">
                                <span>Blog Preview</span>
                                <span>•</span>
                                <span>{category || "General"}</span>
                            </div>
                            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-4">
                                {title || "Untitled Blog Post"}
                            </h1>
                            <div className="flex items-center gap-4 text-xs text-slate-300 border-t border-cyan-800/60 pt-4">
                                <span className="flex items-center gap-1.5 font-medium">
                                    <i className="fas fa-user-circle text-cyan-400"></i>
                                    {author || "Author Name"}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                    <i className="fas fa-calendar-alt text-pink-400"></i>
                                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <span>•</span>
                                <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                                    {readingTime} min read
                                </span>
                            </div>
                        </div>

                        {/* Banner Image Preview */}
                        {imagePreview && (
                            <div className="relative rounded-2xl overflow-hidden shadow-md max-h-[350px]">
                                <img
                                    src={imagePreview}
                                    alt="Blog Header"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Content Body Render */}
                        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                            <div
                                className="rich-editor-content text-slate-800 leading-relaxed font-medium"
                                dangerouslySetInnerHTML={{ __html: htmlContent || "<p className='text-gray-400 italic'>No content created yet...</p>" }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* LINK MODAL */}
            {showLinkModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <i className="fas fa-link text-cyan-600"></i>
                                Insert Hyperlink
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowLinkModal(false)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleInsertLink} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Link URL <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://example.com"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Anchor Text (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Click here..."
                                    value={linkText}
                                    onChange={(e) => setLinkText(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowLinkModal(false)}
                                    className="px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-xl cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-sm bg-cyan-600 text-white font-medium rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-600/20 cursor-pointer"
                                >
                                    Add Link
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* IMAGE MODAL */}
            {showImageModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <i className="fas fa-image text-emerald-600"></i>
                                Insert Inline Image URL
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowImageModal(false)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleInsertImage} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Image Direct URL <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://images.unsplash.com/photo-..."
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Alt Text / Caption
                                </label>
                                <input
                                    type="text"
                                    placeholder="Description of image..."
                                    value={imageAlt}
                                    onChange={(e) => setImageAlt(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowImageModal(false)}
                                    className="px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-xl cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-sm bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-600/20 cursor-pointer"
                                >
                                    Embed Image
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
