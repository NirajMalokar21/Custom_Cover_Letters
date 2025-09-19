import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

interface Replacement {
  find: string;
  replace: string;
}

const initialReplacement = [
  {
    find: "DATE", replace: "",
  },
  {
    find: "COMP_NAME", replace: "",
  },
  {
    find: "HM_NAME", replace: "",
  },
  {
    find: "JOB_TITLE", replace: "",
  },
  {
    find: "POS_NAME", replace: "",
  },
]

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState("examplePdf");
  const [replacements, setReplacements] = useState<Replacement[]>(initialReplacement);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddReplacement = () => {
    setReplacements([...replacements, { find: "", replace: "" }]);
  };

  const handleRemoveReplacement = (index: number) => {
    setReplacements(replacements.filter((_, i) => i !== index));
  };

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

    setIsLoading(true); 

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("replacements", JSON.stringify(replacements));
      formData.append("pdfName", pdfName);

      const response = await fetch("http://127.0.0.1:5000/edit", {
        method: "POST",
        body: formData,
      });

      // Check if the response is OK
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText}\n${errorText}`);
      }

      // Check if the response is a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        const errorText = await response.text();
        throw new Error(`Expected PDF but got: ${contentType}\n${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pdfName}.pdf`;
      a.click();
    } catch (error) {
      console.error("Error:", error);
      
      // Handle the error safely
      let errorMessage = "An error occurred while processing the file.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 flex flex-col items-center py-12 px-4">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-200 mt-4 text-xl">Processing your document...</p>
          </div>
        </div>
      )}

      <header className="text-center mb-10">
        <h1 className="text-7xl font-[Poppins] bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
          Cover Letter Editor
        </h1>
        <p className="text-gray-400 max-w-2xl">
          Upload your cover letter, customize it with replacements, and download as a polished PDF
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-2xl shadow-xl p-8 flex flex-col gap-8 w-full max-w-3xl"
      >
        {/* File Upload */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-purple-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Upload Your Document
          </h2>
          
          <div className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-600 rounded-xl bg-gray-700 transition-all hover:border-purple-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <label className="cursor-pointer bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-all">
              Choose .docx File
              <input
                id="file-upload"
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-gray-500 text-sm mt-4">Supported format: .docx</p>
          </div>
          
          <span className="text-purple-300 bg-purple-900 bg-opacity-30 px-4 py-2 rounded-lg text-center">
            {file?.name || "No file selected"}
          </span>
        </div>

        {/* PDF Name */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-purple-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            Output Settings
          </h2>
          
          <div className="flex flex-col gap-2">
            <label className="text-gray-400">PDF File Name</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter PDF name"
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 absolute right-3 top-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Replacement Fields */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-purple-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Text Replacements
          </h2>
          
          <div className="space-y-4">
            {replacements.map((rep, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-700 rounded-lg transition-all hover:bg-gray-650">
                <div className="flex-grow">
                  <label className="block text-gray-400 mb-2">Find</label>
                  <input
                    type="text"
                    placeholder="Text to find"
                    value={rep.find}
                    onChange={(e) => handleChange(index, "find", e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex-grow">
                  <label className="block text-gray-400 mb-2">Replace With</label>
                  <input
                    type="text"
                    placeholder="Replacement text"
                    value={rep.replace}
                    onChange={(e) => handleChange(index, "replace", e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveReplacement(index)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center mt-2 md:mt-6"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Remove
                </button>
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={handleAddReplacement}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center self-start"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Replacement
          </button>
        </div>

        {/* Submit */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-900 transition-all shadow-lg transform hover:scale-105"
          >
            Download Edited Letter
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;