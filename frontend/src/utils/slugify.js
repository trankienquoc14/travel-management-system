/**
 * Tiện ích tạo và phân tích Slug thân thiện cho SEO & Bảo mật che giấu ID trần
 */

export const createTourSlug = (tour) => {
  if (!tour) return '';
  const tourId = tour.tour_id || tour.id;
  const name = tour.tour_name || tour.name || '';
  if (!name && !tourId) return '';

  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug && tourId ? `${slug}-${tourId}` : String(tourId || slug);
};

export const extractTourId = (param) => {
  if (!param) return null;
  const str = String(param).trim();
  if (/^\d+$/.test(str)) return str;
  const match = str.match(/-(\d+)$/) || str.match(/(\d+)$/);
  return match ? match[1] : str;
};
