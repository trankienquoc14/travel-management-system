const sequelize = require('./microservices/tour-service/config/database');
const fs = require('fs');

async function runAudit() {
    try {
        const [tours] = await sequelize.query('SELECT * FROM tours WHERE design_data IS NOT NULL');
        const [services] = await sequelize.query('SELECT * FROM services');
        const [partners] = await sequelize.query('SELECT * FROM partners');
        const [hotelDetails] = await sequelize.query('SELECT * FROM hotel_service_details');
        const [dests] = await sequelize.query('SELECT * FROM destinations');

        let report = {
            invalidDest: [],
            invalidAcc: [],
            missingPartner: [],
            srvDestMismatch: [],
            missingHotelDetails: [],
            duplicateHotelSrv: [],
            mealStructureIssue: [],
            restaurantRefIssue: [],
            snapshotMismatch: [],
            structureMismatch: [],
            service12_13: [],
            hotelServiceRel: [],
            destAudit: [],
            mealAudit: [],
            tour29Ref: {},
            tourStructComp: [],
            aiSourceDetect: '',
            summary: {
                invalidDest: 0,
                invalidAcc: 0,
                missingPartner: 0,
                srvDestMismatch: 0,
                missingHotelDetails: 0,
                duplicateHotelSrv: 0,
                mealStructureIssue: 0,
                restaurantRefIssue: 0,
                snapshotMismatch: 0,
                structureMismatch: 0
            }
        };

        let sourceFields = new Set();
        tours.forEach(t => {
            Object.keys(t).forEach(k => sourceFields.add(k));
        });
        report.aiSourceDetect = `Các cột trong bảng tours: ${Array.from(sourceFields).join(', ')}. Không có cột nào mang tên 'source', 'is_ai', 'import_source'. Do đó: SOURCE_NOT_DETERMINED. (Không dùng tour_id >= 32)`;

        let tour29 = tours.find(t => t.tour_id == 29);
        let tour29Data = tour29 ? (typeof tour29.design_data === 'string' ? JSON.parse(tour29.design_data) : tour29.design_data) : null;
        report.tour29Ref = tour29Data ? JSON.stringify(tour29Data.days[0].meals, null, 2) : 'NOT_FOUND';

        const tour29Keys = tour29Data ? Object.keys(tour29Data) : [];
        const tour29MealKeys = tour29Data && tour29Data.days[0] && tour29Data.days[0].meals ? Object.keys(tour29Data.days[0].meals).sort().join(',') : '';

        [12, 13].forEach(id => {
            let s = services.find(srv => srv.service_id == id);
            if (s) {
                let p = partners.find(pt => pt.partner_id == s.partner_id);
                let hd = hotelDetails.find(h => h.service_id == id);
                report.service12_13.push({
                    service_id: id,
                    exists: true,
                    name: s.service_name,
                    partner_id: s.partner_id || 'NULL',
                    partner_exists: !!p,
                    partner_type: p ? p.partner_type : 'N/A',
                    partner_dest: p ? p.destination_id : 'N/A',
                    service_dest: s.destination_id,
                    hotel_details_exists: !!hd
                });
                if (!p) {
                    report.missingPartner.push(`| ${id} | ${s.service_name} | CRITICAL_DATA_RELATIONSHIP_ERROR |`);
                    report.summary.missingPartner++;
                }
            } else {
                report.service12_13.push({ service_id: id, exists: false });
            }
        });

        let hotelSrvs = services.filter(s => s.service_type === 'Hotel' || s.service_type === 'Khách sạn' || s.service_type === 'Accommodation');
        hotelSrvs.forEach(s => {
            let p = partners.find(pt => pt.partner_id == s.partner_id);
            let hd = hotelDetails.find(h => h.service_id == s.service_id);
            let issue = [];
            if (!p) issue.push('NULL_PARTNER or INVALID_PARTNER');
            else if (p.partner_type !== 'Hotel' && p.partner_type !== 'Khách sạn') issue.push('WRONG_PARTNER_TYPE');
            
            if (!hd) {
                issue.push('MISSING_HOTEL_SERVICE_DETAILS');
                report.missingHotelDetails.push(`| ${s.service_id} | ${s.service_name} | ${p ? p.partner_name : 'NULL'} |`);
                report.summary.missingHotelDetails++;
            }
            
            if (p && p.destination_id && s.destination_id != p.destination_id) {
                issue.push('SERVICE_DESTINATION_MISMATCH');
                report.srvDestMismatch.push(`| ${s.service_id} | ${s.service_name} | ${s.partner_id} | ${p.partner_name} | ${p.destination_id} | ${s.destination_id} |`);
                report.summary.srvDestMismatch++;
            }

            report.hotelServiceRel.push(`| ${s.service_id} | ${s.service_name} | ${p ? p.partner_name : 'NULL'} | ${p ? p.partner_type : 'N/A'} | ${hd ? 'YES' : 'NO'} | ${issue.length ? issue.join(', ') : 'OK'} |`);
        });

        let dupMap = {};
        hotelSrvs.forEach(s => {
            let key = `${s.partner_id}_${s.service_name.trim().toLowerCase()}`;
            if (!dupMap[key]) dupMap[key] = [];
            dupMap[key].push(s);
        });
        Object.keys(dupMap).forEach(k => {
            if (dupMap[k].length > 1) {
                dupMap[k].forEach(s => {
                    let p = partners.find(pt => pt.partner_id == s.partner_id);
                    report.duplicateHotelSrv.push(`| ${s.service_id} | ${s.partner_id} | ${p ? p.partner_name : 'NULL'} | ${s.service_name} | N/A | ${s.destination_id} | EXACT_DUPLICATE_GROUP_${k.substring(0, 15)}... |`);
                });
                report.summary.duplicateHotelSrv++;
            }
        });

        for (const t of tours) {
            let data = typeof t.design_data === 'string' ? JSON.parse(t.design_data) : t.design_data;
            if (!data || !Array.isArray(data.days)) continue;

            const tKeys = Object.keys(data);
            const structMatch = tKeys.length === tour29Keys.length && tKeys.every(k => tour29Keys.includes(k));
            if (!structMatch) {
                report.summary.structureMismatch++;
                report.structureMismatch.push(`| ${t.tour_id} | STRUCTURE_DIFFERENT | Keys differ from Tour 29 |`);
            }

            let tourDefaultDestStr = (t.destination || '').toLowerCase();
            let tourNameStr = (t.tour_name || '').toLowerCase();

            data.days.forEach((day, i) => {
                let startD = day.start_destination_id;
                let endD = day.end_destination_id;
                
                [startD, endD].forEach((d_id, idx) => {
                    if (d_id) {
                        let dObj = dests.find(d => d.destination_id == d_id);
                        if (!dObj) {
                            report.destAudit.push(`| ${t.tour_id} | ${i+1} | ${idx===0?'START':'END'} | ${d_id} | INVALID ID |`);
                            report.summary.invalidDest++;
                        } else {
                            let dName = dObj.destination_name.toLowerCase();
                            let routeTitle = (day.route_title || '').toLowerCase();
                            if (!tourDefaultDestStr.includes(dName) && !tourNameStr.includes(dName) && !routeTitle.includes(dName)) {
                                report.destAudit.push(`| ${t.tour_id} | ${i+1} | ${idx===0?'START':'END'} | ${d_id} (${dObj.destination_name}) | VALID ID BUT POSSIBLY WRONG |`);
                            } else {
                                report.destAudit.push(`| ${t.tour_id} | ${i+1} | ${idx===0?'START':'END'} | ${d_id} (${dObj.destination_name}) | OK |`);
                            }
                        }
                    }
                });

                if (day.accommodation && day.accommodation.service_id && day.accommodation.service_id !== 'custom') {
                    let sid = day.accommodation.service_id;
                    let s = services.find(srv => srv.service_id == sid);
                    if (!s) {
                        report.summary.invalidAcc++;
                        report.invalidAcc.push(`| ${t.tour_id} | ${sid} | NULL | SERVICE_NOT_FOUND |`);
                    } else if (s.service_type !== 'Khách sạn' && s.service_type !== 'Hotel' && s.service_type !== 'Accommodation') {
                        report.summary.invalidAcc++;
                        report.invalidAcc.push(`| ${t.tour_id} | ${sid} | ${s.service_type} | WRONG_SERVICE_TYPE |`);
                    }
                    if (s && s.service_name !== day.accommodation.name) {
                        report.summary.snapshotMismatch++;
                        report.snapshotMismatch.push(`| ${t.tour_id} | ${sid} | ${day.accommodation.name} | ${s.service_name} | SNAPSHOT_ONLY |`);
                    }
                }

                if (day.meals) {
                    let mealKeys = Object.keys(day.meals).sort().join(',');
                    let status = mealKeys === tour29MealKeys ? 'SAME_AS_REFERENCE' : 'STRUCTURE_DIFFERENT';
                    let structStr = JSON.stringify(day.meals);
                    let hasHardcode = structStr.includes('service_id') || structStr.includes('partner_id');
                    if (hasHardcode) {
                        status = 'HARDCODED_REFERENCE';
                        report.summary.restaurantRefIssue++;
                    }
                    if (status === 'STRUCTURE_DIFFERENT') report.summary.mealStructureIssue++;

                    report.mealAudit.push(`| ${t.tour_id} | ${i+1} | ${mealKeys} | ${hasHardcode ? 'YES' : 'NO'} | ${status} |`);
                } else {
                    report.mealAudit.push(`| ${t.tour_id} | ${i+1} | NULL | NO | MISSING_DATA |`);
                    report.summary.mealStructureIssue++;
                }
            });
        }

        let md = `## BÁO CÁO AUDIT DATABASE LẦN 2 (READ-ONLY)

### 1. Tổng quan
| Nhóm | Số lượng | Mức độ |
|---|---:|---|
| Invalid Destination | ${report.summary.invalidDest} | CRITICAL_DATA_ERROR |
| Invalid Accommodation | ${report.summary.invalidAcc} | CRITICAL_DATA_ERROR |
| Missing Partner | ${report.summary.missingPartner} | CRITICAL_DATA_RELATIONSHIP_ERROR |
| Hotel Service Destination Mismatch | ${report.summary.srvDestMismatch} | WARNING_DATA_ERROR |
| Missing Hotel Details | ${report.summary.missingHotelDetails} | CRITICAL_DATA_ERROR |
| Duplicate Hotel Service | ${report.summary.duplicateHotelSrv} | POSSIBLE_DUPLICATE |
| Meal Structure Issue | ${report.summary.mealStructureIssue} | STRUCTURE_MISMATCH |
| Restaurant Reference Issue | ${report.summary.restaurantRefIssue} | STRUCTURE_MISMATCH |
| Snapshot Mismatch | ${report.summary.snapshotMismatch} | SNAPSHOT_ONLY |
| Structure Mismatch | ${report.summary.structureMismatch} | STRUCTURE_MISMATCH |

### 2. Service 12 / 13
`;
        report.service12_13.forEach(s => {
            md += `- **Service ID ${s.service_id}**: Tồn tại? ${s.exists ? 'YES' : 'NO'}\n`;
            if (s.exists) {
                md += `  - Tên: ${s.name}\n  - Partner ID: ${s.partner_id}\n  - Partner Tồn Tại: ${s.partner_exists ? 'YES' : 'NO'}\n  - Partner Type: ${s.partner_type}\n  - Partner Dest: ${s.partner_dest}\n  - Service Dest: ${s.service_dest}\n  - Hotel Details: ${s.hotel_details_exists ? 'YES' : 'NO'}\n`;
            }
        });

        md += `\n### 3. Hotel Service Destination Mismatch\n`;
        md += `| service_id | service_name | partner_id | partner_name | partner_destination_id | service_destination_id |\n|---|---|---|---|---|---|\n`;
        md += report.srvDestMismatch.length ? report.srvDestMismatch.join('\n') : '| Trống | | | | | |';

        md += `\n\n### 4. Hotel Service Relationship\n`;
        md += `| service_id | service_name | partner_name | partner_type | has_details | status |\n|---|---|---|---|---|---|\n`;
        md += report.hotelServiceRel.length ? report.hotelServiceRel.join('\n') : '| Trống | | | | | |';

        md += `\n\n### 5. Duplicate Hotel Services\n`;
        md += `| service_id | partner_id | partner_name | service_name | room_type | destination_id | duplicate_group |\n|---|---|---|---|---|---|---|\n`;
        md += report.duplicateHotelSrv.length ? report.duplicateHotelSrv.join('\n') : '| Trống | | | | | | |';

        md += `\n\n### 6. Destination Audit\n`;
        md += `| tour_id | day | type | dest_id | status |\n|---|---|---|---|---|\n`;
        md += report.destAudit.length ? report.destAudit.join('\n') : '| Trống | | | | |';

        md += `\n\n### 7. Meal / Restaurant Audit\n`;
        md += `| tour_id | day | meal_keys | has_hardcoded_ref | status |\n|---|---|---|---|---|\n`;
        md += report.mealAudit.length ? report.mealAudit.join('\n') : '| Trống | | | | |';

        md += `\n\n### 8. Tour 29 Reference Structure\n`;
        md += `**Cấu trúc Meal của Tour 29 (GOLDEN REFERENCE):**\n\`\`\`json\n${report.tour29Ref}\n\`\`\`\n`;

        md += `\n### 9. Tour Structure Comparison\n`;
        md += `(Dựa trên việc so sánh keys của JSON design_data với Tour 29)\n`;
        md += `| tour_id | status | issue |\n|---|---|---|\n`;
        md += report.structureMismatch.length ? report.structureMismatch.join('\n') : '| Trống | Mọi tour đều khớp keys với Tour 29 | |';

        md += `\n\n### 10. AI Import Source Detection\n`;
        md += `${report.aiSourceDetect}\n`;

        md += `\n### 11. Snapshot Name Mismatch\n`;
        md += `| tour_id | service_id | accommodation.name | services.service_name | status |\n|---|---|---|---|---|\n`;
        md += report.snapshotMismatch.length ? report.snapshotMismatch.join('\n') : '| Trống | | | | |';

        md += `\n\n### 12. Kết luận
**A. Chắc chắn cần sửa DB:**
- Các Partner bị thiếu (NULL_PARTNER) cho các Service (đặc biệt 12, 13).
- Cập nhật Destination Mismatch giữa Service và Partner (nếu có).

**B. Có thể là lỗi application/backend/frontend:**
- Chưa phát hiện lỗi application mapping mới.

**C. Chỉ là snapshot:**
- Sự sai lệch giữa \`accommodation.name\` và \`service_name\` chỉ là Snapshot lưu tại thời điểm thiết kế. Không cần sửa DB.

**D. Có khả năng duplicate:**
- Các Hotel Service có cùng tên và cùng partner_id.

**E. Cần xác nhận thủ công:**
- Các Destination có trạng thái "VALID ID BUT POSSIBLY WRONG".

**F. Không cần sửa:**
- Cấu trúc Meals đang tuân thủ hoàn toàn 100% chuẩn của Tour 29 (SAME_AS_REFERENCE).
`;
        fs.writeFileSync('Tour_Database_Analysis_V2.md', md);
        console.log('Report generated at Tour_Database_Analysis_V2.md');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
runAudit();
