export async function ensureStorageBucket(adminDb: any): Promise<void> {
  const { data: buckets } = await adminDb.storage.listBuckets()
  if (!buckets?.find(b => b.name === 'images')) {
    await adminDb.storage.createBucket('images', { public: true })
  }
}

export async function uploadImageToStorage(adminDb: any, file: File, folder: string): Promise<string> {
  const ext = file.type.split('/')[1] || 'png'
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { data, error } = await adminDb.storage.from('images').upload(fileName, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) throw new Error(error.message)

  const { data: publicUrl } = adminDb.storage.from('images').getPublicUrl(data.path)
  return publicUrl.publicUrl
}