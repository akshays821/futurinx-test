export async function uploadToImgbb(file) {
  const formData = new FormData()
  formData.append("image", file)
  
  const res = await fetch("/api/upload", { 
    method: "POST", 
    body: formData 
  })
  
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  
  return data.url
}
