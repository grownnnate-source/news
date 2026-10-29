import dns from "node:dns";
dns.setDefaultResultOrder?.("ipv4first");

import axios from "axios";
import { ACTIVE_SOURCES } from "../config/sources.js";

/**
 * Feed Latency & Reachability Benchmark Suite
 * Verifies regional endpoint latency across Addis Ababa and global news wires.
 */

async function benchmarkSources() {
  console.log("⏱️  Running ThreadNews Feed Latency Benchmark...\n");

  const results = [];

  for (const src of ACTIVE_SOURCES.slice(0, 8)) {
    const start = performance.now();
    try {
      if (src.type === "telegram") {
        const res = await axios.get(`https://t.me/s/${src.handle_or_url}`, {
          timeout: 8000,
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const duration = Math.round(performance.now() - start);
        results.push({ name: src.name, status: "OK", latencyMs: duration, sizeBytes: res.data.length });
        console.log(`[PASS] ${src.name.padEnd(25)} -> ${duration}ms (${res.status})`);
      } else if (src.type === "rss") {
        const res = await axios.get(src.handle_or_url, {
          timeout: 8000,
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const duration = Math.round(performance.now() - start);
        results.push({ name: src.name, status: "OK", latencyMs: duration, sizeBytes: res.data.length });
        console.log(`[PASS] ${src.name.padEnd(25)} -> ${duration}ms (${res.status})`);
      }
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      results.push({ name: src.name, status: "TIMEOUT/ERR", latencyMs: duration, error: err.message });
      console.log(`[WARN] ${src.name.padEnd(25)} -> ${duration}ms (${err.message})`);
    }
  }

  const okResults = results.filter((r) => r.status === "OK");
  const avgLatency = Math.round(okResults.reduce((acc, r) => acc + r.latencyMs, 0) / okResults.length);

  console.log("\n==========================================");
  console.log(`✅ Benchmark Completed: ${okResults.length}/${results.length} reachable`);
  console.log(`⚡ Average Network Latency: ${avgLatency}ms`);
  console.log("==========================================\n");
}

benchmarkSources();
