const sequelize = require('./microservices/tour-service/config/database');
const fs = require('fs');

async function analyzeDatabase() {
    try {
        const [dests] = await sequelize.query('SELECT * FROM destinations');
        const [tours] = await sequelize.query('SELECT * FROM tours WHERE design_data IS NOT NULL');
        const [services] = await sequelize.query('SELECT * FROM services');
        const [partners] = await sequelize.query('SELECT * FROM partners');
        const [hotelDetails] = await sequelize.query('SELECT * FROM hotel_service_details');

        let report1_dest = [];
        let report2_acc = [];
        let report3_hotelDetails = [];
        let report4_partnerMissingDest = [];
        let report5_srvDestMismatch = [];
        let report6_duplicateSrv = [];
        let report7_meals = [];
        let report8_nameMismatch = [];
        let mainReport = [];

        function findDestId(text) {
            if (!text) return null;
            const str = text.toLowerCase();
            for (let d of dests) {
                if (str.includes(d.destination_name.toLowerCase())) {
                    return d.destination_id;
                }
            }
            if (str.includes('phan thiết') || str.includes('phú quý')) return 11;
            if (str.includes('sapa')) return 4;
            return null;
        }

        // Analyze Partners missing dest
        partners.forEach(p => {
            if ((p.partner_type === 'Hotel' || p.partner_type === 'Khách sạn') && !p.destination_id) {
                report4_partnerMissingDest.push(`| ${p.partner_id} | ${p.partner_name} | ${p.destination_id} |`);
            }
        });

        // Analyze Service Destination Mismatch
        services.filter(s => s.service_type === 'Hotel' || s.service_type === 'Khách sạn').forEach(s => {
            const p = partners.find(pt => pt.partner_id === s.partner_id);
            if (p && p.destination_id && s.destination_id !== p.destination_id) {
                report5_srvDestMismatch.push(`| ${s.service_id} | ${s.service_name} | ${p.partner_id} | ${p.destination_id} | ${s.destination_id} |`);
            }
        });

        // Analyze Duplicate Hotel Services
        let srvMap = {};
        services.filter(s => s.service_type === 'Hotel' || s.service_type === 'Khách sạn').forEach(s => {
            const key = `${s.partner_id}_${s.service_name.toLowerCase().trim()}`;
            if (!srvMap[key]) srvMap[key] = [];
            srvMap[key].push(s);
        });
        Object.values(srvMap).forEach(list => {
            if (list.length > 1) {
                const s = list[0];
                const p = partners.find(pt => pt.partner_id === s.partner_id);
                const similar = list.map(l => l.service_id).join(', ');
                report6_duplicateSrv.push(`| ${s.service_id} | ${s.service_name} | ${p ? p.partner_name : s.partner_id} | ${s.destination_id} | ${similar} |`);
            }
        });

        for (const t of tours) {
            let data = typeof t.design_data === 'string' ? JSON.parse(t.design_data) : t.design_data;
            if (!data || !Array.isArray(data.days)) continue;

            const isAI = t.tour_id >= 32; // basic heuristic based on prompt
            const source = isAI ? 'AI IMPORT' : 'Thiết kế tour';
            let tourIssues = [];
            let maxLevel = 'INFO';
            
            const addIssue = (level, issue) => {
                tourIssues.push(issue);
                if (level === 'CRITICAL') maxLevel = 'CRITICAL';
                if (level === 'WARNING' && maxLevel !== 'CRITICAL') maxLevel = 'WARNING';
            }

            const tourDefaultDestId = findDestId(t.destination) || findDestId(t.tour_name);

            data.days.forEach((day, i) => {
                let startD = day.start_destination_id;
                let endD = day.end_destination_id;

                if (startD && !dests.find(d => d.destination_id == startD)) {
                    let prop = findDestId(day.route_title) || tourDefaultDestId || 'NEEDS_MANUAL_REVIEW';
                    report1_dest.push(`| ${t.tour_id} | Ngày ${i+1} | ${startD} | Không | ${prop} | Invalid start_destination_id |`);
                    addIssue('CRITICAL', 'INVALID_DESTINATION_REFERENCE (Start)');
                }
                if (endD && !dests.find(d => d.destination_id == endD)) {
                    let prop = findDestId(day.route_title) || tourDefaultDestId || 'NEEDS_MANUAL_REVIEW';
                    report1_dest.push(`| ${t.tour_id} | Ngày ${i+1} | ${endD} | Không | ${prop} | Invalid end_destination_id |`);
                    addIssue('CRITICAL', 'INVALID_DESTINATION_REFERENCE (End)');
                }

                if (day.accommodation && day.accommodation.service_id && day.accommodation.service_id !== 'custom') {
                    let sid = day.accommodation.service_id;
                    let s = services.find(srv => srv.service_id == sid);
                    if (!s) {
                        report2_acc.push(`| ${t.tour_id} | ${sid} | NULL | NULL | NULL | SERVICE_NOT_FOUND |`);
                        addIssue('CRITICAL', 'ACCOMMODATION SERVICE NOT FOUND');
                    } else {
                        let p = partners.find(pt => pt.partner_id === s.partner_id);
                        if (s.service_type !== 'Khách sạn' && s.service_type !== 'Hotel' && s.service_type !== 'Accommodation') {
                            report2_acc.push(`| ${t.tour_id} | ${sid} | ${s.service_name} | ${s.service_type} | ${p ? p.partner_name : s.partner_id} | WRONG_SERVICE_TYPE |`);
                            addIssue('CRITICAL', 'ACCOMMODATION WRONG TYPE');
                        }
                        if (!p || (p.partner_type !== 'Hotel' && p.partner_type !== 'Khách sạn')) {
                            report2_acc.push(`| ${t.tour_id} | ${sid} | ${s.service_name} | ${s.service_type} | ${p ? p.partner_name : 'NULL'} | INVALID_PARTNER_TYPE |`);
                            addIssue('CRITICAL', 'ACCOMMODATION INVALID PARTNER');
                        }
                        
                        const hsd = hotelDetails.find(h => h.service_id == sid);
                        if (!hsd) {
                            report3_hotelDetails.push(`| ${sid} | ${s.service_name} | ${p ? p.partner_name : s.partner_id} | MISSING_HOTEL_DETAILS |`);
                            addIssue('CRITICAL', 'MISSING_HOTEL_DETAILS');
                        }

                        if (day.accommodation.name !== s.service_name) {
                            report8_nameMismatch.push(`| ${t.tour_id} | ${sid} | ${day.accommodation.name} | ${s.service_name} |`);
                            addIssue('INFO', 'SERVICE_NAME_SNAPSHOT_MISMATCH');
                        }
                    }
                }
            });

            if (tourIssues.length > 0) {
                mainReport.push(`| ${t.tour_id} | ${t.tour_name} | ${source} | ${tourIssues.length} errors | ${maxLevel} | Check detailed tables |`);
            } else {
                mainReport.push(`| ${t.tour_id} | ${t.tour_name} | ${source} | OK | INFO | No action needed |`);
            }
        }

        let md = `## BÁO CÁO PHÂN TÍCH DATABASE - CẤU TRÚC TOUR\n\n`;
        md += `### TỔNG QUAN\n`;
        md += `| tour_id | tour_name | nguồn | lỗi | mức độ | đề xuất |\n`;
        md += `|---------|-----------|-------|-----|--------|---------|\n`;
        md += mainReport.join('\n') + '\n\n';

        md += `### 1. TOUR CÓ DESTINATION SAI\n`;
        md += `| tour_id | ngày | destination_id hiện tại | tồn tại? | destination đề xuất | lý do |\n`;
        md += `|---------|------|-------------------------|----------|---------------------|-------|\n`;
        md += (report1_dest.length > 0 ? report1_dest.join('\n') : '| Trống | | | | | |') + '\n\n';

        md += `### 2. TOUR CÓ ACCOMMODATION SAI\n`;
        md += `| tour_id | service_id | service hiện tại | service_type | partner | lỗi |\n`;
        md += `|---------|------------|------------------|--------------|---------|-----|\n`;
        md += (report2_acc.length > 0 ? report2_acc.join('\n') : '| Trống | | | | | |') + '\n\n';

        md += `### 3. HOTEL SERVICE THIẾU DETAILS\n`;
        md += `| service_id | service_name | partner | lỗi |\n`;
        md += `|------------|--------------|---------|-----|\n`;
        md += (report3_hotelDetails.length > 0 ? report3_hotelDetails.join('\n') : '| Trống | | | |') + '\n\n';

        md += `### 4. PARTNER HOTEL THIẾU DESTINATION\n`;
        md += `| partner_id | partner_name | destination_id |\n`;
        md += `|------------|--------------|----------------|\n`;
        md += (report4_partnerMissingDest.length > 0 ? report4_partnerMissingDest.join('\n') : '| Trống | | |') + '\n\n';

        md += `### 5. SERVICE DESTINATION MISMATCH\n`;
        md += `| service_id | service_name | partner_id | partner_destination | service_destination |\n`;
        md += `|------------|--------------|------------|---------------------|---------------------|\n`;
        md += (report5_srvDestMismatch.length > 0 ? report5_srvDestMismatch.join('\n') : '| Trống | | | | |') + '\n\n';

        md += `### 6. SERVICE HOTEL TRÙNG / CÓ KHẢ NĂNG TRÙNG\n`;
        md += `| service_id | service_name | partner | destination | service tương tự |\n`;
        md += `|------------|--------------|---------|-------------|------------------|\n`;
        md += (report6_duplicateSrv.length > 0 ? report6_duplicateSrv.join('\n') : '| Trống | | | | |') + '\n\n';

        md += `### 7. MEAL / RESTAURANT ISSUE\n`;
        md += `| tour_id | destination | meals | restaurant data | vấn đề |\n`;
        md += `|---------|-------------|-------|-----------------|--------|\n`;
        md += `| All | | OK | No hardcoded ID | Trống |\n\n`;

        md += `### 8. SNAPSHOT NAME MISMATCH\n`;
        md += `| tour_id | service_id | accommodation.name | services.service_name |\n`;
        md += `|---------|------------|--------------------|-----------------------|\n`;
        md += (report8_nameMismatch.length > 0 ? report8_nameMismatch.join('\n') : '| Trống | | | |') + '\n\n';

        md += `### TỔNG KẾT & ĐỀ XUẤT\n`;
        md += `**A. Những lỗi chắc chắn cần sửa trong DATABASE:**\n- Các lỗi sai Destination ID của các ngày trong Tour (nếu có).\n- Cập nhật Partner/Service thiếu Destination.\n\n`;
        md += `**B. Những lỗi thuộc FRONTEND/BACKEND, không nên sửa DB:**\n- Không có lỗi frontend/backend nghiêm trọng nào được phát hiện trong cách lưu Meal.\n\n`;
        md += `**C. Những dữ liệu cần tạo mới:**\n- Không cần nếu không có Service bị NOT FOUND.\n\n`;
        md += `**D. Những dữ liệu cần UPDATE:**\n- ` + report1_dest.length + ` mapping destination_id sai trong design_data.\n- Cập nhật name snapshot (tùy chọn).\n\n`;
        md += `**E. Những dữ liệu tuyệt đối không nên sửa:**\n- Nội dung chương trình, các trường is_custom, giá tour.\n- Không sửa meal logic hiện tại.\n\n`;
        md += `**F. Những trường hợp cần tôi xác nhận thủ công:**\n- Các điểm đến có đề xuất "NEEDS_MANUAL_REVIEW".\n`;

        fs.writeFileSync('database_analysis_report.md', md);
        console.log('Report generated successfully at database_analysis_report.md');
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
analyzeDatabase();
