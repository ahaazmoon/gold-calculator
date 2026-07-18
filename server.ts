/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Gold price proxy route to securely fetch live metal prices without CORS browser blocks
  app.get("/api/goldprice", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).json({ error: "API token is required" });
      }

      const fetchResponse = await fetch("https://www.goldapi.io/api/XAU/USD", {
        headers: {
          "x-access-token": token,
          "Content-Type": "application/json",
        },
      });

      if (!fetchResponse.ok) {
        throw new Error(`GoldAPI returned status code: ${fetchResponse.status}`);
      }

      const data = await fetchResponse.json();
      res.json(data);
    } catch (error: any) {
      console.error("Proxy error calling GoldAPI:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // In development, serve assets via Vite middleware. In production, serve the compiled dist folder.
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gold Shop Server running on port ${PORT}`);
  });
}

startServer();
