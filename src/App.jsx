import { useState, useEffect } from "react";
import constants, { buildPresenceChecklist, METRIC_CONFIG } from "./constants.js";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function App() {
  const [aiReady, setAiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [presenceChecklist, setPresenceChecklist] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.puter?.ai?.chat) {
        setAiReady(true);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const extractPDFText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageTexts = await Promise.all(
      Array.from({ length: pdf.numPages }, async (_, i) => {
        const page = await pdf.getPage(i + 1);
        const textContent = await page.getTextContent();
        return textContent.items.map((item) => item.str).join(" ");
      })
    );
    return pageTexts.join("\n").trim();
  };

  const parseJSONResponse = (reply) => {
    try {
      const match = reply.match(/\{[\s\S]*\}/);
      const parsed = match ? JSON.parse(match[0]) : {};
      if (!parsed.overallScore && !parsed.error) throw new Error("Invalid structure");
      return parsed;
    } catch (err) {
      throw new Error(`Failed to parse AI response: ${err.message}`);
    }
  };

  const analyzeResume = async (text) => {
    const prompt = constants.ANALYZE_RESUME_PROMPT.replace("{{DOCUMENT_TEXT}}", text);
    const response = await window.puter.ai.chat(
      [{ role: "system", content: "You are an expert resume reviewer." }, { role: "user", content: prompt }],
      { model: "gpt-4o" }
    );
    const result = parseJSONResponse(typeof response === "string" ? response : response.message?.content || "");
    if (result.error) throw new Error(result.error);
    return result;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") return alert("PDF only.");
    setUploadedFile(file);
    setIsLoading(true);
    setAnalysis(null);
    setResumeText("");
    setPresenceChecklist([]);
    try {
      const text = await extractPDFText(file);
      setResumeText(text);
      setPresenceChecklist(buildPresenceChecklist(text));
      setAnalysis(await analyzeResume(text));
    } catch (err) {
      alert(`Error: ${err.message}`);
      reset();
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setUploadedFile(null);
    setAnalysis(null);
    setResumeText("");
    setPresenceChecklist([]);
  };

  return (
    <div className="min-h-screen bg-main-gradient p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-5xl mx-auto w-full">
        <div className="text-center mb-6">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light bg-gradient-to-r from-cyan-300 via-teal-200 to-sky-300 bg-clip-text text-transparent mb-2">AI Resume Analyzer</h1>
          <p className="text-slate-300 text-sm sm:text-base">Upload your PDF resume and get instant AI feedback</p>
        </div>

        {!uploadedFile && (
          <div className="upload-area">
            <div className="upload-zone">
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">Ì≥Ñ</div>
              <h3 className="text-xl sm:text-2xl text-slate-200 mb-2">Upload Your Resume</h3>
              <p className="text-slate-400 mb-4 sm:mb-6 text-sm sm:text-base">PDF files only ‚Ä¢ Get instant analysis</p>
              <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={!aiReady} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className={`inline-block btn-primary ${!aiReady ? "opacity-50 cursor-not-allowed" : ""}`}>
                {aiReady ? "Choose PDF File" : "Initializing AI..."}
              </label>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="p-6 sm:p-8 max-w-md mx-auto text-center">
            <div className="loading-spinner mb-4"></div>
            <h3 className="text-lg sm:text-xl text-slate-200 mb-2">Analyzing Your Resume</h3>
            <p className="text-slate-400 text-sm sm:text-base">Please wait while AI reviews your resume...</p>
          </div>
        )}

        {analysis && uploadedFile && (
          <div className="space-y-6 p-4 sm:px-8 lg:px-16 animate-fade-in">
            <div className="file-info-card flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="icon-container-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30"><span className="text-2xl">Ì≥Ñ</span></div>
                <div><h3 className="text-xl font-bold text-green-500 mb-1">Analysis Complete</h3><p className="text-slate-300 text-sm break-all">{uploadedFile.name}</p></div>
              </div>
              <button onClick={reset} className="btn-secondary">New Analysis</button>
            </div>

            <div className="score-card text-center">
              <div className="flex items-center justify-center gap-2 mb-3"><span className="text-2xl">ÌøÜ</span><h2 className="text-2xl sm:text-3xl font-bold text-white">Overall Score</h2></div>
              <p className="text-6xl sm:text-8xl font-extrabold text-cyan-400 drop-shadow-lg">{analysis.overallScore || "0"}</p>
              <div className={`inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full ${parseInt(analysis.overallScore) >= 8 ? "score-status-excellent" : parseInt(analysis.overallScore) >= 6 ? "score-status-good" : "score-status-improvement"}`}>
                <span className="font-semibold text-lg">{parseInt(analysis.overallScore) >= 8 ? "Excellent" : parseInt(analysis.overallScore) >= 6 ? "Good" : "Needs Improvement"}</span>
              </div>
              <div className="progress-bar"><div className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${parseInt(analysis.overallScore) >= 8 ? "progress-excellent" : parseInt(analysis.overallScore) >= 6 ? "progress-good" : "progress-improvement"}`} style={{ width: `${(parseInt(analysis.overallScore) / 10) * 100}%` }}></div></div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="feature-card-green group">
                <div className="bg-green-500/20 icon-container-lg mx-auto mb-3"><span className="text-green-300 text-xl">‚úîÔ∏è</span></div>
                <h4 className="text-green-300 text-sm font-semibold uppercase tracking-wide mb-3 text-center">Top Strengths</h4>
                <div className="space-y-2 text-left">{analysis.strengths?.slice(0, 3).map((s, i) => (<div key={i} className="list-item-green"><span className="text-green-400 text-sm mt-0.5">‚Ä¢</span><span className="text-slate-200 font-medium text-sm leading-relaxed">{s}</span></div>))}</div>
              </div>
              <div className="feature-card-orange group">
                <div className="bg-orange-500/20 icon-container-lg mx-auto mb-3"><span className="text-orange-300 text-xl">‚ö†Ô∏è</span></div>
                <h4 className="text-orange-300 text-sm font-semibold uppercase tracking-wide mb-3 text-center">Improvements</h4>
                <div className="space-y-2 text-left">{analysis.improvements?.slice(0, 3).map((imp, i) => (<div key={i} className="list-item-orange"><span className="text-orange-400 text-sm mt-0.5">‚Ä¢</span><span className="text-slate-200 font-medium text-sm leading-relaxed">{imp}</span></div>))}</div>
              </div>
            </div>

            <div className="section-card"><h4 className="text-xl font-bold text-white mb-4">Executive Summary</h4><div className="summary-box"><p className="text-slate-200 text-sm sm:text-base leading-relaxed">{analysis.summary}</p></div></div>

            <div className="section-card">
              <h4 className="text-xl font-bold text-white mb-6">Performance Metrics</h4>
              <div className="space-y-4">{METRIC_CONFIG.map((cfg, i) => { const value = analysis.performanceMetrics?.[cfg.key] ?? cfg.defaultValue; return (<div key={i}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="text-lg">{cfg.icon}</span><p className="text-slate-200 font-medium">{cfg.label}</p></div><span className="text-slate-300 font-bold">{value}/10</span></div><div className="progress-bar-small"><div className={`h-full bg-gradient-to-r ${cfg.colorClass} rounded-full`} style={{ width: `${(value / 10) * 100}%` }}></div></div></div>); })}</div>
            </div>

            <div className="section-card">
              <h2 className="text-xl font-bold text-purple-400 mb-6">Resume Insights</h2>
              <div className="grid gap-4">
                <div className="info-box-cyan"><h3 className="text-cyan-300 font-semibold mb-2">Action Items</h3><div className="space-y-2">{(analysis.actionItems || []).map((item, i) => (<div key={i} className="flex gap-2"><span className="text-cyan-400">‚Ä¢</span><span className="text-slate-200">{item}</span></div>))}</div></div>
                <div className="info-box-emerald"><h3 className="text-emerald-300 font-semibold mb-2">Pro Tips</h3><div className="space-y-2">{(analysis.proTips || []).map((tip, i) => (<div key={i} className="flex gap-2"><span className="text-emerald-400">‚Ä¢</span><span className="text-slate-200">{tip}</span></div>))}</div></div>
              </div>
            </div>

            <div className="section-card">
               <h2 className="text-violet-400 font-bold text-xl mb-6">ATS Optimization</h2>
               <div className="space-y-2">{(presenceChecklist || []).map((item, i) => (<div key={i} className="flex items-center gap-2 text-slate-200"><span className={item.present ? "text-emerald-400" : "text-red-400"}>{item.present ? "‚úîÔ∏è" : "‚ùå"}</span><span>{item.label}</span></div>))}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default App;
