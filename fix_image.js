const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8');

const helper = `
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('blob:')) return url;
    if (url.startsWith('/')) return \`\${GATEWAY_URL}\${url}\`;
    return url;
  };

`;

if (!c.includes('const getImageUrl')) {
    c = c.replace('  useEffect(() => {', helper + '  useEffect(() => {');
}

c = c.replace('src={v.image_url || fallbackImg}', 'src={getImageUrl(v.image_url) || fallbackImg}');
c = c.replace('src={formData.imagePreview}', 'src={getImageUrl(formData.imagePreview)}');

fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', c);
console.log("Image URL prefix fixed.");
