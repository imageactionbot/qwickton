import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dropzone } from "../shared/Dropzone";
import { ToolPageShell } from "../shared/ToolPageShell";
import { usePageSeo } from "../../lib/seo/usePageSeo";
import { PENDING_WORK_FILES_KEY } from "../../lib/routing/pendingWorkFiles";
import { buildSmartToolGroups, classifyFile } from "../../lib/smartDrop/matchTools";

const ACCEPT =
  "application/pdf,image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,.heic,.heif,.docx,.csv,.xlsx,.xls,.txt,.md,.json,text/plain,text/csv";

export function SmartDropPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  usePageSeo(
    "Smart Drop",
    "Upload files and open the right Qwickton tool. Detection runs in your browser; files are not sent to our servers.",
    {
      keywords:
        "upload PDF JPG DOCX, browser PDF tools, local image tools, file type match, Qwickton",
    }
  );

  const { summary, groups } = useMemo(() => buildSmartToolGroups(files), [files]);

  const crumbs = useMemo(
    () => [
      { label: "All tools", to: "/" },
      { label: "Smart Drop" },
    ],
    []
  );

  return (
    <ToolPageShell title="Smart Drop" busy={false} breadcrumbs={crumbs}>
      <ol className="smart-drop-pipeline-strip" aria-label="How Smart Drop routes files">
        <li className="smart-drop-pipeline-step">
          <span className="smart-drop-pipeline-num" aria-hidden>
            1
          </span>
          <span className="smart-drop-pipeline-label">Inspect types</span>
          <span className="smart-drop-pipeline-hint">names &amp; MIME, in-tab only</span>
        </li>
        <li className="smart-drop-pipeline-join" aria-hidden />
        <li className="smart-drop-pipeline-step">
          <span className="smart-drop-pipeline-num" aria-hidden>
            2
          </span>
          <span className="smart-drop-pipeline-label">Match intent</span>
          <span className="smart-drop-pipeline-hint">pair files → capable tools</span>
        </li>
        <li className="smart-drop-pipeline-join" aria-hidden />
        <li className="smart-drop-pipeline-step">
          <span className="smart-drop-pipeline-num" aria-hidden>
            3
          </span>
          <span className="smart-drop-pipeline-label">Open tool</span>
          <span className="smart-drop-pipeline-hint">carry files into the workflow</span>
        </li>
      </ol>
      <div className="smart-drop-hero">
        <p className="smart-drop-ai-badge" role="note">
          <span className="smart-drop-ai-badge-pulse" aria-hidden />
          On-device routing · no cloud scan of file contents
        </p>
        <p className="smart-drop-desc">
          Drop anything supported; we surface the most plausible tools. Pick one and your files stay in this browser
          session — local processing, no upload queue.
        </p>
        <Dropzone
          id="smart-drop-zone"
          accept={ACCEPT}
          multiple
          maxFiles={24}
          maxSizeMb={45}
          onError={(msg) => {
            setError(msg);
          }}
          onFiles={(next) => {
            setError("");
            setFiles(next);
          }}
        />
        <p className="cost-note smart-drop-hero-note" role="note">
          Files stay on your device; we only read names and types to suggest tools.
        </p>
      </div>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      {files.length > 0 ? (
        <div className="smart-drop-summary" role="status">
          <p className="smart-drop-summary-line">{summary}</p>
          <ul className="smart-drop-file-chips">
            {files.map((f) => (
              <li key={`${f.name}-${f.size}-${f.lastModified}`} className="smart-drop-chip" title={f.type || classifyFile(f)}>
                <span className="smart-drop-chip-name">{f.name}</span>
                <span className="smart-drop-chip-kind">{classifyFile(f)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {files.length > 0 && groups.length === 0 ? (
        <div className="empty-hint-block" role="region" aria-label="Unsupported files">
          <p className="empty-hint">
            These extensions are not wired into Smart Drop yet. Try the{" "}
            <Link to="/search">search page</Link> or pick a hub (PDF, Image, Word) manually.
          </p>
        </div>
      ) : null}

      <div className="smart-drop-groups">
        {groups.map((g) => (
          <section key={g.id} className="smart-drop-group" aria-labelledby={`smart-drop-${g.id}`}>
            <div className="smart-drop-group-head">
              <h2 id={`smart-drop-${g.id}`} className="smart-drop-group-title">
                {g.label}
              </h2>
            </div>
            <div className="grid grid--catalog smart-drop-tool-grid">
              {g.tools.map((tool) => (
                <Link
                  key={`${g.id}-${tool.id}`}
                  className="card card--rich smart-drop-card"
                  to={tool.path}
                  state={{ [PENDING_WORK_FILES_KEY]: g.files }}
                >
                  <span className="card-category-badge" data-cat={tool.category}>
                    {tool.category}
                  </span>
                  <span className="card-title-line">{tool.title}</span>
                  <span className="card-desc">{tool.description}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ToolPageShell>
  );
}
