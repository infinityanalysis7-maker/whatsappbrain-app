export interface BusinessProfile {
  id?: string
  user_id?: string
  services: string[]
  prices: Record<string, string>
  hours: string
  location: string
  policies: string
  updated_at?: string
}

// Check if we are running in the browser
const isBrowser = typeof window !== 'undefined'

export async function getProfile(userId: string): Promise<BusinessProfile | null> {
  if (isBrowser) {
    try {
      const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      if (data.success && data.profile) {
        // Keep localStorage updated as a backup
        localStorage.setItem('wb_profile', JSON.stringify(data.profile))
        return data.profile
      }
    } catch (err) {
      console.error('Failed to get profile from API:', err)
    }

    // Fallback to local storage if API fails
    const local = localStorage.getItem('wb_profile')
    return local ? JSON.parse(local) : null
  }
  return null
}

export async function saveProfile(userId: string, profile: BusinessProfile): Promise<{ success: boolean; error?: string }> {
  const payload = { ...profile, user_id: userId, updated_at: new Date().toISOString() }
  
  if (isBrowser) {
    localStorage.setItem('wb_profile', JSON.stringify(payload))

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...profile })
      })
      const data = await res.json()
      if (!data.success) {
        console.error('Failed to save profile to API:', data.error)
        return { success: false, error: data.error || 'Server save failed' }
      }
      return { success: true }
    } catch (err) {
      console.error('Failed to save profile to API:', err)
      return { success: false, error: 'Network error' }
    }
  }
  return { success: false, error: 'Not in browser' }
}
