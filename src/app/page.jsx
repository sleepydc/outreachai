"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

var CSS = '@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap");:root{--bg0:#0a0a0f;--bg1:#111118;--bg2:#16161f;--bg3:#1c1c28;--bgi:#1a1a25;--bd:#252533;--t1:#f0eff4;--t2:#8a8a9a;--t3:#55556a;--ac:#6c5ce7;--acl:#8b7cf0;--acg:rgba(108,92,231,.15);--grn:#00d68f;--org:#f0a030;--blu:#48b0f0;--pnk:#e84393;--red:#ff6b6b}*{margin:0;padding:0;box-sizing:border-box}body{font-family:"DM Sans",sans-serif;background:var(--bg0);color:var(--t1);-webkit-font-smoothing:antialiased}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:var(--bd);border-radius:3px}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}';

var PC={tiktok:"#ff0050",instagram:"#e84393",facebook:"#4267B2",modash:"#6366f1"};
var PN={tiktok:"TikTok Shop",instagram:"Instagram",facebook:"Facebook",modash:"Modash"};
var PURL={tiktok:"https://seller-us.tiktok.com",instagram:"https://business.facebook.com",facebook:"https://business.facebook.com",modash:"https://app.modash.io"};

function formatNumber(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}

export default function Home() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("home");
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [outreach, setOutreach] = useState([]);
  const [showNewProgramForm, setShowNewProgramForm] = useState(false);
  const [newProgramData, setNewProgramData] = useState({ name: "", platforms: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPrograms();
    }
  }, [status]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/programs");
      if (!res.ok) throw new Error("Failed to fetch programs");
      const data = await res.json();
      setPrograms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewProgram = async (e) => {
    e.preventDefault();
    if (!newProgramData.name || newProgramData.platforms.length === 0) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProgramData),
      });
      if (!res.ok) throw new Error("Failed to create program");
      const data = await res.json();
      setPrograms([...programs, data]);
      setNewProgramData({ name: "", platforms: [] });
      setShowNewProgramForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "1.2rem", color: "var(--t2)" }}>Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{CSS}</style>
        <div style={{ maxWidth: "400px", width: "100%", padding: "2rem" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", fontFamily: "Instrument Serif" }}>
            OutreachAI
          </h1>
          <p style={{ color: "var(--t2)", marginBottom: "2rem" }}>
            Find creators and send personalized outreach at scale.
          </p>
          <button
            onClick={() => signIn()}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "var(--ac)",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              cursor: "pointer",
              marginBottom: "0.5rem",
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => signIn()}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "var(--bd)",
              color: "var(--t1)",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg0)" }}>
      <style>{CSS}</style>
      <div style={{ borderBottom: "1px solid var(--bd)", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontFamily: "Instrument Serif" }}>OutreachAI</h1>
        <button
          onClick={() => signOut()}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--red)",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid var(--bd)" }}>
        {["home", "programs", "prospects", "outreach"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "1rem",
              border: "none",
              background: activeTab === tab ? "var(--bg2)" : "transparent",
              color: activeTab === tab ? "var(--ac)" : "var(--t2)",
              cursor: "pointer",
              borderBottom: activeTab === tab ? "2px solid var(--ac)" : "none",
              fontSize: "0.9rem",
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        {activeTab === "home" && (
          <div>
            <h2 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Welcome back!</h2>
            <p style={{ color: "var(--t2)", marginBottom: "2rem" }}>
              You have {programs.length} programs and {prospects.length} prospects.
            </p>
          </div>
        )}

        {activeTab === "programs" && (
          <div>
            <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.5rem" }}>Programs</h2>
              <button
                onClick={() => setShowNewProgramForm(!showNewProgramForm)}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "var(--ac)",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                }}
              >
                + New Program
              </button>
            </div>

            {showNewProgramForm && (
              <form onSubmit={handleNewProgram} style={{ marginBottom: "2rem", background: "var(--bg2)", padding: "1.5rem", borderRadius: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Program name"
                  value={newProgramData.name}
                  onChange={(e) => setNewProgramData({ ...newProgramData, name: e.target.value })}
                  style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", background: "var(--bg1)", color: "var(--t1)", border: "1px solid var(--bd)", borderRadius: "0.5rem" }}
                />
                <div style={{ marginBottom: "1rem" }}>
                  {["tiktok", "instagram", "facebook"].map((p) => (
                    <label key={p} style={{ marginRight: "1rem", display: "inline-flex", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={newProgramData.platforms.includes(p)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewProgramData({ ...newProgramData, platforms: [...newProgramData.platforms, p] });
                          } else {
                            setNewProgramData({ ...newProgramData, platforms: newProgramData.platforms.filter((x) => x !== p) });
                          }
                        }}
                        style={{ marginRight: "0.5rem" }}
                      />
                      {PN[p]}
                    </label>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "var(--ac)",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Creating..." : "Create Program"}
                </button>
              </form>
            )}

            {programs.length === 0 ? (
              <p style={{ color: "var(--t2)" }}>No programs yet. Create one to get started!</p>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {programs.map((program) => (
                  <div
                    key={program.id}
                    onClick={() => {
                      setSelectedProgram(program);
                      setActiveTab("prospects");
                    }}
                    style={{
                      background: "var(--bg2)",
                      padding: "1.5rem",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      border: "1px solid var(--bd)",
                      transition: "all 0.2s",
                    }}
                  >
                    <h3>{program.name}</h3>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", fontSize: "0.9rem", color: "var(--t2)" }}>
                      <span>{program.platforms.join(", ")}</span>
                      <span>{program.prospectsCount} prospects</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "prospects" && selectedProgram && (
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>{selectedProgram.name} - Prospects</h2>
            <p style={{ color: "var(--t2)" }}>Manage prospects for this program here.</p>
          </div>
        )}

        {activeTab === "outreach" && (
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>Outreach</h2>
            <p style={{ color: "var(--t2)" }}>Track your outreach messages here.</p>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(255, 107, 107, 0.1)", color: "var(--red)", padding: "1rem", borderRadius: "0.5rem", marginTop: "1rem" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
