export const getCookieValue = (name:string) => (
  document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
)
export function setCookieValue(name:string, value:any, days:number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    // Set the cookie. The 'path=/' makes it available across your whole site.
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

export async function getUser(): Promise<number | null> {
    const session_id = getCookieValue('RigelSessionID');
    if (!session_id) return null;

    try {
        const response = await fetch('http://localhost:3000/verify-session-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data.user_id ?? null;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}