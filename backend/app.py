from flask import Flask, request, send_file
from flask_cors import CORS
from docx import Document
import io
import json
import os
import subprocess
import tempfile
import logging

app = Flask(__name__)
CORS(app)  # allow requests from React

def convert_with_convertapi(docx_path, pdf_path):
    """
    Convert DOCX to PDF using ConvertAPI
    Requires an API key (free tier available)
    """
    try:
        api_key = os.environ.get('CONVERTAPI_SECRET')
        if not api_key:
            return False
            
        with open(docx_path, 'rb') as f:
            response = requests.post(
                'https://v2.convertapi.com/convert/docx/to/pdf',
                files={'File': f},
                data={'Secret': api_key}
            )
            
        if response.status_code == 200:
            with open(pdf_path, 'wb') as f:
                f.write(response.content)
            return True
        return False
    except Exception as e:
        print(f"ConvertAPI error: {e}")
        return False

def convert_docx_to_pdf(docx_path, pdf_path):
    """
    Convert DOCX to PDF using LibreOffice
    """
    try:
        # Use LibreOffice in headless mode for conversion
        result = subprocess.run([
            'libreoffice', '--headless', '--convert-to', 'pdf', 
            '--outdir', os.path.dirname(pdf_path), docx_path
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            return True
        else:
            print(f"LibreOffice error: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("LibreOffice conversion timed out")
        return False
    except Exception as e:
        print(f"Conversion error: {e}")
        return False

@app.route("/edit", methods=["POST"])
def edit_document():
    try:
        # Get uploaded file
        file = request.files["file"]

        # Get replacements from frontend
        replacements = json.loads(request.form["replacements"])
        pdf_name = request.form.get("pdfName", "EditedCoverLetter")

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

        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as temp_docx:
            docx_path = temp_docx.name
            doc.save(docx_path)

        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_pdf:
            pdf_path = temp_pdf.name

        # Convert using api
        if not convert_with_convertapi(docx_path, os.path.dirname(pdf_path)):
            return {"error": "PDF conversion failed"}, 500

        # Read the converted PDF
        with open(pdf_path, "rb") as f:
            pdf_bytes = io.BytesIO(f.read())

        pdf_bytes.seek(0)

        # Clean up temporary files
        try:
            os.unlink(docx_path)
            os.unlink(pdf_path)
        except:
            pass

        return send_file(
            pdf_bytes,
            as_attachment=True,
            download_name=f"{pdf_name}.pdf",
            mimetype="application/pdf",
        )
    
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}, 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)