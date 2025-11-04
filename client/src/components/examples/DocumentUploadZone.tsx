import DocumentUploadZone from '../DocumentUploadZone';

export default function DocumentUploadZoneExample() {
  return (
    <div className="p-6 max-w-2xl">
      <DocumentUploadZone
        category="Land Documents"
        acceptedFormats="PDF, JPEG, PNG"
        maxSize="50MB"
        onUpload={(files) => console.log('Uploaded:', files)}
      />
    </div>
  );
}
