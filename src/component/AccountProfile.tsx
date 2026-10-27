import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/useAuth'

export default function AccountProfile() {
  const { user, updateProfile, updatePassword } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    setFullName(user?.fullName ?? '')
    setPhone(user?.phone ?? '')
  }, [user?.id, user?.fullName, user?.phone])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileMessage(null)
    setProfileError(null)
    setIsSavingProfile(true)
    const result = await updateProfile(fullName, phone)
    setIsSavingProfile(false)
    if (result.success) setProfileMessage('Your profile has been saved.')
    else setProfileError(result.error ?? 'Your profile could not be saved.')
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordMessage(null)
    setPasswordError(null)
    if (newPassword.length < 8) {
      setPasswordError('Your password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The passwords do not match.')
      return
    }

    setIsSavingPassword(true)
    const result = await updatePassword(newPassword)
    setIsSavingPassword(false)
    if (result.success) {
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Your password has been updated.')
    } else {
      setPasswordError(result.error ?? 'Your password could not be updated.')
    }
  }

  return (
    <div>
      <h1 className="account-page-title">Profile &amp; Password</h1>

      <section className="account-panel">
        <h2 className="account-panel__heading">Profile</h2>
        <p className="account-muted account-profile__email">{user?.email}</p>
        <form className="account-form" onSubmit={(event) => void saveProfile(event)}>
          <label className="account-form__field">
            Full name
            <input autoComplete="name" maxLength={120} required value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </label>
          <label className="account-form__field">
            Phone
            <input autoComplete="tel" maxLength={32} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          {profileError && <p className="account-feedback" role="alert">{profileError}</p>}
          {profileMessage && <p className="account-feedback" role="status">{profileMessage}</p>}
          <div><button className="account-button" type="submit" disabled={isSavingProfile}>{isSavingProfile ? 'Saving…' : 'Save changes'}</button></div>
        </form>
      </section>

      <section className="account-panel">
        <h2 className="account-panel__heading">Change password</h2>
        <form className="account-form" onSubmit={(event) => void savePassword(event)}>
          <label className="account-form__field">
            New password
            <input autoComplete="new-password" minLength={8} required type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          </label>
          <label className="account-form__field">
            Confirm password
            <input autoComplete="new-password" minLength={8} required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </label>
          {passwordError && <p className="account-feedback" role="alert">{passwordError}</p>}
          {passwordMessage && <p className="account-feedback" role="status">{passwordMessage}</p>}
          <div><button className="account-button" type="submit" disabled={isSavingPassword}>{isSavingPassword ? 'Updating…' : 'Update password'}</button></div>
        </form>
      </section>
    </div>
  )
}
