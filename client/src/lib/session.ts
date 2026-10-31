const SESSION_KEY = "lookshow_admin_session"

export function beginSession() {
  sessionStorage.setItem(SESSION_KEY, "1")
}

export async function endSession(redirectTo = "/admin") {
  sessionStorage.removeItem(SESSION_KEY)
  window.location.assign(redirectTo)
}
