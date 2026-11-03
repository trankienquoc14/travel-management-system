import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart3,
  TrendingUp,
  Map,
  Compass,
  Truck,
  ShieldAlert,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Award
} from 'lucide-react';
import OfficeStaffDashboard from './OfficeStaffDashboard';

/* ============================================================================
 * REUSABLE ERP SVG CHART COMPONENTS
 * ============================================================================ */

/**
 * 1. Biểu đồ Tròn / Donut (SVG Donut Chart) chuẩn ERP
 */
const ErpDonutChart = ({
  segments = [],
  size = 176,
  strokeWidth = 24,
  centerLabel = '',
  centerSubLabel = '',
  onSelectSegment = null
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + Number(s.value || 0), 0);

  let accumulatedPercent = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, margin: '0 auto' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {total > 0 &&
            segments.map((seg, idx) => {
              const val = Number(seg.value || 0);
              if (val <= 0) return null;
              const pct = val / total;
              const dashArray = `${pct * circumference} ${circumference}`;
              const dashOffset = -accumulatedPercent * circumference;
              accumulatedPercent += pct;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  style={{
                    transition: 'stroke-dasharray 0.35s ease',
                    cursor: onSelectSegment ? 'pointer' : 'default'
                  }}
                  onClick={(e) => {
                    if (onSelectSegment) {
                      e.stopPropagation();
                      onSelectSegment(seg, idx);
                    }
                  }}
                >
                  <title>{`${seg.label}: ${seg.displayValue || val} (${Math.round(pct * 100)}%)`}</title>
                </circle>
              );
            })}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '16px',
            pointerEvents: 'none'
          }}
        >
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', lineHeight: 1.15 }}>
            {centerLabel}
          </span>
          {centerSubLabel && (
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginTop: '3px' }}>
              {centerSubLabel}
            </span>
          )}
        </div>
      </div>

      {/* Chú thích (Legend) */}
      <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {segments.map((seg, idx) => {
          const val = Number(seg.value || 0);
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          return (
            <div
              key={idx}
              onClick={(e) => {
                if (onSelectSegment) {
                  e.stopPropagation();
                  onSelectSegment(seg, idx);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
                fontSize: '12px',
                cursor: onSelectSegment ? 'pointer' : 'default'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '3px',
                    background: seg.color,
                    flexShrink: 0
                  }}
                />
                <span
                  style={{
                    color: '#334155',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={seg.label}
                >
                  {seg.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
                <strong style={{ color: '#0f172a', fontWeight: '700' }}>
                  {seg.displayValue !== undefined ? seg.displayValue : val}
                </strong>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#64748b',
                    background: '#e2e8f0',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    minWidth: '36px',
                    textAlign: 'center'
                  }}
                >
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 2. Biểu đồ Cột Đứng Đôi / Đơn (Vertical Grouped Column Chart) chuẩn ERP
 *    Hỗ trợ trục tung, đường chuẩn Trung bình (Benchmark Line) và bấm vào từng cột để xem chi tiết
 */
const ErpVerticalColumnChart = ({
  data = [],
  series = [], // [{ key, label, color, format }]
  avgValue = null,
  avgLabel = 'Trung bình',
  height = 240,
  onBarClick = null
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          borderRadius: '10px',
          color: '#94a3b8',
          fontSize: '13px'
        }}
      >
        Chưa có dữ liệu biểu đồ
      </div>
    );
  }

  // Tính max cho từng series để chuẩn hóa chiều cao cột
  const maxBySeries = {};
  series.forEach((s) => {
    const m = Math.max(...data.map((item) => Number(item[s.key] || 0)), 1);
    maxBySeries[s.key] = m;
  });

  const primarySeries = series[0];
  const primaryMax = maxBySeries[primarySeries.key] || 1;
  const avgPct = avgValue !== null && primaryMax > 0 ? Math.min(Math.round((avgValue / primaryMax) * 100), 96) : null;

  return (
    <div>
      {/* Chú thích (Legend) phía trên biểu đồ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px',
          fontSize: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {series.map((s) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.color }} />
              <span style={{ color: '#475569', fontWeight: '600' }}>{s.label}</span>
            </div>
          ))}
          {avgPct !== null && avgValue > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '16px', height: '0px', borderTop: '2px dashed #f59e0b' }} />
              <span style={{ color: '#b45309', fontWeight: '600' }}>{avgLabel}</span>
            </div>
          )}
        </div>
        {onBarClick && (
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Bấm vào cột bất kỳ để xem hồ sơ chi tiết
          </span>
        )}
      </div>

      {/* Khung vẽ biểu đồ cột đứng */}
      <div
        style={{
          position: 'relative',
          height: `${height}px`,
          padding: '18px 12px 38px 12px',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          gap: '10px'
        }}
      >
        {/* Các đường kẻ lưới ngang (Gridlines) */}
        {[0.25, 0.5, 0.75, 1].map((line, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '12px',
              right: '12px',
              bottom: `${38 + line * (height - 64)}px`,
              borderTop: '1px dashed #e2e8f0',
              pointerEvents: 'none'
            }}
          />
        ))}

        {/* Đường Trung Bình (Average Benchmark Line) */}
        {avgPct !== null && avgValue > 0 && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              right: '12px',
              bottom: `${38 + (avgPct / 100) * (height - 64)}px`,
              borderTop: '2px dashed #f59e0b',
              zIndex: 2,
              pointerEvents: 'none'
            }}
          >
            <span
              style={{
                position: 'absolute',
                right: '4px',
                top: '-18px',
                background: '#fef3c7',
                color: '#b45309',
                fontSize: '10px',
                fontWeight: '700',
                padding: '1px 6px',
                borderRadius: '4px',
                border: '1px solid #fde68a'
              }}
            >
              TB
            </span>
          </div>
        )}

        {/* Các nhóm cột (Columns) */}
        {data.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={(e) => {
              if (onBarClick) {
                e.stopPropagation();
                onBarClick(item);
              }
            }}
            style={{
              flex: 1,
              maxWidth: '90px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              position: 'relative',
              zIndex: 3,
              cursor: onBarClick ? 'pointer' : 'default'
            }}
            title={`Bấm để xem chi tiết: ${item.fullName || item.label}`}
          >
            {/* Nhóm các cột của 1 đối tượng */}
            <div
              style={{
                width: '100%',
                height: `${height - 64}px`,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: series.length > 1 ? '4px' : '0px'
              }}
            >
              {series.map((s) => {
                const rawVal = Number(item[s.key] || 0);
                const maxVal = maxBySeries[s.key] || 1;
                const barH = rawVal > 0 ? Math.max(Math.round((rawVal / maxVal) * 100), 8) : 3;
                const formatted = s.format ? s.format(rawVal) : rawVal;

                return (
                  <div
                    key={s.key}
                    style={{
                      flex: 1,
                      maxWidth: series.length > 1 ? '26px' : '38px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#334155',
                        marginBottom: '4px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {formatted}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: `${barH}%`,
                        background: s.color,
                        borderRadius: '5px 5px 2px 2px',
                        transition: 'height 0.35s ease, opacity 0.2s ease',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)'
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Nhãn trục hoành (X-Axis Label) */}
            <div
              style={{
                position: 'absolute',
                bottom: '-30px',
                left: '-4px',
                right: '-4px',
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: '600',
                color: '#334155',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 3. Biểu đồ Đường & Miền (SVG Smooth Area Chart) cho Xu hướng Doanh thu
 */
const ErpAreaChart = ({ data = [], formatValue }) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          borderRadius: '10px',
          color: '#94a3b8',
          fontSize: '13px'
        }}
      >
        Chưa có dữ liệu chuỗi thời gian
      </div>
    );
  }

  const slice = data.slice(-10);
  const maxVal = Math.max(...slice.map((d) => Number(d.revenue || 0)), 1);
  const width = 560;
  const height = 180;
  const padX = 28;
  const padY = 24;

  const points = slice.map((d, i) => {
    const x = slice.length === 1 ? width / 2 : padX + (i / (slice.length - 1)) * (width - padX * 2);
    const y = height - padY - (Number(d.revenue || 0) / maxVal) * (height - padY * 2);
    return { x, y, item: d };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${points[0].x},${height - padY} ${linePoints} ${points[points.length - 1].x},${height - padY}`;

  return (
    <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9', padding: '12px' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '185px', overflow: 'visible' }}>
        <defs>
          <linearGradient id="erpRevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Đường lưới ngang */}
        {[0.25, 0.5, 0.75, 1].map((g, idx) => {
          const y = height - padY - g * (height - padY * 2);
          return (
            <line
              key={idx}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          );
        })}

        <polygon points={areaPoints} fill="url(#erpRevGrad)" />
        <polyline
          fill="none"
          stroke="#0284c7"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={linePoints}
        />

        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5">
              <title>{`${p.item.date_label}: ${formatValue ? formatValue(p.item.revenue) : p.item.revenue}`}</title>
            </circle>
            <text
              x={p.x}
              y={height - 6}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#64748b"
            >
              {p.item.date_label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

/* ============================================================================
 * MAIN COMPONENT: GeneralOverview
 * ============================================================================ */
const GeneralOverview = ({ onNavigateToOrders, onNavigateToChangeRequests }) => {
  // 'charts_hub' | 'tour_comparison' | 'guide_comparison' | 'driver_comparison' | 'revenue' | 'hr_stats' | 'incidents' | 'partners'
  const [activeSubTab, setActiveSubTab] = useState('charts_hub');
  const [loading, setLoading] = useState(true);

  // State chọn xem hồ sơ chi tiết của từng cá nhân / từng tour (Drill-down)
  const [selectedTourId, setSelectedTourId] = useState(null);
  const [selectedGuideId, setSelectedGuideId] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState(null);

  // State chọn đối chiếu trực tiếp (Compare Mode)
  const [compareTourIds, setCompareTourIds] = useState([]);
  const [compareGuideIds, setCompareGuideIds] = useState([]);
  const [compareDriverIds, setCompareDriverIds] = useState([]);

  // Dữ liệu hệ thống
  const [allTours, setAllTours] = useState([]);
  const [allGuides, setAllGuides] = useState([]);
  const [guideWorks, setGuideWorks] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [driverTrips, setDriverTrips] = useState([]);
  const [allTripReports, setAllTripReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [leaveList, setLeaveList] = useState([]);

  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    pendingAmount: 0,
    paidBookingsCount: 0,
    pendingBookingsCount: 0,
    cancelledBookingsCount: 0,
    timeline: [],
    topTours: [],
    departures: [],
    recentBookings: []
  });

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [
        resTours,
        resGuides,
        resGuideWorks,
        resDrivers,
        resDriverTrips,
        resReports,
        resIncidents,
        resDashboardStats,
        resLeaves
      ] = await Promise.all([
        axios.get('http://localhost:5000/api/tours', { headers }).catch(() => null),
        axios.get('http://localhost:5000/api/guide/all-guides', { headers }).catch(() => null),
        axios.get('http://localhost:5000/api/guide/work?guide_id=all', { headers }).catch(() => null),
        axios.get('http://localhost:5000/api/driver/all-drivers', { headers }).catch(() => null),
        axios.get('http://localhost:5000/api/driver/work?driver_id=all', { headers }).catch(() => null),
        axios.get('http://localhost:5000/api/guide/all-reports', { headers }).catch(() => null),
        axios.get('http://localhost:5000/api/tours/incidents/all', { headers }).catch(() => null),
        axios.get('http://localhost:5000/api/bookings/admin/staff-dashboard-stats?period=all', { headers }).catch(() => null),
        axios.get('http://localhost:5000/api/hr/leave-requests', { headers }).catch(() => null)
      ]);

      if (resTours?.data) {
        const list = Array.isArray(resTours.data) ? resTours.data : (resTours.data.data || []);
        setAllTours(list);
      }
      if (resGuides?.data?.success) setAllGuides(resGuides.data.data || []);
      if (resGuideWorks?.data?.success) setGuideWorks(resGuideWorks.data.data || []);
      if (resDrivers?.data?.success) setAllDrivers(resDrivers.data.data || []);
      if (resDriverTrips?.data?.success) setDriverTrips(resDriverTrips.data.data || []);
      if (resReports?.data?.success) setAllTripReports(resReports.data.data || []);
      if (resIncidents?.data?.success) setIncidents(resIncidents.data.data || []);
      if (resLeaves?.data?.success) setLeaveList(resLeaves.data.data || []);

      if (resDashboardStats?.data?.success) {
        const d = resDashboardStats.data.data || {};
        const kpis = d.kpis || {};
        setBookingStats({
          totalBookings: Number(kpis.total_bookings || 0),
          totalRevenue: Number(kpis.total_revenue || 0),
          pendingAmount: Number(kpis.pending_revenue || 0),
          paidBookingsCount: Number(kpis.paid_bookings_count || 0),
          pendingBookingsCount: Number(kpis.pending_bookings_count || 0),
          cancelledBookingsCount: Number(kpis.cancelled_bookings_count || 0),
          timeline: d.timeline || [],
          topTours: d.topTours || [],
          departures: d.departures || [],
          recentBookings: d.recentBookings || []
        });
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu tổng quan báo cáo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount || 0));
  };

  const formatCompactVND = (amount) => {
    const num = Number(amount || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}tr`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return `${num}đ`;
  };

  const getRatingScore = (val) => {
    if (val === 'Excellent') return 100;
    if (val === 'Good') return 80;
    if (val === 'Average') return 60;
    if (val === 'Poor') return 35;
    return 80;
  };

  const getShortName = (text, maxLen = 14) => {
    if (!text) return 'N/A';
    const str = String(text).trim();
    return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;
  };

  // =========================================================================
  // 1. TỔNG HỢP CHỈ SỐ TỪNG TOUR & SO SÁNH
  // =========================================================================
  const tourMetricsList = (() => {
    const map = {};
    allTours.forEach((t) => {
      map[t.tour_id] = {
        tour_id: t.tour_id,
        tour_name: t.tour_name || `Tour #${t.tour_id}`,
        destination: t.destination || 'Đa điểm đến',
        duration_days: Number(t.duration_days || 1),
        base_price: Number(t.price || t.base_price || 0),
        bookings_count: 0,
        total_passengers: 0,
        revenue: 0,
        departures_count: 0,
        completed_reports: 0,
        incidents_count: 0,
        quality_score: 0,
        departures_list: [],
        reports_list: []
      };
    });

    bookingStats.topTours.forEach((bt) => {
      if (!map[bt.tour_id]) {
        map[bt.tour_id] = {
          tour_id: bt.tour_id,
          tour_name: bt.tour_name || `Tour #${bt.tour_id}`,
          destination: 'Việt Nam',
          duration_days: 3,
          base_price: 0,
          bookings_count: 0,
          total_passengers: 0,
          revenue: 0,
          departures_count: 0,
          completed_reports: 0,
          incidents_count: 0,
          quality_score: 0,
          departures_list: [],
          reports_list: []
        };
      }
      map[bt.tour_id].bookings_count = Number(bt.bookings_count || 0);
      map[bt.tour_id].total_passengers = Number(bt.total_passengers || 0);
      map[bt.tour_id].revenue = Number(bt.revenue || 0);
    });

    guideWorks.forEach((gw) => {
      if (gw.tour_id && map[gw.tour_id]) {
        const exists = map[gw.tour_id].departures_list.some((d) => d.departure_id === gw.departure_id);
        if (!exists) {
          map[gw.tour_id].departures_count += 1;
          map[gw.tour_id].departures_list.push(gw);
        }
      }
    });

    allTripReports.forEach((rp) => {
      const matchedEntry = Object.values(map).find(
        (m) => m.tour_name === rp.tour_name || m.departures_list.some((d) => d.departure_id === rp.departure_id)
      );
      if (matchedEntry) {
        matchedEntry.completed_reports += 1;
        matchedEntry.reports_list.push(rp);
      }
    });

    incidents.forEach((inc) => {
      const matchedEntry = Object.values(map).find((m) => m.tour_name === inc.tour_name);
      if (matchedEntry) matchedEntry.incidents_count += 1;
    });

    return Object.values(map)
      .map((item) => {
        if (item.reports_list.length > 0) {
          const sum = item.reports_list.reduce((acc, r) => {
            return (
              acc +
              (getRatingScore(r.vehicle_rating) + getRatingScore(r.hotel_rating) + getRatingScore(r.restaurant_rating)) /
                3
            );
          }, 0);
          item.quality_score = Math.round(sum / item.reports_list.length);
        } else {
          item.quality_score = item.bookings_count > 0 ? 85 : 0;
        }
        return item;
      })
      .sort((a, b) => b.revenue - a.revenue || b.total_passengers - a.total_passengers);
  })();

  const avgTourRevenue =
    tourMetricsList.length > 0
      ? Math.round(tourMetricsList.reduce((s, t) => s + t.revenue, 0) / tourMetricsList.length)
      : 0;
  const avgTourPax =
    tourMetricsList.length > 0
      ? Math.round(tourMetricsList.reduce((s, t) => s + t.total_passengers, 0) / tourMetricsList.length)
      : 0;

  // =========================================================================
  // 2. TỔNG HỢP CHỈ SỐ TỪNG HƯỚNG DẪN VIÊN (HDV) & SO SÁNH
  // =========================================================================
  const guideMetricsList = (() => {
    const map = {};
    allGuides.forEach((g) => {
      map[g.guide_id] = {
        guide_id: g.guide_id,
        full_name: g.full_name || `HDV #${g.guide_id}`,
        email: g.email || '',
        phone: g.phone || '',
        experience_years: Number(g.experience_years || 1),
        languages: g.languages || 'Tiếng Việt, Tiếng Anh',
        assigned_trips: 0,
        completed_trips: 0,
        active_trips: 0,
        total_passengers_served: 0,
        total_days_worked: 0,
        reports_submitted: 0,
        incidents_count: 0,
        quality_score: 0,
        trips_list: [],
        reports_list: []
      };
    });

    guideWorks.forEach((w) => {
      const gid = w.guide_id;
      if (!gid) return;
      if (!map[gid]) {
        map[gid] = {
          guide_id: gid,
          full_name: w.assigned_guide_name || `HDV #${gid}`,
          email: w.assigned_guide_email || '',
          phone: w.assigned_guide_phone || '',
          experience_years: 2,
          languages: 'Tiếng Việt',
          assigned_trips: 0,
          completed_trips: 0,
          active_trips: 0,
          total_passengers_served: 0,
          total_days_worked: 0,
          reports_submitted: 0,
          incidents_count: 0,
          quality_score: 0,
          trips_list: [],
          reports_list: []
        };
      }
      map[gid].assigned_trips += 1;
      if (w.status === 'Completed' || w.status === 'Closed') {
        map[gid].completed_trips += 1;
      } else {
        map[gid].active_trips += 1;
      }
      map[gid].total_passengers_served += Number(w.actual_booked || 0);
      map[gid].total_days_worked += Number(w.duration_days || 1);
      map[gid].trips_list.push(w);
    });

    allTripReports.forEach((rp) => {
      const gid = rp.guide_id;
      const entry =
        map[gid] || Object.values(map).find((m) => m.full_name?.toLowerCase() === rp.guide_name?.toLowerCase());
      if (entry) {
        entry.reports_submitted += 1;
        entry.incidents_count += Number(rp.total_incidents || 0);
        entry.reports_list.push(rp);
      }
    });

    return Object.values(map)
      .map((g) => {
        if (g.reports_list.length > 0) {
          const sum = g.reports_list.reduce((acc, r) => {
            return (
              acc +
              (getRatingScore(r.vehicle_rating) + getRatingScore(r.hotel_rating) + getRatingScore(r.restaurant_rating)) /
                3
            );
          }, 0);
          g.quality_score = Math.round(sum / g.reports_list.length);
        } else {
          g.quality_score = g.assigned_trips > 0 ? 88 : 0;
        }
        return g;
      })
      .sort((a, b) => b.assigned_trips - a.assigned_trips || b.total_passengers_served - a.total_passengers_served);
  })();

  const avgGuideTrips =
    guideMetricsList.length > 0
      ? Number((guideMetricsList.reduce((s, g) => s + g.assigned_trips, 0) / guideMetricsList.length).toFixed(1))
      : 0;
  const avgGuidePax =
    guideMetricsList.length > 0
      ? Math.round(guideMetricsList.reduce((s, g) => s + g.total_passengers_served, 0) / guideMetricsList.length)
      : 0;

  // =========================================================================
  // 3. TỔNG HỢP CHỈ SỐ TỪNG TÀI XẾ & SO SÁNH
  // =========================================================================
  const driverMetricsList = (() => {
    const map = {};
    allDrivers.forEach((d) => {
      map[d.driver_id] = {
        driver_id: d.driver_id,
        full_name: d.full_name || `Tài xế #${d.driver_id}`,
        email: d.email || '',
        phone: d.phone || '',
        assigned_trips: 0,
        completed_trips: 0,
        active_trips: 0,
        total_days_driven: 0,
        total_capacity_served: 0,
        vehicles_used: new Set(),
        trips_list: []
      };
    });

    driverTrips.forEach((t) => {
      const did = t.driver_id;
      if (!did) return;
      if (!map[did]) {
        map[did] = {
          driver_id: did,
          full_name: `Tài xế #${did}`,
          email: '',
          phone: '',
          assigned_trips: 0,
          completed_trips: 0,
          active_trips: 0,
          total_days_driven: 0,
          total_capacity_served: 0,
          vehicles_used: new Set(),
          trips_list: []
        };
      }
      map[did].assigned_trips += 1;
      if (t.status === 'Completed' || t.status === 'Closed') {
        map[did].completed_trips += 1;
      } else {
        map[did].active_trips += 1;
      }
      map[did].total_days_driven += Number(t.duration_days || 1);
      const booked = Math.max(Number(t.max_slots || 0) - Number(t.available_slots || 0), 0);
      map[did].total_capacity_served += booked;
      if (t.vehicle_number) map[did].vehicles_used.add(t.vehicle_number);
      map[did].trips_list.push(t);
    });

    return Object.values(map)
      .map((d) => ({
        ...d,
        vehicles_list: Array.from(d.vehicles_used)
      }))
      .sort((a, b) => b.assigned_trips - a.assigned_trips || b.total_days_driven - a.total_days_driven);
  })();

  const avgDriverTrips =
    driverMetricsList.length > 0
      ? Number((driverMetricsList.reduce((s, d) => s + d.assigned_trips, 0) / driverMetricsList.length).toFixed(1))
      : 0;
  const avgDriverDays =
    driverMetricsList.length > 0
      ? Number((driverMetricsList.reduce((s, d) => s + d.total_days_driven, 0) / driverMetricsList.length).toFixed(1))
      : 0;

  // =========================================================================
  // 4. CHỈ SỐ CHẤT LƯỢNG ĐỐI TÁC & NHÂN SỰ / SỰ CỐ
  // =========================================================================
  const totalReports = allTripReports.length;
  const countRatings = (field, value) => allTripReports.filter((r) => r[field] === value).length;

  const partnerGoodCount =
    countRatings('vehicle_rating', 'Excellent') +
    countRatings('vehicle_rating', 'Good') +
    countRatings('hotel_rating', 'Excellent') +
    countRatings('hotel_rating', 'Good') +
    countRatings('restaurant_rating', 'Excellent') +
    countRatings('restaurant_rating', 'Good');
  const partnerTotalRatings = totalReports * 3;
  const partnerSatisfactionPct =
    partnerTotalRatings > 0 ? Math.round((partnerGoodCount / partnerTotalRatings) * 100) : 92;

  const resolvedIncidents = incidents.filter((i) => i.status === 'Resolved').length;
  const pendingIncidents = incidents.length - resolvedIncidents;
  const approvedLeaves = leaveList.filter((l) => l.status === 'Approved').length;
  const pendingLeaves = leaveList.filter((l) => l.status === 'Pending').length;

  const handleLeaveAction = async (requestId, newStatus) => {
    const confirmMsg =
      newStatus === 'Approved' ? 'Xác nhận PHÊ DUYỆT đơn xin nghỉ phép này?' : 'Xác nhận TỪ CHỐI đơn xin nghỉ phép này?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:5000/api/hr/leave-requests/${requestId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        alert(res.data.message);
        fetchData();
      }
    } catch (error) {
      alert('Lỗi cập nhật trạng thái đơn nghỉ phép: ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleCompareItem = (list, setList, id) => {
    if (list.includes(id)) {
      setList(list.filter((x) => x !== id));
    } else {
      setList([...list, id]);
    }
  };

  const selectedTour = tourMetricsList.find((t) => t.tour_id === selectedTourId) || null;
  const selectedGuide = guideMetricsList.find((g) => g.guide_id === selectedGuideId) || null;
  const selectedDriver = driverMetricsList.find((d) => d.driver_id === selectedDriverId) || null;

  const CHART_COLORS = ['#4f46e5', '#0284c7', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

  const navItems = [
    { id: 'charts_hub', label: 'Tổng quan BI', icon: BarChart3 },
    { id: 'tour_comparison', label: `Phân tích Tour (${tourMetricsList.length})`, icon: Map },
    { id: 'guide_comparison', label: `Phân tích HDV (${guideMetricsList.length})`, icon: Compass },
    { id: 'driver_comparison', label: `Phân tích Tài xế (${driverMetricsList.length})`, icon: Truck },
    { id: 'revenue', label: 'Báo cáo Doanh thu & PDF', icon: TrendingUp },
    { id: 'partners', label: 'Chất lượng Đối tác', icon: Award },
    { id: 'hr_stats', label: 'Nhân sự & Sự cố', icon: ShieldAlert }
  ];

  const cardStyle = {
    background: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '22px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: '#0f172a' }}>
      {/* ===================================================================== */}
      {/* TOP ERP EXECUTIVE HEADER & NAVIGATION BAR                             */}
      {/* ===================================================================== */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '16px',
            borderBottom: '1px solid #f1f5f9'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#eef2ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BarChart3 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#4f46e5',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  VietTravel ERP • Business Intelligence
                </span>
              </div>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                Trung Tâm Phân Tích Biểu Đồ & Báo Cáo Điều Hành
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeSubTab !== 'charts_hub' && (
              <button
                onClick={() => {
                  setActiveSubTab('charts_hub');
                  setSelectedTourId(null);
                  setSelectedGuideId(null);
                  setSelectedDriverId(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={15} />
                <span>Tổng quan Biểu đồ</span>
              </button>
            )}

            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#0f172a',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} />
              <span>{loading ? 'Đang đồng bộ...' : 'Làm mới số liệu'}</span>
            </button>
          </div>
        </div>

        {/* Thanh phân hệ ERP gọn gàng */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '14px' }}>
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSubTab(item.id);
                  setSelectedTourId(null);
                  setSelectedGuideId(null);
                  setSelectedDriverId(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isActive ? '1px solid #4f46e5' : '1px solid transparent',
                  background: isActive ? '#eef2ff' : 'transparent',
                  color: isActive ? '#4f46e5' : '#475569',
                  fontSize: '13px',
                  fontWeight: isActive ? '700' : '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconComp size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div
          style={{
            ...cardStyle,
            padding: '64px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Đang tổng hợp dữ liệu biểu đồ từ các phân hệ Tour, Nhân sự, Đội xe và Đặt vé...
        </div>
      ) : (
        <>
          {/* ================================================================= */}
          {/* MÀN HÌNH 1: TỔNG QUAN BIỂU ĐỒ ERP (CHARTS HUB)                    */}
          {/* ================================================================= */}
          {activeSubTab === 'charts_hub' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* HÀNG KPI TỔNG QUÁT (4 THẺ CHUẨN ERP) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
                <div
                  onClick={() => setActiveSubTab('revenue')}
                  style={{ ...cardStyle, padding: '18px 20px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>DOANH THU THỰC THU</span>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: '#ecfdf5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '10px 0 6px 0' }}>
                    {formatVND(bookingStats.totalRevenue)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                    <span>Đã thu: {bookingStats.paidBookingsCount} đơn</span>
                    <span style={{ color: '#059669', fontWeight: '600' }}>Chi tiết →</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveSubTab('tour_comparison')}
                  style={{ ...cardStyle, padding: '18px 20px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>HIỆU SUẤT TUYẾN TOUR</span>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: '#eef2ff',
                        color: '#4f46e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Map size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '10px 0 6px 0' }}>
                    {tourMetricsList.length} tuyến tour
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                    <span>TB: {formatCompactVND(avgTourRevenue)} / tour</span>
                    <span style={{ color: '#4f46e5', fontWeight: '600' }}>So sánh →</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveSubTab('guide_comparison')}
                  style={{ ...cardStyle, padding: '18px 20px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>ĐỘI NGŨ HƯỚNG DẪN VIÊN</span>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: '#f0f9ff',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Compass size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '10px 0 6px 0' }}>
                    {guideMetricsList.length} HDV
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                    <span>Tổng: {guideWorks.length} lượt dẫn đoàn</span>
                    <span style={{ color: '#0284c7', fontWeight: '600' }}>So sánh →</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveSubTab('driver_comparison')}
                  style={{ ...cardStyle, padding: '18px 20px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>ĐỘI NGŨ TÀI XẾ VẬN HÀNH</span>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: '#fffbeb',
                        color: '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Truck size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '10px 0 6px 0' }}>
                    {driverMetricsList.length} tài xế
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                    <span>Tổng: {driverTrips.length} chuyến xe</span>
                    <span style={{ color: '#d97706', fontWeight: '600' }}>So sánh →</span>
                  </div>
                </div>
              </div>

              {/* HÀNG BIỂU ĐỒ 1: SO SÁNH TUYẾN TOUR (BIỂU ĐỒ CỘT) & CƠ CẤU DOANH THU TOUR (BIỂU ĐỒ TRÒN) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
                {/* Biểu đồ Cột Đứng: So sánh Doanh thu & Lượng khách giữa các Tour */}
                <div style={cardStyle}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#4f46e5', textTransform: 'uppercase' }}>
                        Biểu đồ Cột Đôi • So sánh Tuyến Tour
                      </span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                        So Sánh Doanh Thu & Lượng Khách Giữa Các Tour
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveSubTab('tour_comparison')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#4f46e5',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Xem chi tiết</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <ErpVerticalColumnChart
                    data={tourMetricsList.slice(0, 6).map((t) => ({
                      id: t.tour_id,
                      label: getShortName(t.tour_name, 13),
                      fullName: t.tour_name,
                      revenue: t.revenue,
                      passengers: t.total_passengers
                    }))}
                    series={[
                      { key: 'revenue', label: 'Doanh thu', color: '#4f46e5', format: (v) => formatCompactVND(v) },
                      { key: 'passengers', label: 'Số khách', color: '#38bdf8', format: (v) => `${v}` }
                    ]}
                    avgValue={avgTourRevenue}
                    avgLabel={`TB Doanh thu (${formatCompactVND(avgTourRevenue)})`}
                    height={235}
                    onBarClick={(item) => {
                      setSelectedTourId(item.id);
                      setActiveSubTab('tour_comparison');
                    }}
                  />
                </div>

                {/* Biểu đồ Tròn Donut: Tỷ trọng Doanh thu theo Tuyến Tour */}
                <div style={cardStyle}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase' }}>
                        Biểu đồ Tròn • Cơ cấu Doanh thu
                      </span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                        Tỷ Trọng Đóng Góp Doanh Thu Theo Tuyến Tour
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveSubTab('tour_comparison')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#0284c7',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Phân tích tỷ trọng</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div style={{ padding: '14px 0' }}>
                    <ErpDonutChart
                      segments={tourMetricsList.slice(0, 5).map((t, idx) => ({
                        id: t.tour_id,
                        label: t.tour_name,
                        value: t.revenue > 0 ? t.revenue : t.total_passengers || 1,
                        displayValue: t.revenue > 0 ? formatCompactVND(t.revenue) : `${t.total_passengers} khách`,
                        color: CHART_COLORS[idx % CHART_COLORS.length]
                      }))}
                      centerLabel={formatCompactVND(bookingStats.totalRevenue)}
                      centerSubLabel={`${tourMetricsList.length} tuyến tour`}
                      onSelectSegment={(seg) => {
                        setSelectedTourId(seg.id);
                        setActiveSubTab('tour_comparison');
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* HÀNG BIỂU ĐỒ 2: SO SÁNH HƯỚNG DẪN VIÊN (BIỂU ĐỒ CỘT) & SO SÁNH TÀI XẾ (BIỂU ĐỒ CỘT) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
                {/* Biểu đồ Cột Đứng: So sánh hoạt động từng Hướng dẫn viên */}
                <div style={cardStyle}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase' }}>
                        Biểu đồ Cột Đôi • So sánh Hướng dẫn viên
                      </span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                        So Sánh Số Đoàn Dẫn & Khách Phục Vụ Từng HDV
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveSubTab('guide_comparison')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#0284c7',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Xem & So sánh HDV</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <ErpVerticalColumnChart
                    data={guideMetricsList.slice(0, 6).map((g) => ({
                      id: g.guide_id,
                      label: getShortName(g.full_name, 12),
                      fullName: g.full_name,
                      trips: g.assigned_trips,
                      passengers: g.total_passengers_served
                    }))}
                    series={[
                      { key: 'trips', label: 'Số đoàn dẫn', color: '#0284c7', format: (v) => `${v} đoàn` },
                      { key: 'passengers', label: 'Số khách', color: '#10b981', format: (v) => `${v}` }
                    ]}
                    avgValue={avgGuideTrips}
                    avgLabel={`TB Đội (${avgGuideTrips} đoàn)`}
                    height={235}
                    onBarClick={(item) => {
                      setSelectedGuideId(item.id);
                      setActiveSubTab('guide_comparison');
                    }}
                  />
                </div>

                {/* Biểu đồ Cột Đứng: So sánh hoạt động từng Tài xế */}
                <div style={cardStyle}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase' }}>
                        Biểu đồ Cột Đôi • So sánh Tài xế
                      </span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                        So Sánh Số Chuyến Xe & Ngày Lăn Bánh Từng Tài Xế
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveSubTab('driver_comparison')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#d97706',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Xem & So sánh Tài xế</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <ErpVerticalColumnChart
                    data={driverMetricsList.slice(0, 6).map((d) => ({
                      id: d.driver_id,
                      label: getShortName(d.full_name, 12),
                      fullName: d.full_name,
                      trips: d.assigned_trips,
                      days: d.total_days_driven
                    }))}
                    series={[
                      { key: 'trips', label: 'Số chuyến chạy', color: '#f59e0b', format: (v) => `${v} chuyến` },
                      { key: 'days', label: 'Số ngày chạy', color: '#6366f1', format: (v) => `${v} ngày` }
                    ]}
                    avgValue={avgDriverTrips}
                    avgLabel={`TB Đội (${avgDriverTrips} chuyến)`}
                    height={235}
                    onBarClick={(item) => {
                      setSelectedDriverId(item.id);
                      setActiveSubTab('driver_comparison');
                    }}
                  />
                </div>
              </div>

              {/* HÀNG BIỂU ĐỒ 3: XU HƯỚNG DOANH THU (AREA CHART), ĐỐI TÁC (DONUT) & NHÂN SỰ/SỰ CỐ (DONUT) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                {/* Xu hướng Doanh thu */}
                <div
                  onClick={() => setActiveSubTab('revenue')}
                  style={{ ...cardStyle, cursor: 'pointer' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', textTransform: 'uppercase' }}>
                        Biểu đồ Đường & Miền • Doanh thu
                      </span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        Diễn Biến Doanh Thu & Đặt Vé
                      </h3>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#059669', display: 'flex', alignItems: 'center' }}>
                      Báo cáo PDF <ChevronRight size={14} />
                    </span>
                  </div>
                  <ErpAreaChart data={bookingStats.timeline} formatValue={formatVND} />
                </div>

                {/* Chất lượng Đối tác */}
                <div
                  onClick={() => setActiveSubTab('partners')}
                  style={{ ...cardStyle, cursor: 'pointer' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#8b5cf6', textTransform: 'uppercase' }}>
                        Biểu đồ Tròn • Đánh giá Đối tác
                      </span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        Cơ Cấu Chất Lượng Xe, KS & Nhà Hàng
                      </h3>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#8b5cf6', display: 'flex', alignItems: 'center' }}>
                      Chi tiết <ChevronRight size={14} />
                    </span>
                  </div>

                  <ErpDonutChart
                    size={150}
                    strokeWidth={20}
                    segments={[
                      {
                        label: 'Xuất sắc (Excellent)',
                        value:
                          countRatings('vehicle_rating', 'Excellent') +
                          countRatings('hotel_rating', 'Excellent') +
                          countRatings('restaurant_rating', 'Excellent') || 3,
                        color: '#10b981'
                      },
                      {
                        label: 'Tốt (Good)',
                        value:
                          countRatings('vehicle_rating', 'Good') +
                          countRatings('hotel_rating', 'Good') +
                          countRatings('restaurant_rating', 'Good') || 2,
                        color: '#0284c7'
                      },
                      {
                        label: 'Trung bình / Kém',
                        value:
                          countRatings('vehicle_rating', 'Average') +
                          countRatings('hotel_rating', 'Average') +
                          countRatings('restaurant_rating', 'Average') +
                          countRatings('vehicle_rating', 'Poor') +
                          countRatings('hotel_rating', 'Poor') +
                          countRatings('restaurant_rating', 'Poor'),
                        color: '#f59e0b'
                      }
                    ]}
                    centerLabel={`${partnerSatisfactionPct}%`}
                    centerSubLabel="Đạt chuẩn"
                  />
                </div>

                {/* Nhân sự & Sự cố */}
                <div
                  onClick={() => setActiveSubTab('hr_stats')}
                  style={{ ...cardStyle, cursor: 'pointer' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#e11d48', textTransform: 'uppercase' }}>
                        Biểu đồ Tròn • Nhân sự & Vận hành
                      </span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        Tình Trạng Nghỉ Phép & Sự Cố Tour
                      </h3>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#e11d48', display: 'flex', alignItems: 'center' }}>
                      Xử lý <ChevronRight size={14} />
                    </span>
                  </div>

                  <ErpDonutChart
                    size={150}
                    strokeWidth={20}
                    segments={[
                      { label: 'Nghỉ phép đã duyệt', value: approvedLeaves || 1, color: '#10b981' },
                      { label: 'Đơn chờ phê duyệt', value: pendingLeaves, color: '#f59e0b' },
                      { label: 'Sự cố đã xử lý', value: resolvedIncidents, color: '#0284c7' },
                      { label: 'Sự cố đang xử lý', value: pendingIncidents, color: '#e11d48' }
                    ]}
                    centerLabel={`${leaveList.length + incidents.length}`}
                    centerSubLabel="Hồ sơ vận hành"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* MÀN HÌNH 2: SO SÁNH & PHÂN TÍCH CHI TIẾT TỪNG TUYẾN TOUR          */}
          {/* ================================================================= */}
          {activeSubTab === 'tour_comparison' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {selectedTour ? (
                /* --- HỒ SƠ CHI TIẾT 1 TUYẾN TOUR VỚI BIỂU ĐỒ ĐỐI CHIẾU --- */
                <div style={cardStyle}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid #f1f5f9',
                      marginBottom: '20px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#4f46e5', textTransform: 'uppercase' }}>
                        Báo cáo Hoạt động Tuyến Tour • Mã #{selectedTour.tour_id}
                      </span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                        {selectedTour.tour_name}
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Điểm đến: <strong>{selectedTour.destination}</strong> • Thời lượng:{' '}
                        <strong>{selectedTour.duration_days} ngày</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedTourId(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <ArrowLeft size={15} />
                      <span>Quay lại Biểu đồ So sánh các Tour</span>
                    </button>
                  </div>

                  {/* 2 Biểu đồ của riêng Tuyến Tour này: Cột So sánh với TB Hệ thống & Tròn Tỷ lệ lấp đầy */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                      gap: '20px',
                      marginBottom: '24px'
                    }}
                  >
                    <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                        Biểu Đồ So Sánh Tuyến Này Với Trung Bình Toàn Hệ Thống
                      </h4>
                      <ErpVerticalColumnChart
                        data={[
                          {
                            id: 'this_tour',
                            label: getShortName(selectedTour.tour_name, 16),
                            fullName: selectedTour.tour_name,
                            revenue: selectedTour.revenue,
                            passengers: selectedTour.total_passengers
                          },
                          {
                            id: 'avg_tour',
                            label: 'TB Toàn hệ thống',
                            fullName: 'Trung bình toàn bộ các tuyến tour',
                            revenue: avgTourRevenue,
                            passengers: avgTourPax
                          }
                        ]}
                        series={[
                          { key: 'revenue', label: 'Doanh thu', color: '#4f46e5', format: (v) => formatCompactVND(v) },
                          { key: 'passengers', label: 'Số khách', color: '#0284c7', format: (v) => `${v} khách` }
                        ]}
                        height={210}
                      />
                    </div>

                    <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                        Chỉ Số Vận Hành Của Tuyến Tour
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>DOANH THU THỰC THU</div>
                          <div style={{ fontSize: '18px', fontWeight: '800', color: '#4f46e5', marginTop: '4px' }}>
                            {formatVND(selectedTour.revenue)}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: selectedTour.revenue >= avgTourRevenue ? '#059669' : '#d97706',
                              marginTop: '4px'
                            }}
                          >
                            {selectedTour.revenue >= avgTourRevenue ? '▲ Cao hơn TB hệ thống' : '▼ Thấp hơn TB hệ thống'}
                          </div>
                        </div>

                        <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>TỔNG KHÁCH & ĐƠN</div>
                          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                            {selectedTour.total_passengers} khách
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                            Từ {selectedTour.bookings_count} đơn đặt vé
                          </div>
                        </div>

                        <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>ĐỢT KHỞI HÀNH</div>
                          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                            {selectedTour.departures_count} đoàn
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                            {selectedTour.completed_reports} biên bản hoàn tất
                          </div>
                        </div>

                        <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>ĐIỂM CHẤT LƯỢNG</div>
                          <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                            {selectedTour.quality_score}%
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                            Sự cố: {selectedTour.incidents_count} vụ
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bảng lịch sử các đoàn của Tour này */}
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    Danh Sách Các Đoàn Khởi Hành Của Tuyến Tour ({selectedTour.departures_list.length} đoàn)
                  </h4>
                  {selectedTour.departures_list.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '13px' }}>
                      Chưa có lịch phân công đoàn cho tuyến tour này.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                            <th style={{ padding: '10px 12px' }}>Mã đoàn</th>
                            <th style={{ padding: '10px 12px' }}>Ngày khởi hành</th>
                            <th style={{ padding: '10px 12px' }}>HDV phụ trách</th>
                            <th style={{ padding: '10px 12px' }}>Lấp đầy</th>
                            <th style={{ padding: '10px 12px' }}>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTour.departures_list.map((dep) => (
                            <tr key={dep.departure_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', fontWeight: '700', color: '#4f46e5' }}>#{dep.departure_id}</td>
                              <td style={{ padding: '10px 12px' }}>
                                {new Date(dep.departure_date).toLocaleDateString('vi-VN')} →{' '}
                                {new Date(dep.return_date).toLocaleDateString('vi-VN')}
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: '600' }}>{dep.assigned_guide_name || 'Chưa gán'}</td>
                              <td style={{ padding: '10px 12px', fontWeight: '600' }}>
                                {dep.actual_booked}/{dep.max_slots} khách
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    background: dep.status === 'Completed' ? '#ecfdf5' : '#f0f9ff',
                                    color: dep.status === 'Completed' ? '#059669' : '#0284c7'
                                  }}
                                >
                                  {dep.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* --- MÀN HÌNH SO SÁNH CÁC TOUR BẰNG BIỂU ĐỒ --- */
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
                    <div style={cardStyle}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#4f46e5', textTransform: 'uppercase' }}>
                        Biểu đồ Cột Đôi • So sánh Hiệu suất Tour
                      </span>
                      <h3 style={{ margin: '4px 0 14px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                        So Sánh Doanh Thu & Lượng Khách Giữa Các Tuyến Tour
                      </h3>
                      <ErpVerticalColumnChart
                        data={tourMetricsList.slice(0, 8).map((t) => ({
                          id: t.tour_id,
                          label: getShortName(t.tour_name, 12),
                          fullName: t.tour_name,
                          revenue: t.revenue,
                          passengers: t.total_passengers
                        }))}
                        series={[
                          { key: 'revenue', label: 'Doanh thu', color: '#4f46e5', format: (v) => formatCompactVND(v) },
                          { key: 'passengers', label: 'Số khách', color: '#0284c7', format: (v) => `${v}` }
                        ]}
                        avgValue={avgTourRevenue}
                        avgLabel={`TB (${formatCompactVND(avgTourRevenue)})`}
                        height={250}
                        onBarClick={(item) => setSelectedTourId(item.id)}
                      />
                    </div>

                    <div style={cardStyle}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase' }}>
                        Biểu đồ Tròn • Tỷ trọng Doanh thu & Khách
                      </span>
                      <h3 style={{ margin: '4px 0 14px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                        Cơ Cấu Tỷ Trọng Doanh Thu Giữa Các Tuyến Tour
                      </h3>
                      <ErpDonutChart
                        size={185}
                        strokeWidth={26}
                        segments={tourMetricsList.slice(0, 6).map((t, idx) => ({
                          id: t.tour_id,
                          label: t.tour_name,
                          value: t.revenue > 0 ? t.revenue : t.total_passengers || 1,
                          displayValue: formatVND(t.revenue),
                          color: CHART_COLORS[idx % CHART_COLORS.length]
                        }))}
                        centerLabel={formatCompactVND(bookingStats.totalRevenue)}
                        centerSubLabel="Tổng thực thu"
                        onSelectSegment={(seg) => setSelectedTourId(seg.id)}
                      />
                    </div>
                  </div>

                  {/* Biểu đồ Đối chiếu Trực tiếp khi tích chọn từ 2 Tour */}
                  {compareTourIds.length >= 2 && (
                    <div style={{ ...cardStyle, border: '1px solid #c7d2fe', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#4f46e5', textTransform: 'uppercase' }}>
                            Biểu đồ Đối chiếu Trực tiếp
                          </span>
                          <h4 style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                            So Sánh Trực Tiếp {compareTourIds.length} Tuyến Tour Đang Chọn
                          </h4>
                        </div>
                        <button
                          onClick={() => setCompareTourIds([])}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Bỏ chọn tất cả
                        </button>
                      </div>
                      <ErpVerticalColumnChart
                        data={compareTourIds
                          .map((id) => tourMetricsList.find((x) => x.tour_id === id))
                          .filter(Boolean)
                          .map((t) => ({
                            id: t.tour_id,
                            label: getShortName(t.tour_name, 15),
                            fullName: t.tour_name,
                            revenue: t.revenue,
                            passengers: t.total_passengers,
                            departures: t.departures_count
                          }))}
                        series={[
                          { key: 'revenue', label: 'Doanh thu', color: '#4f46e5', format: (v) => formatCompactVND(v) },
                          { key: 'passengers', label: 'Số khách', color: '#10b981', format: (v) => `${v} khách` },
                          { key: 'departures', label: 'Số đoàn', color: '#f59e0b', format: (v) => `${v} đoàn` }
                        ]}
                        height={220}
                        onBarClick={(item) => setSelectedTourId(item.id)}
                      />
                    </div>
                  )}

                  {/* Bảng danh sách Tour */}
                  <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                          Bảng Xếp Hạng & So Sánh Chi Tiết Từng Tuyến Tour
                        </h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                          Tích chọn từ 2 tour trở lên để vẽ biểu đồ đối chiếu trực tiếp, hoặc bấm vào từng tour để xem hồ sơ riêng
                        </p>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                            <th style={{ padding: '10px 12px', width: '50px' }}>So sánh</th>
                            <th style={{ padding: '10px 12px' }}>Tuyến Tour</th>
                            <th style={{ padding: '10px 12px' }}>Số đoàn</th>
                            <th style={{ padding: '10px 12px' }}>Số khách</th>
                            <th style={{ padding: '10px 12px' }}>Doanh thu thực thu</th>
                            <th style={{ padding: '10px 12px' }}>So với TB ({formatCompactVND(avgTourRevenue)})</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Chi tiết</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tourMetricsList.map((t) => {
                            const isChecked = compareTourIds.includes(t.tour_id);
                            const isAboveAvg = t.revenue >= avgTourRevenue;
                            return (
                              <tr key={t.tour_id} style={{ borderBottom: '1px solid #f1f5f9', background: isChecked ? '#eef2ff' : 'transparent' }}>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleCompareItem(compareTourIds, setCompareTourIds, t.tour_id)}
                                    style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                                  />
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{t.tour_name}</div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                                    {t.destination} • {t.duration_days} ngày
                                  </div>
                                </td>
                                <td style={{ padding: '10px 12px', fontWeight: '600' }}>{t.departures_count} đoàn</td>
                                <td style={{ padding: '10px 12px', fontWeight: '600' }}>{t.total_passengers} khách</td>
                                <td style={{ padding: '10px 12px', fontWeight: '700', color: '#4f46e5' }}>{formatVND(t.revenue)}</td>
                                <td style={{ padding: '10px 12px' }}>
                                  <span
                                    style={{
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      background: isAboveAvg ? '#ecfdf5' : '#f8fafc',
                                      color: isAboveAvg ? '#059669' : '#64748b'
                                    }}
                                  >
                                    {isAboveAvg ? '▲ Vượt TB' : '▼ Dưới TB'}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => setSelectedTourId(t.tour_id)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #e2e8f0',
                                      background: '#ffffff',
                                      color: '#4f46e5',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Phân tích tour →
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* MÀN HÌNH 3: SO SÁNH & HỒ SƠ HOẠT ĐỘNG TỪNG HƯỚNG DẪN VIÊN (HDV)    */}
          {/* ================================================================= */}
          {activeSubTab === 'guide_comparison' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {selectedGuide ? (
                /* --- HỒ SƠ CÁ NHÂN 1 HƯỚNG DẪN VIÊN VỚI BIỂU ĐỒ ĐỐI CHIẾU --- */
                <div style={cardStyle}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid #f1f5f9',
                      marginBottom: '20px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase' }}>
                        Hồ sơ Hiệu suất Cá nhân • Hướng dẫn viên #{selectedGuide.guide_id}
                      </span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                        {selectedGuide.full_name}
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        SĐT: <strong>{selectedGuide.phone || 'Chưa cập nhật'}</strong> • Email:{' '}
                        <strong>{selectedGuide.email || 'Chưa cập nhật'}</strong> • Ngôn ngữ:{' '}
                        <strong>{selectedGuide.languages}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedGuideId(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <ArrowLeft size={15} />
                      <span>Quay lại Biểu đồ So sánh Đội ngũ HDV</span>
                    </button>
                  </div>

                  {/* 2 Biểu đồ của cá nhân HDV: So sánh với TB Toàn đội & Cơ cấu đoàn dẫn */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                      gap: '20px',
                      marginBottom: '24px'
                    }}
                  >
                    <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                        Biểu Đồ So Sánh Cá Nhân Với Trung Bình Toàn Đội HDV
                      </h4>
                      <ErpVerticalColumnChart
                        data={[
                          {
                            id: 'self',
                            label: getShortName(selectedGuide.full_name, 16),
                            fullName: selectedGuide.full_name,
                            trips: selectedGuide.assigned_trips,
                            passengers: selectedGuide.total_passengers_served
                          },
                          {
                            id: 'team_avg',
                            label: 'TB Toàn đội HDV',
                            fullName: 'Mức trung bình toàn đội HDV',
                            trips: avgGuideTrips,
                            passengers: avgGuidePax
                          }
                        ]}
                        series={[
                          { key: 'trips', label: 'Số đoàn dẫn', color: '#0284c7', format: (v) => `${v} đoàn` },
                          { key: 'passengers', label: 'Số khách phục vụ', color: '#10b981', format: (v) => `${v} khách` }
                        ]}
                        height={205}
                      />
                    </div>

                    <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                        Cơ Cấu Trạng Thái Đoàn Dẫn & Hiệu Suất Cá Nhân
                      </h4>
                      <ErpDonutChart
                        size={155}
                        strokeWidth={22}
                        segments={[
                          {
                            label: 'Đoàn đã hoàn thành',
                            value: selectedGuide.completed_trips,
                            displayValue: `${selectedGuide.completed_trips} đoàn`,
                            color: '#10b981'
                          },
                          {
                            label: 'Đoàn đang/sắp dẫn',
                            value: selectedGuide.active_trips,
                            displayValue: `${selectedGuide.active_trips} đoàn`,
                            color: '#0284c7'
                          },
                          {
                            label: 'Báo cáo đã nộp',
                            value: selectedGuide.reports_submitted,
                            displayValue: `${selectedGuide.reports_submitted} bản`,
                            color: '#4f46e5'
                          }
                        ]}
                        centerLabel={`${selectedGuide.assigned_trips}`}
                        centerSubLabel="Tổng đoàn"
                      />
                    </div>
                  </div>

                  {/* Bảng lịch sử dẫn đoàn của riêng HDV này */}
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    Lịch Sử Các Đoàn Đã Phân Công Cho {selectedGuide.full_name} ({selectedGuide.trips_list.length} đoàn)
                  </h4>
                  {selectedGuide.trips_list.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '13px' }}>
                      Hướng dẫn viên này chưa được gán lịch dẫn đoàn nào.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                            <th style={{ padding: '10px 12px' }}>Mã đoàn</th>
                            <th style={{ padding: '10px 12px' }}>Tuyến Tour</th>
                            <th style={{ padding: '10px 12px' }}>Ngày đi - Ngày về</th>
                            <th style={{ padding: '10px 12px' }}>Số khách</th>
                            <th style={{ padding: '10px 12px' }}>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedGuide.trips_list.map((tr) => (
                            <tr key={tr.departure_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0284c7' }}>#{tr.departure_id}</td>
                              <td style={{ padding: '10px 12px', fontWeight: '600' }}>{tr.tour_name}</td>
                              <td style={{ padding: '10px 12px' }}>
                                {new Date(tr.departure_date).toLocaleDateString('vi-VN')} →{' '}
                                {new Date(tr.return_date).toLocaleDateString('vi-VN')} ({tr.duration_days} ngày)
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: '600' }}>
                                {tr.actual_booked}/{tr.max_slots} khách
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    background: tr.status === 'Completed' ? '#ecfdf5' : '#f0f9ff',
                                    color: tr.status === 'Completed' ? '#059669' : '#0284c7'
                                  }}
                                >
                                  {tr.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* --- MÀN HÌNH SO SÁNH ĐỘI NGŨ HDV BẰNG BIỂU ĐỒ --- */
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
                    {/* Biểu đồ Cột Đôi: So sánh Số đoàn & Số khách giữa các HDV */}
                    <div style={cardStyle}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase' }}>
                        Biểu đồ Cột Đôi • So sánh Năng suất HDV
                      </span>
                      <h3 style={{ margin: '4px 0 14px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                        So Sánh Số Đoàn Dẫn & Số Khách Phục Vụ Từng Hướng Dẫn Viên
                      </h3>
                      <ErpVerticalColumnChart
                        data={guideMetricsList.map((g) => ({
                          id: g.guide_id,
                          label: getShortName(g.full_name, 12),
                          fullName: g.full_name,
                          trips: g.assigned_trips,
                          passengers: g.total_passengers_served
                        }))}
                        series={[
                          { key: 'trips', label: 'Số đoàn dẫn', color: '#0284c7', format: (v) => `${v} đoàn` },
                          { key: 'passengers', label: 'Số khách', color: '#10b981', format: (v) => `${v}` }
                        ]}
                        avgValue={avgGuideTrips}
                        avgLabel={`TB (${avgGuideTrips} đoàn)`}
                        height={250}
                        onBarClick={(item) => setSelectedGuideId(item.id)}
                      />
                    </div>

                    {/* Biểu đồ Tròn Donut: Tỷ trọng phân bổ đoàn dẫn giữa các HDV */}
                    <div style={cardStyle}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#4f46e5', textTransform: 'uppercase' }}>
                        Biểu đồ Tròn • Tỷ trọng Phân công Đoàn
                      </span>
                      <h3 style={{ margin: '4px 0 14px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                        Tỷ Trọng Đóng Góp Số Đoàn Dẫn Trong Toàn Đội HDV
                      </h3>
                      <ErpDonutChart
                        size={185}
                        strokeWidth={26}
                        segments={guideMetricsList.map((g, idx) => ({
                          id: g.guide_id,
                          label: g.full_name,
                          value: g.assigned_trips > 0 ? g.assigned_trips : 0.2,
                          displayValue: `${g.assigned_trips} đoàn (${g.total_passengers_served} khách)`,
                          color: CHART_COLORS[idx % CHART_COLORS.length]
                        }))}
                        centerLabel={`${guideWorks.length}`}
                        centerSubLabel="Tổng đoàn dẫn"
                        onSelectSegment={(seg) => setSelectedGuideId(seg.id)}
                      />
                    </div>
                  </div>

                  {/* Biểu đồ Đối chiếu Trực tiếp khi tích chọn từ 2 HDV */}
                  {compareGuideIds.length >= 2 && (
                    <div style={{ ...cardStyle, border: '1px solid #bae6fd', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase' }}>
                            Biểu đồ Đối chiếu Trực tiếp
                          </span>
                          <h4 style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                            So Sánh Trực Tiếp {compareGuideIds.length} Hướng Dẫn Viên Đang Chọn
                          </h4>
                        </div>
                        <button
                          onClick={() => setCompareGuideIds([])}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Bỏ chọn tất cả
                        </button>
                      </div>
                      <ErpVerticalColumnChart
                        data={compareGuideIds
                          .map((id) => guideMetricsList.find((x) => x.guide_id === id))
                          .filter(Boolean)
                          .map((g) => ({
                            id: g.guide_id,
                            label: getShortName(g.full_name, 14),
                            fullName: g.full_name,
                            trips: g.assigned_trips,
                            passengers: g.total_passengers_served,
                            days: g.total_days_worked
                          }))}
                        series={[
                          { key: 'trips', label: 'Số đoàn dẫn', color: '#0284c7', format: (v) => `${v} đoàn` },
                          { key: 'passengers', label: 'Số khách', color: '#10b981', format: (v) => `${v} khách` },
                          { key: 'days', label: 'Ngày công tác', color: '#6366f1', format: (v) => `${v} ngày` }
                        ]}
                        height={220}
                        onBarClick={(item) => setSelectedGuideId(item.id)}
                      />
                    </div>
                  )}

                  {/* Bảng Xếp hạng & Chọn So sánh HDV */}
                  <div style={cardStyle}>
                    <div style={{ marginBottom: '14px' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        Bảng Tổng Hợp & So Sánh Từng Hướng Dẫn Viên
                      </h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                        Tích chọn từ 2 HDV để vẽ biểu đồ đối chiếu trực tiếp, hoặc bấm vào từng người để xem biểu đồ cá nhân
                      </p>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                            <th style={{ padding: '10px 12px', width: '50px' }}>So sánh</th>
                            <th style={{ padding: '10px 12px' }}>Hướng dẫn viên</th>
                            <th style={{ padding: '10px 12px' }}>Tổng đoàn dẫn</th>
                            <th style={{ padding: '10px 12px' }}>Khách phục vụ</th>
                            <th style={{ padding: '10px 12px' }}>Ngày công tác</th>
                            <th style={{ padding: '10px 12px' }}>So với TB ({avgGuideTrips} đoàn)</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Hồ sơ cá nhân</th>
                          </tr>
                        </thead>
                        <tbody>
                          {guideMetricsList.map((g) => {
                            const isChecked = compareGuideIds.includes(g.guide_id);
                            const isAboveAvg = g.assigned_trips >= avgGuideTrips;
                            return (
                              <tr key={g.guide_id} style={{ borderBottom: '1px solid #f1f5f9', background: isChecked ? '#f0f9ff' : 'transparent' }}>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleCompareItem(compareGuideIds, setCompareGuideIds, g.guide_id)}
                                    style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                                  />
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{g.full_name}</div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>{g.phone || g.email || `Mã #${g.guide_id}`}</div>
                                </td>
                                <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0284c7' }}>
                                  {g.assigned_trips} đoàn ({g.completed_trips} xong)
                                </td>
                                <td style={{ padding: '10px 12px', fontWeight: '600' }}>{g.total_passengers_served} khách</td>
                                <td style={{ padding: '10px 12px', fontWeight: '600' }}>{g.total_days_worked} ngày</td>
                                <td style={{ padding: '10px 12px' }}>
                                  <span
                                    style={{
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      background: isAboveAvg ? '#ecfdf5' : '#f8fafc',
                                      color: isAboveAvg ? '#059669' : '#64748b'
                                    }}
                                  >
                                    {isAboveAvg ? '▲ Vượt TB đội' : '▼ Dưới TB đội'}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => setSelectedGuideId(g.guide_id)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #e2e8f0',
                                      background: '#ffffff',
                                      color: '#0284c7',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Xem cá nhân →
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* MÀN HÌNH 4: SO SÁNH & HỒ SƠ HOẠT ĐỘNG TỪNG TÀI XẾ                 */}
          {/* ================================================================= */}
          {activeSubTab === 'driver_comparison' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {selectedDriver ? (
                /* --- HỒ SƠ CÁ NHÂN 1 TÀI XẾ VỚI BIỂU ĐỒ ĐỐI CHIẾU --- */
                <div style={cardStyle}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid #f1f5f9',
                      marginBottom: '20px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase' }}>
                        Hồ sơ Vận hành Cá nhân • Tài xế #{selectedDriver.driver_id}
                      </span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                        {selectedDriver.full_name}
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        SĐT: <strong>{selectedDriver.phone || 'Chưa cập nhật'}</strong> • Xe phụ trách:{' '}
                        <strong>
                          {selectedDriver.vehicles_list.length > 0 ? selectedDriver.vehicles_list.join(', ') : 'Chưa gán xe'}
                        </strong>
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedDriverId(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <ArrowLeft size={15} />
                      <span>Quay lại Biểu đồ So sánh Đội ngũ Tài xế</span>
                    </button>
                  </div>

                  {/* 2 Biểu đồ của cá nhân Tài xế */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                      gap: '20px',
                      marginBottom: '24px'
                    }}
                  >
                    <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                        Biểu Đồ So Sánh Cá Nhân Với Trung Bình Toàn Đội Tài Xế
                      </h4>
                      <ErpVerticalColumnChart
                        data={[
                          {
                            id: 'self',
                            label: getShortName(selectedDriver.full_name, 16),
                            fullName: selectedDriver.full_name,
                            trips: selectedDriver.assigned_trips,
                            days: selectedDriver.total_days_driven
                          },
                          {
                            id: 'team_avg',
                            label: 'TB Toàn đội Tài xế',
                            fullName: 'Mức trung bình toàn đội Tài xế',
                            trips: avgDriverTrips,
                            days: avgDriverDays
                          }
                        ]}
                        series={[
                          { key: 'trips', label: 'Số chuyến xe', color: '#f59e0b', format: (v) => `${v} chuyến` },
                          { key: 'days', label: 'Số ngày chạy', color: '#6366f1', format: (v) => `${v} ngày` }
                        ]}
                        height={205}
                      />
                    </div>

                    <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                        Cơ Cấu Chuyến Xe Đã Chạy Của {selectedDriver.full_name}
                      </h4>
                      <ErpDonutChart
                        size={155}
                        strokeWidth={22}
                        segments={[
                          {
                            label: 'Chuyến đã hoàn thành',
                            value: selectedDriver.completed_trips,
                            displayValue: `${selectedDriver.completed_trips} chuyến`,
                            color: '#10b981'
                          },
                          {
                            label: 'Chuyến đang/sắp chạy',
                            value: selectedDriver.active_trips,
                            displayValue: `${selectedDriver.active_trips} chuyến`,
                            color: '#f59e0b'
                          }
                        ]}
                        centerLabel={`${selectedDriver.assigned_trips}`}
                        centerSubLabel="Tổng chuyến"
                      />
                    </div>
                  </div>

                  {/* Bảng lịch sử chuyến xe của Tài xế */}
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    Lịch Sử Chuyến Xe Của {selectedDriver.full_name} ({selectedDriver.trips_list.length} chuyến)
                  </h4>
                  {selectedDriver.trips_list.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '13px' }}>
                      Tài xế này chưa được phân công chuyến xe nào.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                            <th style={{ padding: '10px 12px' }}>Mã đoàn</th>
                            <th style={{ padding: '10px 12px' }}>Tuyến Tour</th>
                            <th style={{ padding: '10px 12px' }}>Lịch trình</th>
                            <th style={{ padding: '10px 12px' }}>Biển số xe</th>
                            <th style={{ padding: '10px 12px' }}>HDV đi cùng</th>
                            <th style={{ padding: '10px 12px' }}>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDriver.trips_list.map((tr) => (
                            <tr key={tr.departure_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', fontWeight: '700', color: '#d97706' }}>#{tr.departure_id}</td>
                              <td style={{ padding: '10px 12px', fontWeight: '600' }}>{tr.tour_name}</td>
                              <td style={{ padding: '10px 12px' }}>
                                {new Date(tr.departure_date).toLocaleDateString('vi-VN')} →{' '}
                                {new Date(tr.return_date).toLocaleDateString('vi-VN')}
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0284c7' }}>
                                {tr.vehicle_number || 'Chưa gán'}
                              </td>
                              <td style={{ padding: '10px 12px' }}>{tr.guide_name || 'Chưa gán'}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    background: tr.status === 'Completed' ? '#ecfdf5' : '#fffbeb',
                                    color: tr.status === 'Completed' ? '#059669' : '#d97706'
                                  }}
                                >
                                  {tr.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* --- MÀN HÌNH SO SÁNH ĐỘI NGŨ TÀI XẾ BẰNG BIỂU ĐỒ --- */
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
                    <div style={cardStyle}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase' }}>
                        Biểu đồ Cột Đôi • So sánh Tần suất Tài xế
                      </span>
                      <h3 style={{ margin: '4px 0 14px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                        So Sánh Số Chuyến Xe & Số Ngày Lăn Bánh Giữa Các Tài Xế
                      </h3>
                      <ErpVerticalColumnChart
                        data={driverMetricsList.map((d) => ({
                          id: d.driver_id,
                          label: getShortName(d.full_name, 12),
                          fullName: d.full_name,
                          trips: d.assigned_trips,
                          days: d.total_days_driven
                        }))}
                        series={[
                          { key: 'trips', label: 'Số chuyến chạy', color: '#f59e0b', format: (v) => `${v} chuyến` },
                          { key: 'days', label: 'Số ngày chạy', color: '#6366f1', format: (v) => `${v} ngày` }
                        ]}
                        avgValue={avgDriverTrips}
                        avgLabel={`TB (${avgDriverTrips} chuyến)`}
                        height={250}
                        onBarClick={(item) => setSelectedDriverId(item.id)}
                      />
                    </div>

                    <div style={cardStyle}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase' }}>
                        Biểu đồ Tròn • Tỷ trọng Phân công Đội xe
                      </span>
                      <h3 style={{ margin: '4px 0 14px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                        Tỷ Trọng Đóng Góp Số Chuyến Lăn Bánh Trong Toàn Đội Xe
                      </h3>
                      <ErpDonutChart
                        size={185}
                        strokeWidth={26}
                        segments={driverMetricsList.map((d, idx) => ({
                          id: d.driver_id,
                          label: d.full_name,
                          value: d.assigned_trips > 0 ? d.assigned_trips : 0.2,
                          displayValue: `${d.assigned_trips} chuyến (${d.total_days_driven} ngày)`,
                          color: CHART_COLORS[idx % CHART_COLORS.length]
                        }))}
                        centerLabel={`${driverTrips.length}`}
                        centerSubLabel="Tổng chuyến xe"
                        onSelectSegment={(seg) => setSelectedDriverId(seg.id)}
                      />
                    </div>
                  </div>

                  {/* Biểu đồ Đối chiếu Trực tiếp khi tích chọn từ 2 Tài xế */}
                  {compareDriverIds.length >= 2 && (
                    <div style={{ ...cardStyle, border: '1px solid #fde68a', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase' }}>
                            Biểu đồ Đối chiếu Trực tiếp
                          </span>
                          <h4 style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                            So Sánh Trực Tiếp {compareDriverIds.length} Tài Xế Đang Chọn
                          </h4>
                        </div>
                        <button
                          onClick={() => setCompareDriverIds([])}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Bỏ chọn tất cả
                        </button>
                      </div>
                      <ErpVerticalColumnChart
                        data={compareDriverIds
                          .map((id) => driverMetricsList.find((x) => x.driver_id === id))
                          .filter(Boolean)
                          .map((d) => ({
                            id: d.driver_id,
                            label: getShortName(d.full_name, 14),
                            fullName: d.full_name,
                            trips: d.assigned_trips,
                            days: d.total_days_driven,
                            capacity: d.total_capacity_served
                          }))}
                        series={[
                          { key: 'trips', label: 'Số chuyến', color: '#f59e0b', format: (v) => `${v} chuyến` },
                          { key: 'days', label: 'Ngày chạy', color: '#6366f1', format: (v) => `${v} ngày` },
                          { key: 'capacity', label: 'Khách vận chuyển', color: '#10b981', format: (v) => `${v} khách` }
                        ]}
                        height={220}
                        onBarClick={(item) => setSelectedDriverId(item.id)}
                      />
                    </div>
                  )}

                  {/* Bảng Xếp hạng & Chọn So sánh Tài xế */}
                  <div style={cardStyle}>
                    <div style={{ marginBottom: '14px' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        Bảng Tổng Hợp & So Sánh Từng Tài Xế Đội Xe
                      </h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                        Tích chọn từ 2 Tài xế để vẽ biểu đồ đối chiếu trực tiếp, hoặc bấm vào từng người để xem biểu đồ cá nhân
                      </p>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                            <th style={{ padding: '10px 12px', width: '50px' }}>So sánh</th>
                            <th style={{ padding: '10px 12px' }}>Tài xế</th>
                            <th style={{ padding: '10px 12px' }}>Số chuyến chạy</th>
                            <th style={{ padding: '10px 12px' }}>Số ngày lăn bánh</th>
                            <th style={{ padding: '10px 12px' }}>Biển số xe phụ trách</th>
                            <th style={{ padding: '10px 12px' }}>So với TB ({avgDriverTrips} chuyến)</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Hồ sơ cá nhân</th>
                          </tr>
                        </thead>
                        <tbody>
                          {driverMetricsList.map((d) => {
                            const isChecked = compareDriverIds.includes(d.driver_id);
                            const isAboveAvg = d.assigned_trips >= avgDriverTrips;
                            return (
                              <tr key={d.driver_id} style={{ borderBottom: '1px solid #f1f5f9', background: isChecked ? '#fffbeb' : 'transparent' }}>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleCompareItem(compareDriverIds, setCompareDriverIds, d.driver_id)}
                                    style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                                  />
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{d.full_name}</div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>{d.phone || d.email || `Mã #${d.driver_id}`}</div>
                                </td>
                                <td style={{ padding: '10px 12px', fontWeight: '700', color: '#d97706' }}>
                                  {d.assigned_trips} chuyến ({d.completed_trips} xong)
                                </td>
                                <td style={{ padding: '10px 12px', fontWeight: '600' }}>{d.total_days_driven} ngày</td>
                                <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0284c7' }}>
                                  {d.vehicles_list.length > 0 ? d.vehicles_list.join(', ') : 'Chưa gán'}
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                  <span
                                    style={{
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      background: isAboveAvg ? '#ecfdf5' : '#f8fafc',
                                      color: isAboveAvg ? '#059669' : '#64748b'
                                    }}
                                  >
                                    {isAboveAvg ? '▲ Vượt TB đội' : '▼ Dưới TB đội'}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => setSelectedDriverId(d.driver_id)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #e2e8f0',
                                      background: '#ffffff',
                                      color: '#d97706',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Xem cá nhân →
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* MÀN HÌNH 5: BÁO CÁO DOANH THU & BÁN VÉ LỮ HÀNH (XUẤT PDF)         */}
          {/* ================================================================= */}
          {activeSubTab === 'revenue' && (
            <OfficeStaffDashboard
              onNavigateToOrders={onNavigateToOrders}
              onNavigateToChangeRequests={onNavigateToChangeRequests}
            />
          )}

          {/* ================================================================= */}
          {/* MÀN HÌNH 6: CHẤT LƯỢNG ĐỐI TÁC BẰNG BIỂU ĐỒ                       */}
          {/* ================================================================= */}
          {activeSubTab === 'partners' && (
            <div style={cardStyle}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#8b5cf6', textTransform: 'uppercase' }}>
                Đánh giá Chất lượng Đối tác dịch vụ
              </span>
              <h3 style={{ margin: '4px 0 20px 0', fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                So Sánh Chất Lượng Nhà Xe, Khách Sạn & Nhà Hàng Qua Báo Cáo Đoàn
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {[
                  { title: 'Đối tác Xe Vận Chuyển', field: 'vehicle_rating' },
                  { title: 'Đối tác Khách Sạn Lưu Trú', field: 'hotel_rating' },
                  { title: 'Đối tác Nhà Hàng Ẩm Thực', field: 'restaurant_rating' }
                ].map((box, i) => (
                  <div key={i} style={{ padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                      {box.title}
                    </h4>
                    <ErpDonutChart
                      size={145}
                      strokeWidth={20}
                      segments={[
                        { label: 'Xuất sắc', value: countRatings(box.field, 'Excellent') || 1, color: '#10b981' },
                        { label: 'Tốt', value: countRatings(box.field, 'Good'), color: '#0284c7' },
                        { label: 'Trung bình', value: countRatings(box.field, 'Average'), color: '#f59e0b' },
                        { label: 'Kém', value: countRatings(box.field, 'Poor'), color: '#e11d48' }
                      ]}
                      centerLabel={`${totalReports}`}
                      centerSubLabel="Đánh giá"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* MÀN HÌNH 7: NHÂN SỰ NGHỈ PHÉP & NHẬT KÝ SỰ CỐ                     */}
          {/* ================================================================= */}
          {activeSubTab === 'hr_stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                  Quản Lý Đơn Xin Nghỉ Phép Nhân Sự ({leaveList.length} đơn)
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '10px 12px' }}>Nhân sự</th>
                        <th style={{ padding: '10px 12px' }}>Thời gian nghỉ</th>
                        <th style={{ padding: '10px 12px' }}>Lý do</th>
                        <th style={{ padding: '10px 12px' }}>Trạng thái</th>
                        <th style={{ padding: '10px 12px' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveList.map((item) => (
                        <tr key={item.request_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', fontWeight: '600' }}>{item.full_name}</td>
                          <td style={{ padding: '10px 12px' }}>
                            {new Date(item.start_date).toLocaleDateString('vi-VN')} →{' '}
                            {new Date(item.end_date).toLocaleDateString('vi-VN')}
                          </td>
                          <td style={{ padding: '10px 12px' }}>{item.reason}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                background:
                                  item.status === 'Approved'
                                    ? '#ecfdf5'
                                    : item.status === 'Rejected'
                                    ? '#fef2f2'
                                    : '#fffbeb',
                                color:
                                  item.status === 'Approved'
                                    ? '#059669'
                                    : item.status === 'Rejected'
                                    ? '#e11d48'
                                    : '#d97706'
                              }}
                            >
                              {item.status === 'Approved'
                                ? 'Đã duyệt'
                                : item.status === 'Rejected'
                                ? 'Từ chối'
                                : 'Chờ duyệt'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {item.status === 'Pending' ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => handleLeaveAction(item.request_id, 'Approved')}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: '#10b981',
                                    color: '#fff',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Duyệt
                                </button>
                                <button
                                  onClick={() => handleLeaveAction(item.request_id, 'Rejected')}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: '#e11d48',
                                    color: '#fff',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Từ chối
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Đã xử lý</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                  Nhật Ký Sự Cố Phát Sinh Trên Tour ({incidents.length} sự cố)
                </h3>
                {incidents.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    Toàn bộ các đoàn đang vận hành an toàn, không có sự cố phát sinh.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                          <th style={{ padding: '10px 12px' }}>Mã</th>
                          <th style={{ padding: '10px 12px' }}>Tuyến Tour</th>
                          <th style={{ padding: '10px 12px' }}>Nội dung sự cố</th>
                          <th style={{ padding: '10px 12px' }}>Mức độ</th>
                          <th style={{ padding: '10px 12px' }}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidents.map((inc) => (
                          <tr key={inc.incident_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 12px', fontWeight: '700' }}>#{inc.incident_id}</td>
                            <td style={{ padding: '10px 12px', fontWeight: '600' }}>{inc.tour_name}</td>
                            <td style={{ padding: '10px 12px' }}>{inc.description}</td>
                            <td style={{ padding: '10px 12px', fontWeight: '600' }}>{inc.severity}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  background: inc.status === 'Resolved' ? '#ecfdf5' : '#fffbeb',
                                  color: inc.status === 'Resolved' ? '#059669' : '#d97706'
                                }}
                              >
                                {inc.status === 'Resolved' ? 'Đã xử lý' : 'Đang xử lý'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GeneralOverview;
