type StorageUploadError = {
  message?: string
}

type StorageUploadResult = {
  error: StorageUploadError | null
}

type StorageBucket = {
  upload: (path: string, file: File, options: { contentType: string; upsert: boolean }) => Promise<StorageUploadResult>
}

export async function uploadToStorageBucket(bucket: StorageBucket, path: string, file: File): Promise<StorageUploadResult> {
  try {
    return await bucket.upload(path, file, { contentType: file.type || "application/octet-stream", upsert: true })
  } catch (error) {
    return { error: { message: getUploadErrorMessage(error) } }
  }
}

function getUploadErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return "Storage upload failed"
}
