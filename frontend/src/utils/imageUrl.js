export const getBaseApiUrl = () => {
    return (
        import.meta.env.VITE_BACKEND_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_GATEWAY_URL ||
        (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
            ? 'https://travel-management-system-xzid.onrender.com'
            : 'http://localhost:5000')
    ).replace(/\/+$/, '');
};

export const getImageUrl = (url) => {
    if (!url || url === 'undefined' || url === 'null') {
        return 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000';
    }
    if (Array.isArray(url)) {
        url = url[0];
    }
    if (typeof url !== 'string') {
        return 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000';
    }
    
    // Nếu là chuỗi JSON array như '["/uploads/xyz.jpg"]'
    if (url.startsWith('[') && url.endsWith(']')) {
        try {
            const parsed = JSON.parse(url);
            if (Array.isArray(parsed) && parsed.length > 0) {
                url = parsed[0];
            }
        } catch (e) {
            // bỏ qua nếu parse lỗi
        }
    }
    if (!url || typeof url !== 'string') {
        return 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000';
    }

    const baseUrl = getBaseApiUrl();

    // Nếu ảnh gắn cứng localhost:5000, thay thế bằng baseUrl (Render trên production)
    if (url.includes('localhost:5000') || url.includes('127.0.0.1:5000')) {
        return url.replace(/https?:\/\/(localhost|127\.0\.0\.1):5000/g, baseUrl);
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    let imagePath = url.startsWith('/') ? url.substring(1) : url;
    if (!imagePath.startsWith('uploads/')) {
        imagePath = `uploads/${imagePath}`;
    }
    return `${baseUrl}/${encodeURI(imagePath)}`;
};
