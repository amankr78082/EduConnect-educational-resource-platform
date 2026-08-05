from docx import Document
from docx.oxml.ns import qn
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    KeepTogether,
    LongTable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    TableStyle,
)
from xml.sax.saxutils import escape
from docx.text.paragraph import Paragraph as DocxParagraph


SRC = "docs/RGPV_Cloud_Computing_Unit_I_Notes.docx"
OUT = "docs/RGPV_Cloud_Computing_Unit_I_Notes.pdf"


def iter_blocks(parent):
    from docx.oxml.table import CT_Tbl
    from docx.oxml.text.paragraph import CT_P
    from docx.table import Table
    from docx.text.paragraph import Paragraph as DocxParagraph

    body = parent.element.body
    for child in body.iterchildren():
        if isinstance(child, CT_P):
            yield DocxParagraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)


def para_text(paragraph):
    parts = []
    for run in paragraph.runs:
        text = escape(run.text)
        if not text:
            continue
        if run.bold:
            text = f"<b>{text}</b>"
        if run.italic:
            text = f"<i>{text}</i>"
        parts.append(text)
    return "".join(parts).strip()


def cell_text(cell):
    chunks = []
    for p in cell.paragraphs:
        text = para_text(p) or escape(p.text.strip())
        if text:
            chunks.append(text)
    return "<br/>".join(chunks)


def get_widths(table, fallback_count):
    widths = []
    for cell in table.rows[0].cells:
        tc_w = cell._tc.tcPr.first_child_found_in("w:tcW") if cell._tc.tcPr is not None else None
        value = tc_w.get(qn("w:w")) if tc_w is not None else None
        if value and value.isdigit():
            widths.append(int(value) / 20.0)
    if len(widths) == fallback_count and sum(widths) > 0:
        scale = (6.5 * inch) / sum(widths)
        return [w * scale for w in widths]
    return [(6.5 * inch) / fallback_count] * fallback_count


def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#666666"))
    canvas.drawCentredString(4.25 * inch, 0.48 * inch, f"RGPV Cloud Computing - Unit I Notes | Page {doc.page}")
    canvas.restoreState()


def build_pdf():
    docx = Document(SRC)
    pdf = SimpleDocTemplate(
        OUT,
        pagesize=letter,
        rightMargin=0.72 * inch,
        leftMargin=0.72 * inch,
        topMargin=0.72 * inch,
        bottomMargin=0.72 * inch,
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("TitleCenter", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=22, leading=27, alignment=TA_CENTER, textColor=colors.HexColor("#0B2545"), spaceAfter=6))
    styles.add(ParagraphStyle("SubtitleCenter", parent=styles["Normal"], fontName="Helvetica", fontSize=11, leading=14, alignment=TA_CENTER, textColor=colors.HexColor("#555555"), spaceAfter=14))
    styles.add(ParagraphStyle("H1Blue", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=15, leading=18, textColor=colors.HexColor("#2E74B5"), spaceBefore=14, spaceAfter=7, keepWithNext=True))
    styles.add(ParagraphStyle("H2Blue", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12.5, leading=15, textColor=colors.HexColor("#2E74B5"), spaceBefore=10, spaceAfter=5, keepWithNext=True))
    styles.add(ParagraphStyle("H3Blue", parent=styles["Heading3"], fontName="Helvetica-Bold", fontSize=11.5, leading=14, textColor=colors.HexColor("#1F4D78"), spaceBefore=8, spaceAfter=4, keepWithNext=True))
    styles.add(ParagraphStyle("BodyClean", parent=styles["BodyText"], fontName="Helvetica", fontSize=10.2, leading=13, alignment=TA_LEFT, spaceAfter=5))
    styles.add(ParagraphStyle("BulletClean", parent=styles["BodyText"], fontName="Helvetica", fontSize=10.0, leading=12.5, leftIndent=18, firstLineIndent=-9, spaceAfter=3))
    styles.add(ParagraphStyle("Cell", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.3, leading=10.2, spaceAfter=0))
    styles.add(ParagraphStyle("CellHeader", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=8.4, leading=10.4, alignment=TA_CENTER, spaceAfter=0))

    story = []
    list_counter = 0
    first_title_done = False

    for block in iter_blocks(docx):
        if isinstance(block, DocxParagraph):
            text = para_text(block)
            if not text:
                continue
            style_name = block.style.name
            if style_name == "Heading 1":
                list_counter = 0
                story.append(Paragraph(text, styles["H1Blue"]))
            elif style_name == "Heading 2":
                list_counter = 0
                story.append(Paragraph(text, styles["H2Blue"]))
            elif style_name == "Heading 3":
                list_counter = 0
                story.append(Paragraph(text, styles["H3Blue"]))
            elif style_name == "List Bullet":
                story.append(Paragraph(text, styles["BulletClean"], bulletText="•"))
            elif style_name == "List Number":
                list_counter += 1
                story.append(Paragraph(text, styles["BulletClean"], bulletText=f"{list_counter}."))
            else:
                list_counter = 0
                raw = block.text.strip()
                if raw == "Cloud Computing Fundamentals" and not first_title_done:
                    first_title_done = True
                    story.append(Paragraph(text, styles["TitleCenter"]))
                elif raw.startswith("RGPV Exam Notes"):
                    story.append(Paragraph(text, styles["SubtitleCenter"]))
                else:
                    story.append(Paragraph(text, styles["BodyClean"]))
        else:
            list_counter = 0
            if len(block.rows) == 0:
                continue
            rows = []
            for r_idx, row in enumerate(block.rows):
                cells = []
                for cell in row.cells:
                    style = styles["CellHeader"] if r_idx == 0 else styles["Cell"]
                    cells.append(Paragraph(cell_text(cell), style))
                rows.append(cells)
            widths = get_widths(block, len(block.rows[0].cells))
            table = LongTable(rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF5")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#8C9BAD")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            story.append(KeepTogether([table, Spacer(1, 8)]))

    pdf.build(story, onFirstPage=page_footer, onLaterPages=page_footer)


if __name__ == "__main__":
    build_pdf()
