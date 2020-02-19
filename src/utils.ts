export function searchParams(): URLSearchParams {
    const url = new URL(window.location.href);
    return url.searchParams;
}