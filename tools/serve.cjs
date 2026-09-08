// Minimal static file server for local tooling (catalog PDF generation).
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const port = Number(process.argv[2] || 3200);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let filePath = path.join(root, urlPath);
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory())
      filePath = path.join(filePath, "index.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end("Not found");
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(port, () => console.log(`static server on :${port}`));
