import argparse
import json
import os
import textwrap
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Tuple


SECTION_ORDER = [
    "cover",
    "context",
    "objectives",
    "creative_direction",
    "palette",
    "typography",
    "logo",
    "pieces",
    "redesign_rationale",
    "next_steps",
]

SECTION_TITLES_PT = {
    "cover": "Capa",
    "context": "Contexto",
    "objectives": "Objetivos",
    "creative_direction": "Direcao criativa",
    "palette": "Paleta",
    "typography": "Tipografia",
    "logo": "Logo",
    "pieces": "Pecas",
    "redesign_rationale": "Justificativa do redesign",
    "next_steps": "Proximos passos",
}


def _safe_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (str, int, float)):
        return str(value).strip()
    if isinstance(value, list):
        parts = [str(item).strip() for item in value if str(item).strip()]
        return "; ".join(parts)
    if isinstance(value, dict):
        for key in ["name", "title", "label", "description", "summary"]:
            if key in value and str(value[key]).strip():
                return str(value[key]).strip()
    return json.dumps(value, ensure_ascii=True)


def _approved_only(artifact: Any) -> bool:
    if isinstance(artifact, dict):
        if artifact.get("approved") is False:
            return False
    return True


def _normalize_artifacts(approved_artifacts: Dict[str, Any]) -> List[Dict[str, Any]]:
    artifacts: List[Dict[str, Any]] = []
    for key in ["strategy", "palette", "typography", "logo"]:
        payload = approved_artifacts.get(key)
        if payload is None:
            continue
        if not _approved_only(payload):
            continue
        artifacts.append({"artifact_type": key, "artifact_payload": payload})
    pieces = approved_artifacts.get("pieces", [])
    if isinstance(pieces, list):
        for item in pieces:
            if not _approved_only(item):
                continue
            artifacts.append({"artifact_type": "piece", "artifact_payload": item})
    return artifacts


def _artifact_summary(artifact: Any) -> str:
    if artifact is None:
        return ""
    return _safe_text(artifact)


def _strategy_snippet(strategy: Dict[str, Any]) -> str:
    if not isinstance(strategy, dict):
        return ""
    for key in ["positioning", "purpose", "vision", "summary", "context"]:
        if key in strategy and _safe_text(strategy[key]):
            return _safe_text(strategy[key])
    return ""


def _palette_snippet(palette: Dict[str, Any]) -> str:
    if not isinstance(palette, dict):
        return ""
    for key in ["summary", "description", "intent"]:
        if key in palette and _safe_text(palette[key]):
            return _safe_text(palette[key])
    if "colors" in palette and isinstance(palette["colors"], list):
        return ", ".join([_safe_text(c) for c in palette["colors"] if _safe_text(c)])
    return ""


def _typography_snippet(typography: Dict[str, Any]) -> str:
    if not isinstance(typography, dict):
        return ""
    for key in ["summary", "description", "intent"]:
        if key in typography and _safe_text(typography[key]):
            return _safe_text(typography[key])
    if "families" in typography and isinstance(typography["families"], list):
        return ", ".join([_safe_text(t) for t in typography["families"] if _safe_text(t)])
    return ""


def _logo_snippet(logo: Dict[str, Any]) -> str:
    if not isinstance(logo, dict):
        return ""
    for key in ["summary", "description", "concept", "idea"]:
        if key in logo and _safe_text(logo[key]):
            return _safe_text(logo[key])
    return ""


def _pieces_snippet(pieces: List[Any]) -> str:
    if not isinstance(pieces, list) or not pieces:
        return ""
    names = []
    for item in pieces:
        name = _safe_text(item)
        if name:
            names.append(name)
    return ", ".join(names)


def build_blueprint(payload: Dict[str, Any]) -> Dict[str, Any]:
    project_name = _safe_text(payload.get("project_name"))
    strategy = payload.get("approved_artifacts", {}).get("strategy")
    title = project_name or _safe_text(strategy) or "Apresentacao de identidade visual"

    sections = []
    for idx, key in enumerate(SECTION_ORDER):
        sections.append({
            "section_key": key,
            "title": SECTION_TITLES_PT.get(key, key),
            "order_index": idx + 1,
        })
    return {
        "title": title,
        "sections": sections,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }


def generate_presentation_text(payload: Dict[str, Any], blueprint: Dict[str, Any]) -> Dict[str, Any]:
    approved = payload.get("approved_artifacts", {})
    strategy = approved.get("strategy", {})
    palette = approved.get("palette", {})
    typography = approved.get("typography", {})
    logo = approved.get("logo", {})
    pieces = approved.get("pieces", [])

    client_context = _safe_text(payload.get("client_context"))
    redesign_rationale = _safe_text(payload.get("redesign_rationale"))

    exec_parts = []
    snippet = _strategy_snippet(strategy)
    if snippet:
        exec_parts.append(snippet)
    if client_context:
        exec_parts.append(client_context)
    executive_summary = " ".join(exec_parts).strip() or "Resumo executivo baseado na estrategia aprovada."

    sections = []
    for section in blueprint.get("sections", []):
        key = section.get("section_key")
        title = section.get("title", SECTION_TITLES_PT.get(key, key))
        copy = ""
        artifacts_used: List[str] = []

        if key == "cover":
            project_name = _safe_text(payload.get("project_name"))
            copy = project_name or blueprint.get("title", "")
        elif key == "context":
            copy = client_context or _strategy_snippet(strategy)
            if _safe_text(strategy):
                artifacts_used.append("strategy")
        elif key == "objectives":
            objectives = _safe_text(strategy.get("objectives")) if isinstance(strategy, dict) else ""
            copy = objectives or "Consolidar a narrativa da marca e alinhar a identidade visual aos objetivos aprovados."
            if _safe_text(strategy):
                artifacts_used.append("strategy")
        elif key == "creative_direction":
            direction = _safe_text(strategy.get("creative_direction")) if isinstance(strategy, dict) else ""
            copy = direction or "Direcao criativa definida pela estrategia e pelo conceito aprovados."
            if _safe_text(strategy):
                artifacts_used.append("strategy")
        elif key == "palette":
            copy = _palette_snippet(palette) or "Paleta aprovada aplicada para consistencia visual."
            if _safe_text(palette):
                artifacts_used.append("palette")
        elif key == "typography":
            copy = _typography_snippet(typography) or "Tipografia aprovada para hierarquia e legibilidade."
            if _safe_text(typography):
                artifacts_used.append("typography")
        elif key == "logo":
            copy = _logo_snippet(logo) or "Conceito de logo aprovado aplicado nas pecas principais."
            if _safe_text(logo):
                artifacts_used.append("logo")
        elif key == "pieces":
            copy = _pieces_snippet(pieces) or "Pecas aprovadas para aplicacao da identidade."
            if pieces:
                artifacts_used.append("pieces")
        elif key == "redesign_rationale":
            copy = redesign_rationale or "Justificativa baseada nos objetivos e na estrategia aprovada."
            if redesign_rationale:
                artifacts_used.append("strategy")
        elif key == "next_steps":
            copy = "Finalizar entrega e preparar materiais para implementacao." if not payload.get("next_steps") else _safe_text(payload.get("next_steps"))
        else:
            copy = ""

        sections.append({
            "section_key": key,
            "title": title,
            "copy": copy.strip(),
            "artifacts_used": artifacts_used,
        })

    final_message = _safe_text(payload.get("final_message"))
    if not final_message:
        final_message = "Identidade visual consolidada com base nos aprovados, pronta para aplicacao."

    return {
        "executive_summary": executive_summary,
        "sections": sections,
        "final_message": final_message,
    }


@dataclass
class PDFPage:
    lines: List[str]


def _escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _wrap_lines(text: str, width: int = 92) -> List[str]:
    if not text:
        return [""]
    return textwrap.wrap(text, width=width) or [""]


def _paginate(lines: List[str], max_lines: int = 45) -> List[PDFPage]:
    pages = []
    for i in range(0, len(lines), max_lines):
        pages.append(PDFPage(lines=lines[i : i + max_lines]))
    return pages or [PDFPage(lines=[""])]


def export_pdf(presentation: Dict[str, Any], output_path: str) -> None:
    lines: List[str] = []
    title = _safe_text(presentation.get("title"))
    if title:
        lines.append(title)
        lines.append("")
    exec_summary = _safe_text(presentation.get("executive_summary"))
    if exec_summary:
        lines.append("Resumo executivo")
        lines.extend(_wrap_lines(exec_summary))
        lines.append("")

    for section in presentation.get("sections", []):
        header = _safe_text(section.get("title"))
        copy = _safe_text(section.get("copy"))
        if header:
            lines.append(header)
        if copy:
            lines.extend(_wrap_lines(copy))
        lines.append("")

    final_message = _safe_text(presentation.get("final_message"))
    if final_message:
        lines.append("Mensagem final")
        lines.extend(_wrap_lines(final_message))

    pages = _paginate(lines)

    objects: List[bytes] = []
    offsets: List[int] = []

    def add_object(content: str) -> int:
        obj = f"{len(objects) + 1} 0 obj\n{content}\nendobj\n".encode("latin-1")
        offsets.append(sum(len(o) for o in objects) + len(pdf_header))
        objects.append(obj)
        return len(objects)

    pdf_header = b"%PDF-1.4\n"

    pages_ids = []
    content_ids = []
    for page in pages:
        content_stream = ["BT", "/F1 12 Tf", "72 740 Td"]
        for line in page.lines:
            safe = _escape_pdf_text(line)
            content_stream.append(f"({safe}) Tj")
            content_stream.append("0 -14 Td")
        content_stream.append("ET")
        content_bytes = "\n".join(content_stream).encode("latin-1")
        content_obj = add_object(
            f"<< /Length {len(content_bytes)} >>\nstream\n{content_bytes.decode('latin-1')}\nendstream"
        )
        content_ids.append(content_obj)

    font_obj = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    for content_id in content_ids:
        page_obj = add_object(
            "<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 %d 0 R >> >> /MediaBox [0 0 612 792] /Contents %d 0 R >>"
            % (font_obj, content_id)
        )
        pages_ids.append(page_obj)

    pages_kids = " ".join([f"{pid} 0 R" for pid in pages_ids])
    pages_obj = add_object(f"<< /Type /Pages /Kids [{pages_kids}] /Count {len(pages_ids)} >>")

    catalog_obj = add_object("<< /Type /Catalog /Pages 2 0 R >>")

    xref_offset = len(pdf_header) + sum(len(o) for o in objects)
    xref = ["xref", f"0 {len(objects) + 1}", "0000000000 65535 f "]
    for offset in offsets:
        xref.append(f"{offset:010d} 00000 n ")
    xref_block = "\n".join(xref).encode("latin-1")

    trailer = (
        "trailer\n"
        f"<< /Size {len(objects) + 1} /Root {catalog_obj} 0 R >>\n"
        "startxref\n"
        f"{xref_offset}\n"
        "%%EOF\n"
    ).encode("latin-1")

    with open(output_path, "wb") as handle:
        handle.write(pdf_header)
        for obj in objects:
            handle.write(obj)
        handle.write(xref_block)
        handle.write(b"\n")
        handle.write(trailer)


def persist_outputs(output_dir: str, blueprint: Dict[str, Any], presentation: Dict[str, Any], artifacts: List[Dict[str, Any]]) -> Dict[str, str]:
    os.makedirs(output_dir, exist_ok=True)

    blueprint_path = os.path.join(output_dir, "blueprint.json")
    with open(blueprint_path, "w", encoding="utf-8") as handle:
        json.dump(blueprint, handle, ensure_ascii=True, indent=2)

    text_path = os.path.join(output_dir, "presentation_text.json")
    with open(text_path, "w", encoding="utf-8") as handle:
        json.dump(presentation, handle, ensure_ascii=True, indent=2)

    artifacts_path = os.path.join(output_dir, "artifacts.json")
    with open(artifacts_path, "w", encoding="utf-8") as handle:
        json.dump(artifacts, handle, ensure_ascii=True, indent=2)

    pdf_path = os.path.join(output_dir, "presentation.pdf")
    export_pdf({
        "title": blueprint.get("title"),
        "executive_summary": presentation.get("executive_summary"),
        "sections": presentation.get("sections"),
        "final_message": presentation.get("final_message"),
    }, pdf_path)

    manifest_path = os.path.join(output_dir, "manifest.json")
    manifest = {
        "blueprint": os.path.basename(blueprint_path),
        "text": os.path.basename(text_path),
        "artifacts": os.path.basename(artifacts_path),
        "export": os.path.basename(pdf_path),
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
    with open(manifest_path, "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=True, indent=2)

    return {
        "blueprint": blueprint_path,
        "text": text_path,
        "artifacts": artifacts_path,
        "export": pdf_path,
        "manifest": manifest_path,
    }


def run_pipeline(input_path: str, output_dir: str) -> Dict[str, str]:
    with open(input_path, "r", encoding="utf-8") as handle:
        payload = json.load(handle)

    approved_artifacts = payload.get("approved_artifacts", {})
    artifacts = _normalize_artifacts(approved_artifacts)
    blueprint = build_blueprint(payload)
    presentation = generate_presentation_text(payload, blueprint)
    return persist_outputs(output_dir, blueprint, presentation, artifacts)


def main() -> None:
    parser = argparse.ArgumentParser(description="Brand presentation pipeline")
    parser.add_argument("--input", required=True, help="JSON de entrada com artefatos aprovados")
    parser.add_argument("--output-dir", required=False, help="Diretorio de saida")
    args = parser.parse_args()

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    output_dir = args.output_dir or os.path.join(os.getcwd(), f"brand_presentation_output_{timestamp}")
    paths = run_pipeline(args.input, output_dir)

    for key, value in paths.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
