"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface FileStats {
  fileName: string;
  fileSize: string;
}

const UploadFile: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [fileStats, setFileStats] = useState<FileStats>({
    fileName: "",
    fileSize: "",
  });

  useEffect(() => {
    // Fetch uploaded file if it exists
    fetchUploadedFile();
  }, []);

  const fetchUploadedFile = async () => {
    try {
      const response = await fetch("/api/upload", {
        method: "GET",
      });
      if (response.ok) {
        const data = await response;

        const headers = response.headers;
        const fileName = headers.get("X-FileName");
        const contentLength = headers.get("X-fileSize");

        const fileSizeInBytes = contentLength ? parseInt(contentLength, 10) : 0;

        // Convert file size to megabytes or gigabytes
        let fileSize = "";
        if (fileSizeInBytes >= 1000000000) {
          fileSize = `${(fileSizeInBytes / 1000000000).toFixed(2)} GB`;
        } else if (fileSizeInBytes >= 1000000) {
          fileSize = `${(fileSizeInBytes / 1000000).toFixed(2)} MB`;
        } else {
          fileSize = `${(fileSizeInBytes / 1000).toFixed(2)} KB`;
        }

        setFileStats({
          fileName: fileName || "",
          fileSize: fileSize,
        });
        setUploadedFile(data);
      }
    } catch (error) {
      console.error("Error fetching uploaded file:", error);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      return alert("Please select a file to upload");
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFile(data);
        console.log("File uploaded successfully!");
      } else {
        console.log("Error uploading file!");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      fetchUploadedFile();
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    console.log("Downloading file:", uploadedFile);
    try {
      const response = await fetch(`/api/upload`, {
        method: "GET",
      });
      if (response.ok) {
        // Convert response to blob
        const blob = await response.blob();
        // Create download link
        const url = window.URL.createObjectURL(new Blob([blob]));
        // Create anchor element
        const a = document.createElement("a");
        a.href = url;
        a.download = fileStats.fileName || "download.txt";
        // Trigger download
        document.body.appendChild(a);
        a.click();
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.log("Error downloading file!");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleDelete = async () => {
    // Implement delete functionality
    try {
      const response = await fetch("/api/upload", {
        method: "DELETE",
        body: JSON.stringify(fileStats.fileName),
      });
      if (response.ok) {
        setUploadedFile(null);
        console.log("File deleted successfully!");
      } else {
        console.log("Error deleting file!");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    } finally {
      setFile(null);
      fetchUploadedFile();
    }
  };

  return (
    <div>
      {uploadedFile ? (
        <div>
          <h2 className="font-bold text-xl mb-2">Uploaded File</h2>
        <div>
            <p><strong>File Name:</strong> {fileStats.fileName}</p>
            <p><strong>Size:</strong> {fileStats.fileSize}</p>
        </div>
          <Button onClick={handleDownload} className="mr-2 mt-4">
            Download
          </Button>
          <Button onClick={handleDelete} className="bg-red-500 font-bold hover:bg-red-600">Delete</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="file" className="block mb-6 font-bold text-lg">
            Select File
            <Input
              id="file"
              type="file"
              accept=".pdf,.docx,.xlsx,.jpg,.png"
              className="mt-2 block w-full px-3 py-2 rounded-md border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
              onChange={handleChange}
            />
          </label>
          <Button
            type="submit"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isLoading && "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            disabled={isLoading || !file}
          >
            {isLoading ? "Uploading..." : "Upload"}
          </Button>
        </form>
      )}
    </div>
  );
};

export default UploadFile;
