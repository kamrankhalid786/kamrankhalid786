(function () {
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function renderInline(value) {
        var text = escapeHtml(value || "");

        text = text.replace(/`([^`]+)`/g, function (_, code) {
            return "<code>" + escapeHtml(code) + "</code>";
        });

        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, href) {
            return '<a class="inline-link inline-link-arrow" href="' + escapeHtml(href) + '" target="_blank" rel="noopener">' + escapeHtml(label) + "</a>";
        });

        return text;
    }

    function splitTableRow(line) {
        var row = (line || "").trim();
        if (row.startsWith("|")) row = row.slice(1);
        if (row.endsWith("|")) row = row.slice(0, -1);
        var cells = [];
        var current = "";

        for (var i = 0; i < row.length; i += 1) {
            var ch = row[i];
            var next = i + 1 < row.length ? row[i + 1] : "";

            // Treat escaped pipes as literal text inside a cell.
            if (ch === "\\" && (next === "|" || next === "\\")) {
                current += next;
                i += 1;
                continue;
            }

            if (ch === "|") {
                cells.push(current.trim());
                current = "";
                continue;
            }

            current += ch;
        }

        cells.push(current.trim());
        return cells;
    }

    function isDividerRow(cells) {
        if (!cells || cells.length === 0) return false;
        return cells.every(function (cell) {
            return /^:?-{3,}:?$/.test(cell);
        });
    }

    function renderTable(lines, start) {
        var tableLines = [];
        var idx = start;

        while (idx < lines.length && lines[idx].trim().startsWith("|")) {
            tableLines.push(lines[idx].trim());
            idx += 1;
        }

        if (tableLines.length < 2) {
            return { html: "", next: idx };
        }

        var headerCells = splitTableRow(tableLines[0]);
        var dividerCells = splitTableRow(tableLines[1]);
        if (!isDividerRow(dividerCells)) {
            return { html: "", next: idx };
        }
        var columnCount = headerCells.length;

        var html = '<div class="markdown-table-wrap"><table class="markdown-table"><thead><tr>';
        headerCells.forEach(function (cell) {
            html += "<th>" + renderInline(cell) + "</th>";
        });
        html += "</tr></thead><tbody>";

        for (var i = 2; i < tableLines.length; i += 1) {
            var rowCells = splitTableRow(tableLines[i]);
            if (rowCells.length === 1 && rowCells[0] === "") continue;

            if (rowCells.length < columnCount) {
                while (rowCells.length < columnCount) rowCells.push("");
            } else if (rowCells.length > columnCount) {
                rowCells = rowCells.slice(0, columnCount - 1).concat([rowCells.slice(columnCount - 1).join(" | ")]);
            }

            html += "<tr>";
            rowCells.forEach(function (cell) {
                html += "<td>" + renderInline(cell) + "</td>";
            });
            html += "</tr>";
        }

        html += "</tbody></table></div>";
        return { html: html, next: idx };
    }

    function renderMarkdown(markdown) {
        var lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
        var html = "";
        var i = 0;

        while (i < lines.length) {
            var raw = lines[i];
            var line = raw.trim();

            if (!line) {
                i += 1;
                continue;
            }

            if (/^###\s+/.test(line)) {
                html += "<h3>" + renderInline(line.replace(/^###\s+/, "")) + "</h3>";
                i += 1;
                continue;
            }

            if (/^##\s+/.test(line)) {
                html += "<h2>" + renderInline(line.replace(/^##\s+/, "")) + "</h2>";
                i += 1;
                continue;
            }

            if (/^#\s+/.test(line)) {
                html += "<h1>" + renderInline(line.replace(/^#\s+/, "")) + "</h1>";
                i += 1;
                continue;
            }

            if (line.startsWith("|")) {
                var table = renderTable(lines, i);
                if (table.html) {
                    html += table.html;
                    i = table.next;
                    continue;
                }
            }

            if (/^-\s+/.test(line)) {
                html += '<ul class="markdown-list">';
                while (i < lines.length && /^-\s+/.test(lines[i].trim())) {
                    html += "<li>" + renderInline(lines[i].trim().replace(/^-+\s+/, "")) + "</li>";
                    i += 1;
                }
                html += "</ul>";
                continue;
            }

            var paragraph = [];
            while (i < lines.length) {
                var nextLine = lines[i].trim();
                if (!nextLine || /^#{1,3}\s+/.test(nextLine) || nextLine.startsWith("|") || /^-\s+/.test(nextLine)) {
                    break;
                }
                paragraph.push(lines[i].trim());
                i += 1;
            }
            if (paragraph.length > 0) {
                html += "<p>" + renderInline(paragraph.join(" ")) + "</p>";
            } else {
                i += 1;
            }
        }

        return html;
    }

    function initMarkdownPage() {
        var body = document.body;
        var container = document.getElementById("markdownContent");
        if (!body || !container) return;

        var inlineSource = document.getElementById("markdownInline");
        if (inlineSource && inlineSource.textContent && inlineSource.textContent.trim()) {
            container.innerHTML = renderMarkdown(inlineSource.textContent);
            return;
        }

        var source = body.getAttribute("data-markdown-src");
        if (!source) {
            container.innerHTML = '<p class="content-text">Markdown source is not configured.</p>';
            return;
        }

        fetch(source)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Unable to load markdown source: " + response.status);
                }
                return response.text();
            })
            .then(function (markdown) {
                container.innerHTML = renderMarkdown(markdown);
            })
            .catch(function (error) {
                console.warn(error);
                container.innerHTML = '<p class="content-text">Unable to load evidence content right now.</p>';
            });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initMarkdownPage);
    } else {
        initMarkdownPage();
    }
})();
