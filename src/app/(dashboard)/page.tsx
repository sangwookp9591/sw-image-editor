import { ImageDropzone } from "@/components/upload/dropzone";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <section>
        <h2 className="text-lg font-semibold mb-4">Upload Image</h2>
        <ImageDropzone />
      </section>
    </div>
  );
}
