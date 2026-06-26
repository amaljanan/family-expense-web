import { supabase } from './supabase'

const LS_KEY = 'ff_family'

export async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const buf  = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function getFamily() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) } catch { return null }
}

export function isLoggedIn() {
  return !!getFamily()
}

export function setFamily(family) {
  localStorage.setItem(LS_KEY, JSON.stringify(family))
}

export function logout() {
  localStorage.removeItem(LS_KEY)
}

export async function login(username, password) {
  const hash = await hashPassword(password)
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('username', username.toLowerCase().trim())
    .eq('password_hash', hash)
    .single()
  if (error || !data) throw new Error('Incorrect username or password')
  return data
}

export async function changePassword(familyId, oldPassword, newPassword) {
  const { data: fam, error } = await supabase
    .from('families')
    .select('password_hash')
    .eq('id', familyId)
    .single()
  if (error || !fam) throw new Error('Could not verify identity')
  const oldHash = await hashPassword(oldPassword)
  if (fam.password_hash !== oldHash) throw new Error('Old password is incorrect')
  const newHash = await hashPassword(newPassword)
  const { error: upErr } = await supabase
    .from('families')
    .update({ password_hash: newHash })
    .eq('id', familyId)
  if (upErr) throw new Error('Failed to update password')
}
