import { useState} from "react";
import type { ChangeEvent, FormEvent } from "react";


interface Replacement {
  find: string;
  replace: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState("defaultpdf");
  const [replacements, setReplacements] = useState<Replacement[]>([
    { find: "", replace: "" },
  ]);

  const handleAddReplacement = () => {
    setReplacements([...replacements, { find: "", replace: "" }]);
  };

  const handleRemoveReplacement = (index: number) => {
    setReplacements(replacements.filter((_, i) => i !== index));
  };

  // Updates a replacement pair as the user works on it
  const handleChange = (
    index: number,
    field: keyof Replacement,
    value: string
  ) => {
    const updated = [...replacements];
    updated[index][field] = value;
    setReplacements(updated);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("replacements", JSON.stringify(replacements));
    formData.append("pdfName", pdfName);

    const response = await fetch("http://localhost:5000/edit", {
      method: "POST",
      body: formData,
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pdfName}.pdf`;
    a.click();
  };

  return (
    <div >
      <h1>Cover Letter Editor</h1>

      <form onSubmit={handleSubmit}>
        {/* File Upload */}
        <div>
          <label>Upload .docx file:</label>
          <input type="file" accept=".docx" onChange={handleFileChange} />
        </div>

        <div>
          <label>Enter desired PDF name</label>
          <input type="text" placeholder="Enter name of the pdf" value={pdfName} onChange={(e) => setPdfName(e.target.value)} />
        </div>

        {/* Replacement Fields */}
        <div>
          <h2>Replacements</h2>
          {replacements.map((rep, index) => (
            <div key={index}>
              <input
                type="text"
                placeholder="Find"
                value={rep.find}
                onChange={(e) =>
                  handleChange(index, "find", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Replace with"
                value={rep.replace}
                onChange={(e) =>
                  handleChange(index, "replace", e.target.value)
                }
              />
              <button
                type="button"
                onClick={() => handleRemoveReplacement(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddReplacement}>
            + Add Replacement
          </button>
        </div>

        {/* Submit */}
        <div>
          <button type="submit">Download Edited Letter</button>
        </div>
      </form>
    </div>
  );
}

export default App;
