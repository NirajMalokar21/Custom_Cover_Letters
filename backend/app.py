from flask import Flask, request, send_file
from flask_cors import CORS
from docx import Document
from docx2pdf import convert
import io
import json
import os

app = Flask(__name__)
CORS(app)  # allow requests from React

@app.route("/edit", methods=["POST"])
def edit_document():
    # Get uploaded file
    file = request.files["file"]

    # Get replacements from frontend
    replacements = json.loads(request.form["replacements"])

    # Load document into memory
    doc = Document(file)

    # Replace text in paragraphs
    for p in doc.paragraphs:
        for r in replacements:
            for run in p.runs:
                if r["find"] in run.text:
                    run.text = run.text.replace(r["find"], r["replace"])


    # Replace text inside tables 
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for r in replacements:
                    if r["find"] in cell.text:
                        cell.text = cell.text.replace(r["find"], r["replace"])

    docx_path = "temp.docx"
    pdf_name = request.form.get("pdfName", "EditedCoverLetter")
    pdf_path = f"{pdf_name}.pdf"    
    doc.save(docx_path)
    convert(docx_path, pdf_path)

    # Save to memory
    with open(pdf_path, "rb") as f:
        pdf_bytes = io.BytesIO(f.read())

    pdf_bytes.seek(0)

    os.remove(docx_path)
    os.remove(pdf_path) 

    return send_file(
        pdf_bytes,
        as_attachment=True,
        download_name=f"{pdf_name}.pdf",
        mimetype="application/pdf",
    )

if __name__ == "__main__":
    app.run(port=5000, debug=True)
