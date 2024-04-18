import FileUpload from "@/components/form";

export default function Home() {
  return (
    <main className="flex justify-center items-center h-screen bg-gradient-to-br from-[#81a3ff] to-[#3bee7d]">

      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <FileUpload />
      </div>
    </main>
  );
}
