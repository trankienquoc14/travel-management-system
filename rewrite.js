const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/HomePage.jsx', 'utf8');
code = code.replace(/const HomePage = \\(\\) => \\{/g, 'const TourListPage = () => {');
code = code.replace(/export default HomePage;/g, 'export default TourListPage;');
const startHero = code.indexOf('            {/* HERO BANNER */}');
const endServices = code.indexOf('            <section ref={showcaseRef}');
if (startHero !== -1 && endServices !== -1) {
    code = code.substring(0, startHero) + '            <div style={{ paddingTop: "100px" }}></div>\n' + code.substring(eneServices);
}
fs.writeFileSync('frontend/src/components/TourListPage.jsx', code);
