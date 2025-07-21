import { getFunctions, httpsCallable } from 'firebase/functions'

/**
 * Secure Storage Composable
 * 
 * This composable provides secure file access using signed URLs from Cloud Functions.
 * NO download tokens are used - all access is authenticated and time-limited.
 */
export function useSecureStorage() {
  
  const functions = getFunctions()
  const getStudentFileUrlFunction = httpsCallable(functions, 'getStudentFileUrl')
  
  /**
   * Get a secure, time-limited signed URL for a student file
   * This URL expires in 5 minutes and requires proper authentication
   * 
   * @param {string} studentId - The student ID
   * @param {string} fileName - The file name (e.g., 'ataglance.pdf', 'bip.pdf')
   * @returns {Promise<string>} - Signed URL that expires in 5 minutes
   */
  const getAuthenticatedUrl = async (studentId, fileName) => {
    if (!studentId || !fileName) return null
    
    try {
      console.log(`🔍 Getting signed URL for studentId: ${studentId}, fileName: ${fileName}`)
      const result = await getStudentFileUrlFunction({ studentId, fileName })
      console.log(`✅ Got signed URL:`, result.data.url)
      return result.data.url
    } catch (error) {
      console.error('Error getting signed URL:', error)
      throw error
    }
  }
  
  /**
   * Get authenticated URL from a file path or legacy URL
   * 
   * @param {string} pathOrUrl - File path like 'students/123/ataglance.pdf' or legacy URL
   * @param {string} studentId - Optional student ID for secure filenames
   * @returns {Promise<string>} - Signed URL
   */
  const getAuthenticatedUrlFromPath = async (pathOrUrl, studentId = null) => {
    if (!pathOrUrl) return null
    
    console.log(`🔍 Processing pathOrUrl:`, pathOrUrl)
    
    try {
      // Case 1: It's a legacy URL with token - extract from encoded URL
      if (pathOrUrl.includes('token=') && pathOrUrl.includes('students%2F')) {
        console.log(`🔍 Parsing legacy URL with token`)
        const match = pathOrUrl.match(/students%2F([^%]+)%2F([^?&]+)/)
        if (match) {
          const studentId = decodeURIComponent(match[1])
          const fileName = decodeURIComponent(match[2])
          console.log(`🔍 Extracted from legacy URL - studentId: ${studentId}, fileName: ${fileName}`)
          return await getAuthenticatedUrl(studentId, fileName)
        }
      }
      
      // Case 2: It's a file path like 'students/123/ataglance.pdf'
      if (pathOrUrl.startsWith('students/')) {
        console.log(`🔍 Parsing file path`)
        const pathParts = pathOrUrl.split('/')
        if (pathParts.length >= 3) {
          const studentId = pathParts[1]
          const fileName = pathParts[2]
          console.log(`🔍 Extracted from path - studentId: ${studentId}, fileName: ${fileName}`)
          return await getAuthenticatedUrl(studentId, fileName)
        }
      }
      
      // Case 3: It's a full Firebase Storage URL without token
      if (pathOrUrl.includes('firebasestorage.googleapis.com') && pathOrUrl.includes('students%2F')) {
        console.log(`🔍 Parsing Firebase Storage URL`)
        const match = pathOrUrl.match(/students%2F([^%]+)%2F([^?&]+)/)
        if (match) {
          const studentId = decodeURIComponent(match[1])
          const fileName = decodeURIComponent(match[2])
          console.log(`🔍 Extracted from Firebase URL - studentId: ${studentId}, fileName: ${fileName}`)
          return await getAuthenticatedUrl(studentId, fileName)
        }
      }
      
      // Case 4: If it's already a signed URL (no token), return as-is
      if (pathOrUrl.startsWith('https://') && !pathOrUrl.includes('token=') && pathOrUrl.includes('Expires=')) {
        console.log(`🔍 Already a signed URL, returning as-is`)
        return pathOrUrl
      }
      
      // Case 5: It's a secure filename (like '0cd5f114-ed06-4cbd-93c3-3377fac9ae78.enc')
      // This means we need to get the student ID from the current context
      if (pathOrUrl.includes('.enc') && !pathOrUrl.includes('/') && !pathOrUrl.includes('http')) {
        console.log(`🔍 Processing secure filename:`, pathOrUrl)
        if (studentId) {
          console.log(`🔍 Using provided student ID:`, studentId)
          return await getAuthenticatedUrl(studentId, pathOrUrl)
        } else {
          console.warn(`⚠️ Secure filename detected but no student ID provided:`, pathOrUrl)
          throw new Error(`Secure filename requires student ID context: ${pathOrUrl}`)
        }
      }
      
      console.error(`❌ Unable to parse file path or URL:`, pathOrUrl)
      throw new Error(`Unable to parse file path or URL: ${pathOrUrl}`)
    } catch (error) {
      console.error('Error getting authenticated URL from path:', pathOrUrl, error)
      throw error
    }
  }
  
  /**
   * Check if a file path/URL is secure (no download token)
   * 
   * @param {string} pathOrUrl - File path or URL to check
   * @returns {boolean} - True if secure (no token), false if has token
   */
  const isSecureFile = (pathOrUrl) => {
    if (!pathOrUrl) return true
    return !pathOrUrl.includes('token=')
  }
  
  /**
   * Convert a public URL to a secure file path
   * 
   * @param {string} url - Public Firebase Storage URL
   * @returns {string} - File path
   */
  const urlToPath = (url) => {
    if (!url || !url.startsWith('http')) return url
    
    try {
      const urlObj = new URL(url)
      const pathSegments = urlObj.pathname.split('/')
      const filePath = pathSegments.slice(pathSegments.indexOf('o') + 1).join('/')
      return decodeURIComponent(filePath.split('?')[0]) // Remove any query params
    } catch (error) {
      console.error('Error converting URL to path:', url, error)
      return url
    }
  }
  
  /**
   * Create a secure file viewer URL that opens in a new tab
   * This URL is time-limited and requires authentication
   * 
   * @param {string} studentId - The student ID
   * @param {string} fileName - The file name
   * @returns {Promise<string>} - Signed URL that expires in 5 minutes
   */
  const getViewerUrl = async (studentId, fileName) => {
    return await getAuthenticatedUrl(studentId, fileName)
  }
  
  return {
    getAuthenticatedUrl,
    getAuthenticatedUrlFromPath,
    isSecureFile,
    urlToPath,
    getViewerUrl
  }
} 