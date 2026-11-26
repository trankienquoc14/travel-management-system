export const getBaseApiUrl = () => {
    return import.meta.env.VITE_API_GATEWAY_URL || (
        typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
            ? 'https://travel-management-system-gateway.onrender.com'
            : 'http://localhost:5000'
    );
};

export const getImageUrl = (url) => {
    if (!url || url === 'undefined' || url === 'null') {
        return 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000';
    }
    if (typeof url !== 'string') {
        return 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000';
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    let imagePath = url.startsWith('/') ? url.substring(1) : url;
    if (!imagePath.startsWith('uploads/')) {
        imagePath = `uploads/${imagePath}`;
    }
    const baseUrl = getBaseApiUrl();
    return `${baseUrl}/${encodeURI(imagePath)}`;
};
