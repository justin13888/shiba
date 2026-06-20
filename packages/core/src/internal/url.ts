/**
 * Best-effort hostname extraction without the DOM `URL` (kept out of pure core).
 * Returns the host for authority URLs, else the scheme (e.g. `chrome`, `about`).
 */
export function hostnameOf(url: string): string {
    const authority = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(url);
    if (authority?.[1]) {
        return authority[1]
            .replace(/^[^@]*@/, "") // strip userinfo
            .replace(/:\d+$/, "") // strip port
            .toLowerCase();
    }
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url);
    return (scheme?.[1] ?? url).toLowerCase();
}
