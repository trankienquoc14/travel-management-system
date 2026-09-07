-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th9 07, 2026 lúc 03:03 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `travel_management`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `bookings`
--

CREATE TABLE `bookings` (
  `booking_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `departure_id` int(11) DEFAULT NULL,
  `quote_id` int(11) DEFAULT NULL,
  `num_people` int(11) NOT NULL DEFAULT 1,
  `booking_date` datetime DEFAULT current_timestamp(),
  `total_amount` decimal(15,2) DEFAULT NULL,
  `booking_status` enum('Pending','Confirmed','Cancelled','Completed') DEFAULT 'Pending',
  `payment_status` enum('Unpaid','Paid','Refunded') DEFAULT 'Unpaid',
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `booking_change_requests`
--

CREATE TABLE `booking_change_requests` (
  `change_id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `request_type` enum('Cancel','Reschedule') DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `processed_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `new_departure_id` int(11) DEFAULT NULL,
  `staff_note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `booking_passengers`
--

CREATE TABLE `booking_passengers` (
  `passenger_id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `identity_number` varchar(50) DEFAULT NULL,
  `is_checked_in` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `consultation_requests`
--

CREATE TABLE `consultation_requests` (
  `consultation_id` int(11) NOT NULL,
  `customer_name` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `handled_by` int(11) DEFAULT NULL,
  `status` enum('Pending','Handled') DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `consultation_requests`
--

INSERT INTO `consultation_requests` (`consultation_id`, `customer_name`, `phone`, `email`, `content`, `handled_by`, `status`) VALUES
(1, 'Khách mới', '0999', 'new@example.com', 'Tư vấn tour', 4, 'Handled');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `customer_behavior_logs`
--

CREATE TABLE `customer_behavior_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `session_id` varchar(100) NOT NULL,
  `event_type` enum('SEARCH','VIEW_TOUR','CLICK_TOUR','ADD_FAVORITE','BOOKING_INIT','BOOKING_COMPLETED','BOOKING_CANCEL','RATING') NOT NULL,
  `tour_id` int(11) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `customer_behavior_logs`
--

INSERT INTO `customer_behavior_logs` (`log_id`, `user_id`, `session_id`, `event_type`, `tour_id`, `metadata`, `created_at`) VALUES
(1, NULL, 'session_1788569309974_zydxhv5', 'CLICK_TOUR', 48, '{\"tour_name\":\"Tour Tây Nguyên 3N3Đ: Măng Đen - Pleiku - Buôn Ma Thuột\"}', '2026-09-05 09:10:15'),
(2, NULL, 'session_1788747080901_san3mj5', 'CLICK_TOUR', 33, '{\"tour_name\":\"Tour Đà Nẵng - Huế - Bà Nà - Động Phong Nha 5N4Đ\"}', '2026-09-07 02:11:20'),
(3, NULL, 'session_1788747080901_san3mj5', 'CLICK_TOUR', 49, '{\"tour_name\":\"Tour Miền Tây 3N2Đ: Mỹ Tho - Bến Tre - Cần Thơ - Bạc Liêu - Cà Mau\"}', '2026-09-07 02:11:31'),
(4, NULL, 'session_1788747080901_san3mj5', 'CLICK_TOUR', 52, '{\"tour_name\":\"Tour Xuyên Việt 8N7Đ: Phú Yên - Quy Nhơn - Đà Nẵng - Huế - Quảng Bình\"}', '2026-09-07 02:36:37'),
(5, NULL, 'session_1788747080901_san3mj5', 'CLICK_TOUR', 34, '{\"tour_name\":\"Tour Phú Quốc 3N2Đ: Grand World - VinWonders - Cáp Treo Hòn Thơm\"}', '2026-09-07 02:37:21'),
(6, NULL, 'session_1788747080901_san3mj5', 'CLICK_TOUR', 31, '{\"tour_name\":\"Khám phá Đảo Ngọc Phú Quốc 3N2Đ (Cao cấp)\"}', '2026-09-07 02:37:28'),
(7, NULL, 'session_1788747080901_san3mj5', 'CLICK_TOUR', 38, '{\"tour_name\":\"Tour Hà Nội - Sapa - Chinh Phục Đỉnh Fansipan 3N2Đ\"}', '2026-09-07 02:37:35'),
(8, NULL, 'session_1788747080901_san3mj5', 'CLICK_TOUR', 29, '{\"tour_name\":\"Khám phá Đà Lạt - Nha Trang\"}', '2026-09-07 02:55:44'),
(9, NULL, 'session_1788747080901_san3mj5', 'CLICK_TOUR', 31, '{\"tour_name\":\"Khám phá Đảo Ngọc Phú Quốc 3N2Đ (Cao cấp)\"}', '2026-09-07 02:55:53'),
(10, NULL, 'session_1788747080901_san3mj5', 'CLICK_TOUR', 36, '{\"tour_name\":\"Tour Hạ Long - Tràng An - Sapa - Fansipan 4N3Đ\"}', '2026-09-07 02:56:04'),
(11, NULL, 'session_1788747080901_san3mj5', 'CLICK_TOUR', 50, '{\"tour_name\":\"Tour Đồng Tháp - Làng Hoa Sa Đéc - Cần Thơ 2N1Đ\"}', '2026-09-07 02:56:15'),
(12, NULL, 'session_1788747080901_san3mj5', 'CLICK_TOUR', 31, '{\"tour_name\":\"Khám phá Đảo Ngọc Phú Quốc 3N2Đ (Cao cấp)\"}', '2026-09-07 03:02:13'),
(13, NULL, 'session_1788747080901_san3mj5', 'CLICK_TOUR', 52, '{\"tour_name\":\"Tour Xuyên Việt 8N7Đ: Phú Yên - Quy Nhơn - Đà Nẵng - Huế - Quảng Bình\"}', '2026-09-07 03:02:42'),
(14, NULL, 'session_1788747080901_san3mj5', 'CLICK_TOUR', 31, '{\"tour_name\":\"Khám phá Đảo Ngọc Phú Quốc 3N2Đ (Cao cấp)\"}', '2026-09-07 03:03:51'),
(15, NULL, 'session_1788751557633_8p88p3k', 'CLICK_TOUR', 52, '{\"tour_name\":\"Tour Xuyên Việt 8N7Đ: Phú Yên - Quy Nhơn - Đà Nẵng - Huế - Quảng Bình\"}', '2026-09-07 03:25:57');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `customer_travel_preferences`
--

CREATE TABLE `customer_travel_preferences` (
  `preference_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `session_id` varchar(100) NOT NULL,
  `destinations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`destinations`)),
  `trip_purposes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`trip_purposes`)),
  `companions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`companions`)),
  `budget_range` varchar(50) DEFAULT NULL,
  `interests` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`interests`)),
  `pace_preference` varchar(50) DEFAULT NULL,
  `accommodation_level` varchar(50) DEFAULT NULL,
  `transport_type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`transport_type`)),
  `key_priorities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`key_priorities`)),
  `raw_preference_score` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `custom_tour_quotes`
--

CREATE TABLE `custom_tour_quotes` (
  `quote_id` int(11) NOT NULL,
  `request_id` int(11) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `base_cost` decimal(15,2) DEFAULT 0.00,
  `markup_percent` int(11) DEFAULT 20,
  `quote_price` decimal(15,2) DEFAULT NULL,
  `itinerary` longtext DEFAULT NULL,
  `staff_note` text DEFAULT NULL,
  `manager_note` text DEFAULT NULL,
  `approval_status` varchar(50) DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `customer_note` text DEFAULT NULL,
  `price_breakdown` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`price_breakdown`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `custom_tour_quotes`
--

INSERT INTO `custom_tour_quotes` (`quote_id`, `request_id`, `staff_id`, `manager_id`, `base_cost`, `markup_percent`, `quote_price`, `itinerary`, `staff_note`, `manager_note`, `approval_status`, `created_at`, `customer_note`, `price_breakdown`) VALUES
(1, 1, 4, NULL, 0.00, 20, 18408000.00, NULL, 'Công ty xin gửi anh chị báo giá sơ bộ để anh chị tham khảo ạ', NULL, 'Customer_Revision', '2026-08-28 13:05:19', 'Mức giá mong muốn của tôi là 18 triệu', '{\"adult\":5664000,\"child\":4248000,\"toddler\":2832000,\"infant\":0}'),
(2, 1, 4, NULL, 0.00, 20, 18000000.00, NULL, 'Công ty xin gửi lại cho anh chị báo giá sơ bộ ', NULL, 'Initial_Accepted', '2026-08-28 15:10:35', '', '{\"adult\":5538462,\"child\":4153847,\"toddler\":2769231,\"infant\":0}'),
(3, 1, 4, NULL, 5170000.00, 20, 6204000.00, '{\"tourName\":\"Khám phá Đà Lạt mộng mơ\",\"tourDescription\":\"Bạn sẽ được trải nghiệm các dịch vụ chu đáo và tân hưởng trọn vẹn các cảnh đẹp từ thiên nhiên\",\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"18\",\"end_destination_id\":\"2\",\"route_title\":\"Hồ Chí Minh - Đà Lạt\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Di chuyển từ Hồ Chí Minh đến Đà Lạt\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Đến khách sạn nhận phòng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đỉnh Langbiang\",\"price\":\"120000.00\",\"place_id\":8},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Datanla\",\"price\":\"170000.00\",\"place_id\":9},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thung Lũng Tình Yêu\",\"price\":\"250000.00\",\"place_id\":73},{\"type\":\"Tham quan\",\"name\":\"Tham quan Lẩu bò Ba Toa Quán Gỗ\",\"price\":\"200000.00\",\"place_id\":11},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đường Hầm Điêu Khắc\",\"price\":\"120000.00\",\"place_id\":74},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đồi Chè Cầu Đất\",\"price\":\"0.00\",\"place_id\":71}],\"accommodation\":{\"service_id\":8,\"name\":\"Phòng Superior (hoặc tương đương)\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":\"\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"2\",\"end_destination_id\":\"2\",\"route_title\":\"Đà Lạt - Thành phố ngàn hoa\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành tham quan tại Đà Lạt\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Vườn thú Zoodoo\",\"price\":\"100000.00\",\"place_id\":10},{\"type\":\"Tham quan\",\"name\":\"Tham quan Samten Hills Dalat\",\"price\":\"250000.00\",\"place_id\":14},{\"type\":\"Tham quan\",\"name\":\"Tham quan Quảng trường Lâm Viên\",\"price\":\"0.00\",\"place_id\":72},{\"type\":\"Tham quan\",\"name\":\"Tham quan Hồ Tuyền Lâm\",\"price\":\"0.00\",\"place_id\":70},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thiền Viện Trúc Lâm\",\"price\":\"0.00\",\"place_id\":69},{\"type\":\"Tham quan\",\"name\":\"Tham quan Bánh tráng nướng Dì Đinh\",\"price\":\"30000.00\",\"place_id\":77},{\"type\":\"Tham quan\",\"name\":\"Tham quan Puppy Farm\",\"price\":\"100000.00\",\"place_id\":75},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ Đêm Âm Phủ\",\"price\":\"50000.00\",\"place_id\":13}],\"accommodation\":{\"service_id\":8,\"name\":\"Phòng Superior (hoặc tương đương)\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"2\",\"end_destination_id\":\"18\",\"route_title\":\"Đà Lạt - Hồ Chí Minh\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Pongour\",\"price\":\"20000.00\",\"place_id\":76},{\"type\":\"Tham quan\",\"name\":\"Tham quan Cafe Túi Mơ To\",\"price\":\"60000.00\",\"place_id\":78},{\"type\":\"Tham quan\",\"name\":\"Tham quan Lẩu gà lá é Tao Ngộ\",\"price\":\"150000.00\",\"place_id\":12},{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành về Hồ Chí Minh\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}}],\"costConfig\":{\"minimumPax\":4,\"margin\":20,\"fixed\":{\"transport\":2700000,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"breakfast\":200000,\"lunch\":200000,\"dinner\":200000,\"tickets\":0,\"insurance\":0},\"selectedTransport\":{\"service_id\":22,\"service_name\":\"Xe SUV 7 chỗ (Innova/Fortuner) / Ngày\",\"service_type\":\"Xe vận chuyển\",\"description\":\"Xe 7 chỗ đời mới, gầm cao, phù hợp cho nhóm gia đình nhỏ hoặc tour thiết kế riêng.\",\"image_url\":\"/uploads/1787459248482-55394049.jpg\",\"status\":\"Active\",\"partner_id\":3,\"destination_id\":null,\"unit\":\"Xe/Ngày\",\"base_cost\":\"900000.00\",\"selling_price\":\"900000.00\",\"capacity\":7,\"attributes\":\"{}\",\"action_verb\":null,\"short_display_name\":null,\"partner_name\":\"Công ty Xe Lữ Hành Toàn Quốc\",\"destination_name\":null,\"proposed_cost\":null},\"transportTimes\":{\"startD\":\"05:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"17:00\"},\"ageMultiplier\":{\"preset\":\"road\",\"child\":{\"percent\":50,\"fixed_surcharge\":0},\"toddler\":{\"percent\":0,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0}}},\"staffNote\":\"Công ty xin gửi lại cho anh chị báo giá sơ bộ \",\"dayImages\":{\"1\":\"/uploads/1787971116046-canh-dep-da-lat-1_1688379739.webp\",\"2\":\"/uploads/1787971116054-kinh-nghiem-du-lich-da-lat-tu-a-z-de-trai-nghiem-ve-dep-cuoc-song-1 (2).jpg\",\"3\":\"/uploads/1787971116058-tu-nha-trang-di-da-lat-bao-nhieu-km-banner.jpg\"}}', 'Công ty xin gửi lại cho anh chị báo giá sơ bộ ', NULL, 'Pending_Approval', '2026-08-29 02:38:36', NULL, NULL),
(4, 1, 4, NULL, 4970000.00, 20, 5964000.00, '{\"tourName\":\"Khám phá Đà Lạt mộng mơ\",\"tourDescription\":\"Bạn sẽ được trải nghiệm các dịch vụ chu đáo và tân hưởng trọn vẹn các cảnh đẹp từ thiên nhiên\",\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"18\",\"end_destination_id\":\"2\",\"route_title\":\"Hồ Chí Minh - Đà Lạt\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Di chuyển từ Hồ Chí Minh đến Đà Lạt\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Đến khách sạn nhận phòng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đỉnh Langbiang\",\"price\":\"120000.00\",\"place_id\":8},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Datanla\",\"price\":\"170000.00\",\"place_id\":9},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thung Lũng Tình Yêu\",\"price\":\"250000.00\",\"place_id\":73},{\"type\":\"Tham quan\",\"name\":\"Tham quan Lẩu bò Ba Toa Quán Gỗ\",\"price\":\"200000.00\",\"place_id\":11},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đường Hầm Điêu Khắc\",\"price\":\"120000.00\",\"place_id\":74},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đồi Chè Cầu Đất\",\"price\":\"0.00\",\"place_id\":71}],\"accommodation\":{\"service_id\":8,\"name\":\"Phòng Superior (hoặc tương đương)\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":\"\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"2\",\"end_destination_id\":\"2\",\"route_title\":\"Đà Lạt - Thành phố ngàn hoa\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành tham quan tại Đà Lạt\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Vườn thú Zoodoo\",\"price\":\"100000.00\",\"place_id\":10},{\"type\":\"Tham quan\",\"name\":\"Tham quan Samten Hills Dalat\",\"price\":\"250000.00\",\"place_id\":14},{\"type\":\"Tham quan\",\"name\":\"Tham quan Quảng trường Lâm Viên\",\"price\":\"0.00\",\"place_id\":72},{\"type\":\"Tham quan\",\"name\":\"Tham quan Hồ Tuyền Lâm\",\"price\":\"0.00\",\"place_id\":70},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thiền Viện Trúc Lâm\",\"price\":\"0.00\",\"place_id\":69},{\"type\":\"Tham quan\",\"name\":\"Tham quan Bánh tráng nướng Dì Đinh\",\"price\":\"30000.00\",\"place_id\":77},{\"type\":\"Tham quan\",\"name\":\"Tham quan Puppy Farm\",\"price\":\"100000.00\",\"place_id\":75},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ Đêm Âm Phủ\",\"price\":\"50000.00\",\"place_id\":13}],\"accommodation\":{\"service_id\":8,\"name\":\"Phòng Superior (hoặc tương đương)\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"2\",\"end_destination_id\":\"18\",\"route_title\":\"Đà Lạt - Hồ Chí Minh\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Pongour\",\"price\":\"20000.00\",\"place_id\":76},{\"type\":\"Tham quan\",\"name\":\"Tham quan Cafe Túi Mơ To\",\"price\":\"60000.00\",\"place_id\":78},{\"type\":\"Tham quan\",\"name\":\"Tham quan Lẩu gà lá é Tao Ngộ\",\"price\":\"150000.00\",\"place_id\":12},{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành về Hồ Chí Minh\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":\"\"}}],\"costConfig\":{\"minimumPax\":4,\"margin\":20,\"fixed\":{\"transport\":2700000,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"breakfast\":200000,\"lunch\":200000,\"dinner\":200000,\"tickets\":0,\"insurance\":0},\"selectedTransport\":{\"service_id\":22,\"service_name\":\"Xe SUV 7 chỗ (Innova/Fortuner) / Ngày\",\"service_type\":\"Xe vận chuyển\",\"description\":\"Xe 7 chỗ đời mới, gầm cao, phù hợp cho nhóm gia đình nhỏ hoặc tour thiết kế riêng.\",\"image_url\":\"/uploads/1787459248482-55394049.jpg\",\"status\":\"Active\",\"partner_id\":3,\"destination_id\":null,\"unit\":\"Xe/Ngày\",\"base_cost\":\"900000.00\",\"selling_price\":\"900000.00\",\"capacity\":7,\"attributes\":\"{}\",\"action_verb\":null,\"short_display_name\":null,\"partner_name\":\"Công ty Xe Lữ Hành Toàn Quốc\",\"destination_name\":null,\"proposed_cost\":null},\"transportTimes\":{\"startD\":\"05:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"17:00\"},\"ageMultiplier\":{\"preset\":\"custom\",\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":25,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0}}},\"staffNote\":\"Công ty xin gửi lại cho anh chị báo giá sơ bộ \",\"dayImages\":{\"1\":\"/uploads/1787971116046-canh-dep-da-lat-1_1688379739.webp\",\"2\":\"/uploads/1787971116054-kinh-nghiem-du-lich-da-lat-tu-a-z-de-trai-nghiem-ve-dep-cuoc-song-1 (2).jpg\",\"3\":\"/uploads/1787971116058-tu-nha-trang-di-da-lat-bao-nhieu-km-banner.jpg\"}}', 'Công ty xin gửi lại cho anh chị báo giá sơ bộ ', NULL, 'Pending_Approval', '2026-08-29 13:50:41', NULL, NULL),
(5, 1, 4, 3, 4970000.00, 20, 5964000.00, '{\"tourName\":\"Khám phá Đà Lạt mộng mơ\",\"tourDescription\":\"Bạn sẽ được trải nghiệm các dịch vụ chu đáo và tân hưởng trọn vẹn các cảnh đẹp từ thiên nhiên\",\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"18\",\"end_destination_id\":\"2\",\"route_title\":\"Hồ Chí Minh - Đà Lạt\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Di chuyển từ Hồ Chí Minh đến Đà Lạt\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Đến khách sạn nhận phòng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đỉnh Langbiang\",\"price\":\"120000.00\",\"place_id\":8},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Datanla\",\"price\":\"170000.00\",\"place_id\":9},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thung Lũng Tình Yêu\",\"price\":\"250000.00\",\"place_id\":73},{\"type\":\"Tham quan\",\"name\":\"Tham quan Lẩu bò Ba Toa Quán Gỗ\",\"price\":\"200000.00\",\"place_id\":11},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đường Hầm Điêu Khắc\",\"price\":\"120000.00\",\"place_id\":74},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đồi Chè Cầu Đất\",\"price\":\"0.00\",\"place_id\":71}],\"accommodation\":{\"service_id\":8,\"name\":\"Phòng Superior (hoặc tương đương)\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":\"\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"2\",\"end_destination_id\":\"2\",\"route_title\":\"Đà Lạt - Thành phố ngàn hoa\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành tham quan tại Đà Lạt\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Vườn thú Zoodoo\",\"price\":\"100000.00\",\"place_id\":10},{\"type\":\"Tham quan\",\"name\":\"Tham quan Samten Hills Dalat\",\"price\":\"250000.00\",\"place_id\":14},{\"type\":\"Tham quan\",\"name\":\"Tham quan Quảng trường Lâm Viên\",\"price\":\"0.00\",\"place_id\":72},{\"type\":\"Tham quan\",\"name\":\"Tham quan Hồ Tuyền Lâm\",\"price\":\"0.00\",\"place_id\":70},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thiền Viện Trúc Lâm\",\"price\":\"0.00\",\"place_id\":69},{\"type\":\"Tham quan\",\"name\":\"Tham quan Bánh tráng nướng Dì Đinh\",\"price\":\"30000.00\",\"place_id\":77},{\"type\":\"Tham quan\",\"name\":\"Tham quan Puppy Farm\",\"price\":\"100000.00\",\"place_id\":75},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ Đêm Âm Phủ\",\"price\":\"50000.00\",\"place_id\":13}],\"accommodation\":{\"service_id\":8,\"name\":\"Phòng Superior (hoặc tương đương)\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"2\",\"end_destination_id\":\"18\",\"route_title\":\"Đà Lạt - Hồ Chí Minh\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Pongour\",\"price\":\"20000.00\",\"place_id\":76},{\"type\":\"Tham quan\",\"name\":\"Tham quan Cafe Túi Mơ To\",\"price\":\"60000.00\",\"place_id\":78},{\"type\":\"Tham quan\",\"name\":\"Tham quan Lẩu gà lá é Tao Ngộ\",\"price\":\"150000.00\",\"place_id\":12},{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành về Hồ Chí Minh\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":\"\"}}],\"costConfig\":{\"minimumPax\":4,\"margin\":20,\"fixed\":{\"transport\":2700000,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"breakfast\":200000,\"lunch\":200000,\"dinner\":200000,\"tickets\":0,\"insurance\":0},\"selectedTransport\":{\"service_id\":22,\"service_name\":\"Xe SUV 7 chỗ (Innova/Fortuner) / Ngày\",\"service_type\":\"Xe vận chuyển\",\"description\":\"Xe 7 chỗ đời mới, gầm cao, phù hợp cho nhóm gia đình nhỏ hoặc tour thiết kế riêng.\",\"image_url\":\"/uploads/1787459248482-55394049.jpg\",\"status\":\"Active\",\"partner_id\":3,\"destination_id\":null,\"unit\":\"Xe/Ngày\",\"base_cost\":\"900000.00\",\"selling_price\":\"900000.00\",\"capacity\":7,\"attributes\":\"{}\",\"action_verb\":null,\"short_display_name\":null,\"partner_name\":\"Công ty Xe Lữ Hành Toàn Quốc\",\"destination_name\":null,\"proposed_cost\":null},\"transportTimes\":{\"startD\":\"05:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"17:00\"},\"ageMultiplier\":{\"preset\":\"custom\",\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":25,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0}}},\"staffNote\":\"Em gửi quản lý duyệt giúp em\",\"dayImages\":{\"1\":\"/uploads/1787971116046-canh-dep-da-lat-1_1688379739.webp\",\"2\":\"/uploads/1787971116054-kinh-nghiem-du-lich-da-lat-tu-a-z-de-trai-nghiem-ve-dep-cuoc-song-1 (2).jpg\",\"3\":\"/uploads/1787971116058-tu-nha-trang-di-da-lat-bao-nhieu-km-banner.jpg\"}}', 'Em gửi quản lý duyệt giúp em', 'Điều chỉnh lại lịch trình ngày thứ 2', 'Rejected', '2026-08-29 14:32:15', NULL, NULL),
(6, 1, 4, 3, 4970000.00, 20, 5964000.00, '{\"tourName\":\"Khám phá Đà Lạt mộng mơ\",\"tourDescription\":\"Bạn sẽ được trải nghiệm các dịch vụ chu đáo và tân hưởng trọn vẹn các cảnh đẹp từ thiên nhiên\",\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"18\",\"end_destination_id\":\"2\",\"route_title\":\"Hồ Chí Minh - Đà Lạt\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Di chuyển từ Hồ Chí Minh đến Đà Lạt\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Đến khách sạn nhận phòng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đỉnh Langbiang\",\"price\":\"120000.00\",\"place_id\":8},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Datanla\",\"price\":\"170000.00\",\"place_id\":9},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thung Lũng Tình Yêu\",\"price\":\"250000.00\",\"place_id\":73},{\"type\":\"Tham quan\",\"name\":\"Tham quan Lẩu bò Ba Toa Quán Gỗ\",\"price\":\"200000.00\",\"place_id\":11},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đường Hầm Điêu Khắc\",\"price\":\"120000.00\",\"place_id\":74},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đồi Chè Cầu Đất\",\"price\":\"0.00\",\"place_id\":71}],\"accommodation\":{\"service_id\":8,\"name\":\"Phòng Superior (hoặc tương đương)\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":\"\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"2\",\"end_destination_id\":\"2\",\"route_title\":\"Đà Lạt - Thành phố ngàn hoa\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành tham quan tại Đà Lạt\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Vườn thú Zoodoo\",\"price\":\"100000.00\",\"place_id\":10},{\"type\":\"Tham quan\",\"name\":\"Tham quan Samten Hills Dalat\",\"price\":\"250000.00\",\"place_id\":14},{\"type\":\"Tham quan\",\"name\":\"Tham quan Quảng trường Lâm Viên\",\"price\":\"0.00\",\"place_id\":72},{\"type\":\"Tham quan\",\"name\":\"Tham quan Hồ Tuyền Lâm\",\"price\":\"0.00\",\"place_id\":70},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thiền Viện Trúc Lâm\",\"price\":\"0.00\",\"place_id\":69},{\"type\":\"Tham quan\",\"name\":\"Tham quan Puppy Farm\",\"price\":\"100000.00\",\"place_id\":75},{\"type\":\"Tham quan\",\"name\":\"Tham quan Bánh tráng nướng Dì Đinh\",\"price\":\"30000.00\",\"place_id\":77},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ Đêm Âm Phủ\",\"price\":\"50000.00\",\"place_id\":13},{\"type\":\"Nghỉ ngơi\",\"name\":\"Dùng bữa tối tại nhà hàng\",\"price\":0}],\"accommodation\":{\"service_id\":8,\"name\":\"Phòng Superior (hoặc tương đương)\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"2\",\"end_destination_id\":\"18\",\"route_title\":\"Đà Lạt - Hồ Chí Minh\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Pongour\",\"price\":\"20000.00\",\"place_id\":76},{\"type\":\"Tham quan\",\"name\":\"Tham quan Cafe Túi Mơ To\",\"price\":\"60000.00\",\"place_id\":78},{\"type\":\"Tham quan\",\"name\":\"Tham quan Lẩu gà lá é Tao Ngộ\",\"price\":\"150000.00\",\"place_id\":12},{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành về Hồ Chí Minh\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":\"\"}}],\"costConfig\":{\"minimumPax\":4,\"margin\":20,\"fixed\":{\"transport\":2700000,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"breakfast\":200000,\"lunch\":200000,\"dinner\":200000,\"tickets\":0,\"insurance\":0},\"selectedTransport\":{\"service_id\":22,\"service_name\":\"Xe SUV 7 chỗ (Innova/Fortuner) / Ngày\",\"service_type\":\"Xe vận chuyển\",\"description\":\"Xe 7 chỗ đời mới, gầm cao, phù hợp cho nhóm gia đình nhỏ hoặc tour thiết kế riêng.\",\"image_url\":\"/uploads/1787459248482-55394049.jpg\",\"status\":\"Active\",\"partner_id\":3,\"destination_id\":null,\"unit\":\"Xe/Ngày\",\"base_cost\":\"900000.00\",\"selling_price\":\"900000.00\",\"capacity\":7,\"attributes\":\"{}\",\"action_verb\":null,\"short_display_name\":null,\"partner_name\":\"Công ty Xe Lữ Hành Toàn Quốc\",\"destination_name\":null,\"proposed_cost\":null},\"transportTimes\":{\"startD\":\"05:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"17:00\"},\"ageMultiplier\":{\"preset\":\"custom\",\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":25,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0}}},\"staffNote\":\"\",\"dayImages\":{\"1\":\"/uploads/1787971116046-canh-dep-da-lat-1_1688379739.webp\",\"2\":\"/uploads/1787971116054-kinh-nghiem-du-lich-da-lat-tu-a-z-de-trai-nghiem-ve-dep-cuoc-song-1 (2).jpg\",\"3\":\"/uploads/1787971116058-tu-nha-trang-di-da-lat-bao-nhieu-km-banner.jpg\"}}', '', 'Thay đổi lịch trình ngày 2', 'Rejected', '2026-08-29 14:40:22', NULL, NULL),
(7, 1, 4, 3, 4970000.00, 20, 5964000.00, '{\"tourName\":\"Khám phá Đà Lạt mộng mơ\",\"tourDescription\":\"Bạn sẽ được trải nghiệm các dịch vụ chu đáo và tân hưởng trọn vẹn các cảnh đẹp từ thiên nhiên\",\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"18\",\"end_destination_id\":\"2\",\"route_title\":\"Hồ Chí Minh - Đà Lạt\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Di chuyển từ Hồ Chí Minh đến Đà Lạt\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Đến khách sạn nhận phòng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đỉnh Langbiang\",\"price\":\"120000.00\",\"place_id\":8},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Datanla\",\"price\":\"170000.00\",\"place_id\":9},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thung Lũng Tình Yêu\",\"price\":\"250000.00\",\"place_id\":73},{\"type\":\"Tham quan\",\"name\":\"Tham quan Lẩu bò Ba Toa Quán Gỗ\",\"price\":\"200000.00\",\"place_id\":11},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đường Hầm Điêu Khắc\",\"price\":\"120000.00\",\"place_id\":74},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đồi Chè Cầu Đất\",\"price\":\"0.00\",\"place_id\":71}],\"accommodation\":{\"service_id\":8,\"name\":\"Phòng Superior (hoặc tương đương)\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":\"\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"2\",\"end_destination_id\":\"2\",\"route_title\":\"Đà Lạt - Thành phố ngàn hoa\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành tham quan tại Đà Lạt\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Vườn thú Zoodoo\",\"price\":\"100000.00\",\"place_id\":10},{\"type\":\"Tham quan\",\"name\":\"Tham quan Samten Hills Dalat\",\"price\":\"250000.00\",\"place_id\":14},{\"type\":\"Tham quan\",\"name\":\"Tham quan Quảng trường Lâm Viên\",\"price\":\"0.00\",\"place_id\":72},{\"type\":\"Tham quan\",\"name\":\"Tham quan Hồ Tuyền Lâm\",\"price\":\"0.00\",\"place_id\":70},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thiền Viện Trúc Lâm\",\"price\":\"0.00\",\"place_id\":69},{\"type\":\"Tham quan\",\"name\":\"Tham quan Puppy Farm\",\"price\":\"100000.00\",\"place_id\":75},{\"type\":\"Tham quan\",\"name\":\"Tham quan Bánh tráng nướng Dì Đinh\",\"price\":\"30000.00\",\"place_id\":77},{\"type\":\"Nghỉ ngơi\",\"name\":\"Dùng bữa tối tại nhà hàng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ Đêm Âm Phủ\",\"price\":\"50000.00\",\"place_id\":13}],\"accommodation\":{\"service_id\":8,\"name\":\"Phòng Superior (hoặc tương đương)\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"2\",\"end_destination_id\":\"18\",\"route_title\":\"Đà Lạt - Hồ Chí Minh\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Pongour\",\"price\":\"20000.00\",\"place_id\":76},{\"type\":\"Tham quan\",\"name\":\"Tham quan Cafe Túi Mơ To\",\"price\":\"60000.00\",\"place_id\":78},{\"type\":\"Tham quan\",\"name\":\"Tham quan Lẩu gà lá é Tao Ngộ\",\"price\":\"150000.00\",\"place_id\":12},{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành về Hồ Chí Minh\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":\"\"}}],\"costConfig\":{\"minimumPax\":4,\"margin\":20,\"fixed\":{\"transport\":2700000,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"breakfast\":200000,\"lunch\":200000,\"dinner\":200000,\"tickets\":0,\"insurance\":0},\"selectedTransport\":{\"service_id\":22,\"service_name\":\"Xe SUV 7 chỗ (Innova/Fortuner) / Ngày\",\"service_type\":\"Xe vận chuyển\",\"description\":\"Xe 7 chỗ đời mới, gầm cao, phù hợp cho nhóm gia đình nhỏ hoặc tour thiết kế riêng.\",\"image_url\":\"/uploads/1787459248482-55394049.jpg\",\"status\":\"Active\",\"partner_id\":3,\"destination_id\":null,\"unit\":\"Xe/Ngày\",\"base_cost\":\"900000.00\",\"selling_price\":\"900000.00\",\"capacity\":7,\"attributes\":\"{}\",\"action_verb\":null,\"short_display_name\":null,\"partner_name\":\"Công ty Xe Lữ Hành Toàn Quốc\",\"destination_name\":null,\"proposed_cost\":null},\"transportTimes\":{\"startD\":\"05:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"17:00\"},\"ageMultiplier\":{\"preset\":\"custom\",\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":25,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0}}},\"staffNote\":\"Em gửi quản lý phê duyệt lại\",\"dayImages\":{\"1\":\"/uploads/1787971116046-canh-dep-da-lat-1_1688379739.webp\",\"2\":\"/uploads/1787971116054-kinh-nghiem-du-lich-da-lat-tu-a-z-de-trai-nghiem-ve-dep-cuoc-song-1 (2).jpg\",\"3\":\"/uploads/1787971116058-tu-nha-trang-di-da-lat-bao-nhieu-km-banner.jpg\"}}', 'Em gửi quản lý phê duyệt lại', NULL, 'Quote_Sent', '2026-08-29 14:42:24', NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `custom_tour_requests`
--

CREATE TABLE `custom_tour_requests` (
  `request_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `departure_date` date DEFAULT NULL,
  `return_date` date DEFAULT NULL,
  `people_count` int(11) DEFAULT NULL,
  `budget` decimal(15,2) DEFAULT NULL,
  `requirements` text DEFAULT NULL,
  `markup_percent` int(11) DEFAULT 20,
  `base_cost` decimal(15,2) DEFAULT 0.00,
  `quoted_price` decimal(15,2) DEFAULT 0.00,
  `staff_note` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `custom_tour_requests`
--

INSERT INTO `custom_tour_requests` (`request_id`, `customer_id`, `destination`, `departure_date`, `return_date`, `people_count`, `budget`, `requirements`, `markup_percent`, `base_cost`, `quoted_price`, `staff_note`, `status`, `created_at`) VALUES
(1, 8, 'Đà Lạt', '2026-09-04', '2026-09-06', 4, 5000000.00, '{\"hotel\":\"8\",\"transport\":\"22\",\"activities\":[8,9,10,13,12,11,14,69,70,73,72,71,76,74,75,78,77],\"note\":\"\",\"pickup_location\":\"Hồ Chí Minh\",\"departure_time\":\"05:00\",\"participantBreakdown\":{\"adults\":2,\"children\":1,\"toddlers\":1,\"infants\":0},\"hotelName\":\"Hôtel Colline Đà Lạt - Phòng Superior\",\"hotelPrice\":650000,\"transportName\":\"Công ty Xe Lữ Hành Toàn Quốc - Xe SUV 7 chỗ (Innova/Fortuner) / Ngày\",\"transportPrice\":675000,\"guide\":\"Cần Hướng dẫn viên\",\"meal\":\"Công ty tự sắp xếp\",\"selectedPlaces\":[{\"name\":\"Đỉnh Langbiang\",\"price\":120000},{\"name\":\"Thác Datanla\",\"price\":170000},{\"name\":\"Vườn thú Zoodoo\",\"price\":100000},{\"name\":\"Lẩu bò Ba Toa Quán Gỗ\",\"price\":200000},{\"name\":\"Lẩu gà lá é Tao Ngộ\",\"price\":150000},{\"name\":\"Chợ Đêm Âm Phủ\",\"price\":50000},{\"name\":\"Samten Hills Dalat\",\"price\":250000},{\"name\":\"Thiền Viện Trúc Lâm\",\"price\":0},{\"name\":\"Hồ Tuyền Lâm\",\"price\":0},{\"name\":\"Đồi Chè Cầu Đất\",\"price\":0},{\"name\":\"Quảng trường Lâm Viên\",\"price\":0},{\"name\":\"Thung Lũng Tình Yêu\",\"price\":250000},{\"name\":\"Đường Hầm Điêu Khắc\",\"price\":120000},{\"name\":\"Nông trại Cún Puppy Farm\",\"price\":100000},{\"name\":\"Thác Pongour\",\"price\":20000},{\"name\":\"Bánh tráng nướng Dì Đinh\",\"price\":30000},{\"name\":\"Quán cafe Túi Mơ To\",\"price\":60000}]}', 20, 0.00, 18000000.00, NULL, 'Sent_To_Customer', '2026-08-28 12:28:42');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `departures`
--

CREATE TABLE `departures` (
  `departure_id` int(11) NOT NULL,
  `tour_id` int(11) DEFAULT NULL,
  `departure_date` date DEFAULT NULL,
  `return_date` date DEFAULT NULL,
  `max_slots` int(11) DEFAULT NULL,
  `available_slots` int(11) DEFAULT NULL,
  `status` enum('Open','Closed','Completed') DEFAULT 'Open',
  `guide_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `departures`
--

INSERT INTO `departures` (`departure_id`, `tour_id`, `departure_date`, `return_date`, `max_slots`, `available_slots`, `status`, `guide_id`) VALUES
(3, 10, '2026-08-07', '2026-08-09', 30, 30, 'Open', 5),
(5, 29, '2026-08-25', '2026-08-28', 20, 20, 'Open', 5),
(6, 29, '2026-08-26', '2026-08-29', 18, 18, 'Open', 6),
(7, 29, '2026-09-01', '2026-09-04', 20, 20, 'Open', 5),
(8, 31, '2026-09-05', '2026-09-07', 15, 15, 'Open', 6),
(9, 32, '2026-09-20', '2026-09-22', 30, 25, 'Open', NULL),
(10, 32, '2026-10-15', '2026-10-17', 30, 28, 'Open', NULL),
(11, 33, '2026-09-20', '2026-09-24', 30, 25, 'Open', NULL),
(12, 33, '2026-10-15', '2026-10-19', 30, 28, 'Open', NULL),
(13, 34, '2026-09-20', '2026-09-22', 30, 25, 'Open', NULL),
(14, 34, '2026-10-15', '2026-10-17', 30, 28, 'Open', NULL),
(15, 35, '2026-09-20', '2026-09-22', 30, 25, 'Open', NULL),
(16, 35, '2026-10-15', '2026-10-17', 30, 28, 'Open', NULL),
(17, 36, '2026-09-20', '2026-09-23', 30, 25, 'Open', NULL),
(18, 36, '2026-10-15', '2026-10-18', 30, 28, 'Open', NULL),
(19, 37, '2026-09-20', '2026-09-23', 30, 25, 'Open', NULL),
(20, 37, '2026-10-15', '2026-10-18', 30, 28, 'Open', NULL),
(21, 38, '2026-09-20', '2026-09-22', 30, 25, 'Open', NULL),
(22, 38, '2026-10-15', '2026-10-17', 30, 28, 'Open', NULL),
(23, 39, '2026-09-20', '2026-09-22', 30, 25, 'Open', NULL),
(24, 39, '2026-10-15', '2026-10-17', 30, 28, 'Open', NULL),
(25, 40, '2026-09-20', '2026-09-23', 30, 25, 'Open', NULL),
(26, 40, '2026-10-15', '2026-10-18', 30, 28, 'Open', NULL),
(27, 41, '2026-09-20', '2026-09-22', 30, 25, 'Open', NULL),
(28, 41, '2026-10-15', '2026-10-17', 30, 28, 'Open', NULL),
(29, 42, '2026-09-20', '2026-09-23', 30, 25, 'Open', NULL),
(30, 42, '2026-10-15', '2026-10-18', 30, 28, 'Open', NULL),
(31, 43, '2026-09-20', '2026-09-23', 30, 25, 'Open', NULL),
(32, 43, '2026-10-15', '2026-10-18', 30, 28, 'Open', NULL),
(33, 44, '2026-09-20', '2026-09-22', 30, 25, 'Open', NULL),
(34, 44, '2026-10-15', '2026-10-17', 30, 28, 'Open', NULL),
(35, 45, '2026-09-20', '2026-09-22', 30, 25, 'Open', NULL),
(36, 45, '2026-10-15', '2026-10-17', 30, 28, 'Open', NULL),
(37, 46, '2026-09-20', '2026-09-22', 30, 25, 'Open', NULL),
(38, 46, '2026-10-15', '2026-10-17', 30, 28, 'Open', NULL),
(39, 47, '2026-09-20', '2026-09-21', 30, 25, 'Open', NULL),
(40, 47, '2026-10-15', '2026-10-16', 30, 28, 'Open', NULL),
(41, 48, '2026-09-20', '2026-09-22', 30, 25, 'Open', NULL),
(42, 48, '2026-10-15', '2026-10-17', 30, 28, 'Open', NULL),
(43, 49, '2026-09-20', '2026-09-22', 30, 25, 'Open', NULL),
(44, 49, '2026-10-15', '2026-10-17', 30, 28, 'Open', NULL),
(45, 50, '2026-09-20', '2026-09-21', 30, 25, 'Open', NULL),
(46, 50, '2026-10-15', '2026-10-16', 30, 28, 'Open', NULL),
(47, 51, '2026-09-20', '2026-09-20', 30, 25, 'Open', NULL),
(48, 51, '2026-10-15', '2026-10-15', 30, 28, 'Open', NULL),
(49, 52, '2026-09-20', '2026-09-27', 30, 25, 'Open', NULL),
(50, 52, '2026-10-15', '2026-10-22', 30, 28, 'Open', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `departure_updates`
--

CREATE TABLE `departure_updates` (
  `update_id` int(11) NOT NULL,
  `departure_id` int(11) NOT NULL,
  `guide_id` int(11) NOT NULL,
  `location` varchar(255) NOT NULL,
  `activity` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `itinerary_id` int(11) DEFAULT NULL,
  `delay_minutes` int(11) DEFAULT 0,
  `delay_reason` varchar(255) DEFAULT NULL,
  `milestone_index` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `departure_updates`
--

INSERT INTO `departure_updates` (`update_id`, `departure_id`, `guide_id`, `location`, `activity`, `description`, `image_url`, `created_at`, `itinerary_id`, `delay_minutes`, `delay_reason`, `milestone_index`) VALUES
(14, 3, 1, 'Ngày 1: Đón Đoàn - Khám Phá Nam Đảo - Sunset Sanato Beach Club', '🚌 Di chuyển', 'HDV đã xác nhận hoàn thành mốc: Ngày 1: Đón Đoàn - Khám Phá Nam Đảo - Sunset Sanato Beach Club (Ngày 1)', NULL, '2026-09-01 01:06:32', 36, 0, NULL, 0),
(15, 3, 1, 'Phú Quốc', '🏞️ Tham quan', '[Mốc #2 - Ngày 1] ☀️ 10:00 - 12:00: Tham quan Cơ sở nuôi cấy Ngọc Trai Phú Quốc, lắng nghe quy trình nuôi cấy ngọc trai thiên nhiên biển Nam. HDV tư vấn đòn mua sắm ngọc trai chính hiệu.', NULL, '2026-09-01 01:34:53', 36, 0, NULL, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `destinations`
--

CREATE TABLE `destinations` (
  `destination_id` int(11) NOT NULL,
  `destination_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `slogan` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `destinations`
--

INSERT INTO `destinations` (`destination_id`, `destination_name`, `description`, `image_url`, `status`, `slogan`) VALUES
(1, 'Nha Trang', NULL, NULL, 'Active', 'Thành phố biển'),
(2, 'Đà Lạt', NULL, NULL, 'Active', 'Thành phố ngàn hoa'),
(3, 'Phú Quốc', NULL, NULL, 'Active', NULL),
(4, 'Lào Cai', NULL, NULL, 'Active', NULL),
(5, 'Đà Nẵng', 'Thành phố biển đáng sống nhất Việt Nam', 'danang.jpg', 'Active', NULL),
(6, 'Hội An', 'Phố cổ Hội An - Di sản Văn hóa Thế giới', 'hoian.jpg', 'Active', NULL),
(7, 'Huế', 'Cố đô Huế với nhiều di tích lịch sử', 'hue.jpg', 'Active', NULL),
(8, 'Hà Nội', 'Thủ đô nghìn năm văn hiến', 'hanoi.jpg', 'Active', NULL),
(9, 'Hạ Long', 'Vịnh Hạ Long - Kỳ quan thiên nhiên thế giới', 'halong.jpg', 'Active', NULL),
(10, 'Quy Nhơn', 'Thành phố biển Bình Định', 'quynhon.jpg', 'Active', NULL),
(11, 'Mũi Né', 'Thiên đường nghỉ dưỡng của Bình Thuận', 'muine.jpg', 'Active', NULL),
(12, 'Cần Thơ', 'Thủ phủ miền Tây sông nước', 'cantho.jpg', 'Active', NULL),
(13, 'Côn Đảo', 'Quần đảo nổi tiếng về lịch sử và biển đẹp', 'condao.jpg', 'Active', NULL),
(14, 'Vũng Tàu', 'Thành phố biển gần TP.HCM', 'vungtau.jpg', 'Active', NULL),
(15, 'Ninh Bình', 'Di sản Tràng An và Tam Cốc', 'ninhbinh.jpg', 'Active', NULL),
(16, 'Quảng Bình', 'Vương quốc hang động Việt Nam', 'quangbinh.jpg', 'Active', NULL),
(18, 'Hồ Chí Minh', NULL, NULL, 'Active', NULL),
(19, 'Hà Giang', NULL, NULL, 'Active', NULL),
(20, 'Phú Yên', NULL, NULL, 'Active', NULL),
(21, 'Tây Nguyên', NULL, NULL, 'Active', NULL),
(22, 'Cà Mau', NULL, NULL, 'Active', NULL),
(23, 'Tây Ninh', NULL, NULL, 'Active', NULL),
(24, 'Bạc Liêu', NULL, NULL, 'Active', NULL),
(25, 'Đồng Tháp', NULL, NULL, 'Active', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `guides`
--

CREATE TABLE `guides` (
  `guide_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `license_number` varchar(100) DEFAULT NULL,
  `experience_years` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `guides`
--

INSERT INTO `guides` (`guide_id`, `user_id`, `license_number`, `experience_years`) VALUES
(1, 5, 'HDV001', 5),
(2, 6, 'HDV002', 3);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `guide_assignments`
--

CREATE TABLE `guide_assignments` (
  `assignment_id` int(11) NOT NULL,
  `departure_id` int(11) DEFAULT NULL,
  `guide_id` int(11) DEFAULT NULL,
  `assigned_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `guide_assignments`
--

INSERT INTO `guide_assignments` (`assignment_id`, `departure_id`, `guide_id`, `assigned_at`) VALUES
(5, 3, 1, '2026-07-28 13:24:01'),
(10, 5, 1, '2026-08-20 13:49:52'),
(11, 6, 2, '2026-08-20 13:49:52'),
(12, 7, 1, '2026-08-20 13:49:52'),
(13, 8, 2, '2026-08-23 05:32:38');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `incident_reports`
--

CREATE TABLE `incident_reports` (
  `incident_id` int(11) NOT NULL,
  `guide_id` int(11) DEFAULT NULL,
  `departure_id` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('Open','Resolved') DEFAULT 'Open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `image_url` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `resolution_notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `itineraries`
--

CREATE TABLE `itineraries` (
  `itinerary_id` int(11) NOT NULL,
  `tour_id` int(11) DEFAULT NULL,
  `day_number` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `itineraries`
--

INSERT INTO `itineraries` (`itinerary_id`, `tour_id`, `day_number`, `title`, `description`) VALUES
(27, 7, 1, 'Ngày 1: TP.HCM - Đà Lạt: Thành Phố Ngàn Hoa & Quảng Trường Lâm Viên', '🌅 06:00 - 08:30: Tập trung đoàn tại Văn phòng TravelERP. HDV phát thẻ đoàn, kiểm tra danh sách hành khách và phổ biến nội quy chuyến đi. Khởi hành đi Đà Lạt bằng xe du lịch đời mới. Dùng điểm tâm sáng với Bánh canh Trảng Bàng đặc sản.\n\n☀️ 11:30 - 13:00: Đoàn dừng chân dùng cơm trưa tại Nhà hàng Tâm Châu (Bảo Lộc), thưởng thức danh trà & cà phê tự do. HDV điểm danh số lượng khách trước khi xe vượt đèo Bảo Lộc.\n\n🌇 15:30 - 17:30: Đến Đà Lạt, đoàn làm thủ tục nhận phòng tại Khách sạn TTC Hotel Premium (4 sao). Tự do nghỉ ngơi. HDV chuẩn bị sẵn vé tham quan cho các ngày tiếp theo.\n\n🌙 18:00 - 21:00: Dùng tiệc tối tại Nhà hàng Lê Lai với thực đơn đặc sản vùng cao. Tự do dạo ngắm Chợ Đêm Đà Lạt, check-in Quảng trường Lâm Viên, nụ hoa Atiso khổng lồ và thưởng thức sữa đậu nành nóng. HDV nhắc nhở khách giờ tập trung sáng Ngày 2.'),
(28, 7, 2, 'Ngày 2: Chinh Phục Đỉnh Langbiang - Thung Lũng Tình Yêu - Đồi Chè Cầu Đất', '🌅 07:00 - 08:00: Dùng điểm tâm buffet sáng tại khách sạn. HDV kiểm tra sĩ số đoàn lên xe khởi hành.\n\n☀️ 08:30 - 11:30: Khởi hành tham quan Khu du lịch Langbiang. HDV làm thủ tục hỗ trợ đoàn lên xe Jeep chinh phục đỉnh Rada ngắm toàn cảnh thung lũng Đankia và suối Vàng suối Bạc.\n\n🌇 12:00 - 14:00: Dùng cơm trưa tại Nhà hàng dưới chân núi Langbiang với thực đơn Cơm lam thịt nướng Tây Nguyên. \n\n🌆 14:30 - 17:30: Di chuyển tham quan Đồi Chè Cầu Đất & Tuabin gió khổng lồ. HDV hỗ trợ chụp ảnh lưu niệm đoàn. Trên đường về ghé tham quan Vườn dâu tây công nghệ cao và cơ sở mua sắm mứt Đà Lạt.\n\n🌙 18:30 - 21:30: Tham gia đêm Giao lưu Cồng chiêng Tây Nguyên dưới chân núi Mẹ, thưởng thức rượu cần & thịt lợn rừng nướng. HDV điều phối hoạt động văn hóa nghệ thuật với đồng bào dân tộc K\'Ho.'),
(29, 7, 3, 'Ngày 3: Thiền Viện Trúc Lâm - Chợ Đà Lạt - TP.HCM', '🌅 07:00 - 08:00: Dùng điểm tâm sáng buffet, làm thủ tục trả phòng khách sạn. HDV kiểm tra kỹ hành lý và tài sản cá nhân giúp hành khách.\n\n☀️ 08:30 - 11:00: Viếng Thiền Viện Trúc Lâm thanh tĩnh ngắm Hồ Tuyền Lâm. HDV hướng dẫn đoàn trải nghiệm cáp treo Đồi Robin ngắm toàn cảnh rừng thông thơ mộng.\n\n🌇 11:30 - 13:30: Dùng cơm trưa tại Nhà hàng Hướng Dương (Bảo Lộc). Mua sắm quà lưu niệm (Trà, Cà phê, Mứt hoa quả) cho người thân.\n\n🌙 18:00 - 19:00: Xe đưa đoàn về lại điểm đón ban đầu tại TP.HCM. HDV phát phiếu khảo sát chất lượng dịch vụ, gửi lời cảm ơn và hỗ trợ hành khách trả hành lý. Kết thúc chuyến đi an toàn.'),
(30, 9, 1, 'Ngày 1: TP.HCM - Đà Lạt: Thành Phố Ngàn Hoa & Quảng Trường Lâm Viên', '🌅 06:00 - 08:30: Tập trung đoàn tại Văn phòng TravelERP. HDV phát thẻ đoàn, kiểm tra danh sách hành khách và phổ biến nội quy chuyến đi. Khởi hành đi Đà Lạt bằng xe du lịch đời mới. Dùng điểm tâm sáng với Bánh canh Trảng Bàng đặc sản.\n\n☀️ 11:30 - 13:00: Đoàn dừng chân dùng cơm trưa tại Nhà hàng Tâm Châu (Bảo Lộc), thưởng thức danh trà & cà phê tự do. HDV điểm danh số lượng khách trước khi xe vượt đèo Bảo Lộc.\n\n🌇 15:30 - 17:30: Đến Đà Lạt, đoàn làm thủ tục nhận phòng tại Khách sạn TTC Hotel Premium (4 sao). Tự do nghỉ ngơi. HDV chuẩn bị sẵn vé tham quan cho các ngày tiếp theo.\n\n🌙 18:00 - 21:00: Dùng tiệc tối tại Nhà hàng Lê Lai với thực đơn đặc sản vùng cao. Tự do dạo ngắm Chợ Đêm Đà Lạt, check-in Quảng trường Lâm Viên, nụ hoa Atiso khổng lồ và thưởng thức sữa đậu nành nóng. HDV nhắc nhở khách giờ tập trung sáng Ngày 2.'),
(31, 9, 2, 'Ngày 2: Chinh Phục Đỉnh Langbiang - Thung Lũng Tình Yêu - Đồi Chè Cầu Đất', '🌅 07:00 - 08:00: Dùng điểm tâm buffet sáng tại khách sạn. HDV kiểm tra sĩ số đoàn lên xe khởi hành.\n\n☀️ 08:30 - 11:30: Khởi hành tham quan Khu du lịch Langbiang. HDV làm thủ tục hỗ trợ đoàn lên xe Jeep chinh phục đỉnh Rada ngắm toàn cảnh thung lũng Đankia và suối Vàng suối Bạc.\n\n🌇 12:00 - 14:00: Dùng cơm trưa tại Nhà hàng dưới chân núi Langbiang với thực đơn Cơm lam thịt nướng Tây Nguyên. \n\n🌆 14:30 - 17:30: Di chuyển tham quan Đồi Chè Cầu Đất & Tuabin gió khổng lồ. HDV hỗ trợ chụp ảnh lưu niệm đoàn. Trên đường về ghé tham quan Vườn dâu tây công nghệ cao và cơ sở mua sắm mứt Đà Lạt.\n\n🌙 18:30 - 21:30: Tham gia đêm Giao lưu Cồng chiêng Tây Nguyên dưới chân núi Mẹ, thưởng thức rượu cần & thịt lợn rừng nướng. HDV điều phối hoạt động văn hóa nghệ thuật với đồng bào dân tộc K\'Ho.'),
(32, 9, 3, 'Ngày 3: Thiền Viện Trúc Lâm - Chợ Đà Lạt - TP.HCM', '🌅 07:00 - 08:00: Dùng điểm tâm sáng buffet, làm thủ tục trả phòng khách sạn. HDV kiểm tra kỹ hành lý và tài sản cá nhân giúp hành khách.\n\n☀️ 08:30 - 11:00: Viếng Thiền Viện Trúc Lâm thanh tĩnh ngắm Hồ Tuyền Lâm. HDV hướng dẫn đoàn trải nghiệm cáp treo Đồi Robin ngắm toàn cảnh rừng thông thơ mộng.\n\n🌇 11:30 - 13:30: Dùng cơm trưa tại Nhà hàng Hướng Dương (Bảo Lộc). Mua sắm quà lưu niệm (Trà, Cà phê, Mứt hoa quả) cho người thân.\n\n🌙 18:00 - 19:00: Xe đưa đoàn về lại điểm đón ban đầu tại TP.HCM. HDV phát phiếu khảo sát chất lượng dịch vụ, gửi lời cảm ơn và hỗ trợ hành khách trả hành lý. Kết thúc chuyến đi an toàn.'),
(33, 8, 1, 'Ngày 1: Đón Đoàn - Khám Phá Nam Đảo - Sunset Sanato Beach Club', '🌅 07:30 - 09:30: Xe & HDV đón đoàn tại Sân bay Phú Quốc / Bến tàu Rạch Giá. Dùng điểm tâm sáng với đặc sản Bún quậy Kiến Xây nổi tiếng.\n\n☀️ 10:00 - 12:00: Tham quan Cơ sở nuôi cấy Ngọc Trai Phú Quốc, lắng nghe quy trình nuôi cấy ngọc trai thiên nhiên biển Nam. HDV tư vấn đòn mua sắm ngọc trai chính hiệu.\n\n🌇 12:30 - 15:30: Dùng cơm trưa hải sản tại Nhà hàng ven biển. Nhận phòng Resort Sunset Beach (4 sao). Tự do tắm biển & nghỉ ngơi.\n\n🌙 16:30 - 21:00: HDV đưa đoàn đến Sunset Sanato Beach Club ngắm hoàng hôn ngút ngàn và chụp ảnh tượng voi chân dài, tượng người gác cổng. Dùng tiệc tối hải sản tươi sống và tự do dạo Chợ đêm Phú Quốc.'),
(34, 8, 2, 'Ngày 2: Tour 4 Đảo Canô - Lặn Ngắm San Ho - Cáp Treo Hòn Thơm', '🌅 07:00 - 08:00: Dùng điểm tâm sáng buffet tại Resort. HDV nhắc nhở quý khách chuẩn bị trang phục bơi, kem chống nắng, túi chống nước điện thoại.\n\n☀️ 08:30 - 12:30: Di chuyển xuống Cảng An Thới. Lên Canô cao tốc lướt biển khám phá 4 đảo: Hòn Mây Rút, Hòn Móng Tay, Hòn Gầm Ghì. HDV hỗ trợ trang thiết bị lặn ngắm san hô tự nhiên & chụp ảnh quay phim flycam.\n\n🌇 13:00 - 16:30: Dùng bữa trưa hải sản trên đảo. Trải nghiệm Cáp treo Hòn Thơm vượt biển dài nhất thế giới và vui chơi tại Công viên nước Aquatopia.\n\n🌙 18:30 - 21:30: Xe đưa đoàn dùng cơm tối với đặc sản Gỏi cá trích & Rượu sim rừng. Tự do dạo phố biển hoặc đăng ký Tour trải nghiệm câu mực đêm cùng ngư dân.'),
(35, 8, 3, 'Ngày 3: Chùa Hộ Quốc - Dinh Cậu - Tạm Biệt Phú Quốc', '🌅 07:30 - 08:30: Dùng điểm tâm sáng, làm thủ tục trả phòng resort. HDV tập trung đoàn kiểm tra hành lý.\n\n☀️ 09:00 - 11:30: Viếng Chùa Hộ Quốc (Thiền Viện Trúc Lâm Hộ Quốc) tựa lưng núi hướng biển xanh. Tham quan Nhà thùng nước mắm truyền thống Phụng Hưng & Dinh Cậu tâm linh.\n\n🌇 12:00 - 14:00: Dùng cơm trưa tại Nhà hàng. Mua sắm đặc sản Nước mắm Phú Quốc, Hạt tiêu Suối Đá, Rượu sim làm quà.\n\n🌙 15:00 - 17:00: Xe đưa đoàn ra Sân bay Phú Quốc / Bến tàu. HDV hỗ trợ làm thủ tục check-in vé và gửi lời chào tạm biệt quý khách.'),
(36, 10, 1, 'Ngày 1: Đón Đoàn - Khám Phá Nam Đảo - Sunset Sanato Beach Club', '🌅 07:30 - 09:30: Xe & HDV đón đoàn tại Sân bay Phú Quốc / Bến tàu Rạch Giá. Dùng điểm tâm sáng với đặc sản Bún quậy Kiến Xây nổi tiếng.\n\n☀️ 10:00 - 12:00: Tham quan Cơ sở nuôi cấy Ngọc Trai Phú Quốc, lắng nghe quy trình nuôi cấy ngọc trai thiên nhiên biển Nam. HDV tư vấn đòn mua sắm ngọc trai chính hiệu.\n\n🌇 12:30 - 15:30: Dùng cơm trưa hải sản tại Nhà hàng ven biển. Nhận phòng Resort Sunset Beach (4 sao). Tự do tắm biển & nghỉ ngơi.\n\n🌙 16:30 - 21:00: HDV đưa đoàn đến Sunset Sanato Beach Club ngắm hoàng hôn ngút ngàn và chụp ảnh tượng voi chân dài, tượng người gác cổng. Dùng tiệc tối hải sản tươi sống và tự do dạo Chợ đêm Phú Quốc.'),
(37, 10, 2, 'Ngày 2: Tour 4 Đảo Canô - Lặn Ngắm San Ho - Cáp Treo Hòn Thơm', '🌅 07:00 - 08:00: Dùng điểm tâm sáng buffet tại Resort. HDV nhắc nhở quý khách chuẩn bị trang phục bơi, kem chống nắng, túi chống nước điện thoại.\n\n☀️ 08:30 - 12:30: Di chuyển xuống Cảng An Thới. Lên Canô cao tốc lướt biển khám phá 4 đảo: Hòn Mây Rút, Hòn Móng Tay, Hòn Gầm Ghì. HDV hỗ trợ trang thiết bị lặn ngắm san hô tự nhiên & chụp ảnh quay phim flycam.\n\n🌇 13:00 - 16:30: Dùng bữa trưa hải sản trên đảo. Trải nghiệm Cáp treo Hòn Thơm vượt biển dài nhất thế giới và vui chơi tại Công viên nước Aquatopia.\n\n🌙 18:30 - 21:30: Xe đưa đoàn dùng cơm tối với đặc sản Gỏi cá trích & Rượu sim rừng. Tự do dạo phố biển hoặc đăng ký Tour trải nghiệm câu mực đêm cùng ngư dân.'),
(38, 10, 3, 'Ngày 3: Chùa Hộ Quốc - Dinh Cậu - Tạm Biệt Phú Quốc', '🌅 07:30 - 08:30: Dùng điểm tâm sáng, làm thủ tục trả phòng resort. HDV tập trung đoàn kiểm tra hành lý.\n\n☀️ 09:00 - 11:30: Viếng Chùa Hộ Quốc (Thiền Viện Trúc Lâm Hộ Quốc) tựa lưng núi hướng biển xanh. Tham quan Nhà thùng nước mắm truyền thống Phụng Hưng & Dinh Cậu tâm linh.\n\n🌇 12:00 - 14:00: Dùng cơm trưa tại Nhà hàng. Mua sắm đặc sản Nước mắm Phú Quốc, Hạt tiêu Suối Đá, Rượu sim làm quà.\n\n🌙 15:00 - 17:00: Xe đưa đoàn ra Sân bay Phú Quốc / Bến tàu. HDV hỗ trợ làm thủ tục check-in vé và gửi lời chào tạm biệt quý khách.'),
(110, 32, 1, 'Ngày 1: TP.HCM / Hà Nội - Đà Nẵng - Sơn Trà - Biển Mỹ Khê', '🌅 07:30 - 09:30: Đón đoàn tại Sân bay Đà Nẵng / Bến xe\n\n☀️ 10:00 - 12:30: Viếng Chùa Linh Ứng Bán Đảo Sơn Trà & Tượng Phật Bà 67m\n\n🌇 13:00 - 16:30: Tự do tắm biển Mỹ Khê & Thưởng thức hải sản biển\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Sala Đà Nẵng Beach. Tự do khám phá thành phố về đêm.'),
(111, 32, 2, 'Ngày 2: Đà Nẵng - Bà Nà Hills - Cầu Vàng - Phố Cổ Hội An', '🌅 07:30 - 09:30: Đi cáp treo Bà Nà Hills & Check-in Cầu Vàng bàn tay khổng lồ\n\n☀️ 10:00 - 12:30: Khám phá Làng Pháp & Vui chơi Công viên Fantasy Park\n\n🌇 13:00 - 16:30: Dạo Phố Cổ Hội An lung linh đèn lồng & Thưởng thức Cao Lầu\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Sala Đà Nẵng Beach. Tự do khám phá thành phố về đêm.'),
(112, 32, 3, 'Ngày 3: Đà Nẵng - Mua Sắm Đặc Sản - Tiễn Sân Bay', '🌅 07:30 - 09:30: Tham quan Danh thắng Ngũ Hành Sơn & Làng đá mỹ nghệ Non Nước\n\n☀️ 10:00 - 12:30: Mua sắm đặc sản Chả bò Đà Nẵng & Trái cây sấy tại Chợ Cồn\n\n🌇 13:00 - 16:30: Xe tiễn đoàn ra Sân bay Đà Nẵng - Kết thúc chương trình'),
(113, 33, 1, 'Ngày 1: Đón đoàn Đà Nẵng - Bán đảo Sơn Trà - Phố cổ Hội An', '🌅 07:30 - 09:30: Đón đoàn tại Đà Nẵng, nhận phòng nghỉ ngơi\n\n☀️ 10:00 - 12:30: Tham quan Bán đảo Sơn Trà & Thả hoa đăng Phố cổ Hội An\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Mường Thanh Đà Nẵng. Tự do khám phá thành phố về đêm.'),
(114, 33, 2, 'Ngày 2: Đà Nẵng - KDL Bà Nà Hills - Cầu Vàng - Cầu Rồng Phun Nước', '🌅 07:30 - 09:30: Chinh phục Bà Nà Hills bằng cáp treo đạt 4 kỷ lục thế giới\n\n☀️ 10:00 - 12:30: Ngắm Cầu Rồng & Cầu Tình Yêu sông Hàn về đêm\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Mường Thanh Đà Nẵng. Tự do khám phá thành phố về đêm.'),
(115, 33, 3, 'Ngày 3: Đà Nẵng - Đèo Hải Vân - Cố Đô Huế - Đại Nội - Chùa Thiên Mụ', '🌅 07:30 - 09:30: Vượt Đèo Hải Vân thiên hạ đệ nhất hùng quan ra Huế\n\n☀️ 10:00 - 12:30: Tham quan Đại Nội Hoàng Thành Huế & Chùa Thiên Mụ cổ kính\n\n🌇 13:00 - 16:30: Nghe ca trù & Thả hoa đăng trên Sông Hương\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Century Riverside Huế. Tự do khám phá thành phố về đêm.'),
(116, 33, 4, 'Ngày 4: Huế - Quảng Bình - Khám Phá Động Thiên Đường Kỳ Vĩ', '🌅 07:30 - 09:30: Khởi hành ra Quảng Bình qua Thánh địa La Vang\n\n☀️ 10:00 - 12:30: Khám phá Động Thiên Đường - Hoàng cung trong lòng đất\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Mường Thanh Quảng Bình. Tự do khám phá thành phố về đêm.'),
(117, 33, 5, 'Ngày 5: Quảng Bình - Viếng Mộ Đại Tướng - Tiễn Đoàn', '🌅 07:30 - 09:30: Viếng mộ Đại tướng Võ Nguyên Giáp tại Vũng Chùa Đảo Yến\n\n☀️ 10:00 - 12:30: Mua sắm đặc sản Nón lá, Mắm tôm chua Cố Đô & Tiễn sân bay'),
(118, 34, 1, 'Ngày 1: Đón khách Sân bay Phú Quốc - Check-in Grand World', '🌅 07:30 - 09:30: Bay đến Đảo Ngọc Phú Quốc, xe đưa về khách sạn\n\n☀️ 10:00 - 12:30: Khám phá Grand World - Kênh đào Venice & Show Tinh Hoa Việt Nam\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Vinholidays Fiesta Phú Quốc 4★. Tự do khám phá thành phố về đêm.'),
(119, 34, 2, 'Ngày 2: Trải Nghiệm Cáp Treo Hòn Thơm - Bãi Sao - Tự Do Tắm Biển', '🌅 07:30 - 09:30: Đi cáp treo Hòn Thơm vượt biển dài nhất thế giới 7.899m\n\n☀️ 10:00 - 12:30: Vui chơi Công viên nước Aquatopia & Tắm biển Bãi Sao\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Vinholidays Fiesta Phú Quốc 4★. Tự do khám phá thành phố về đêm.'),
(120, 34, 3, 'Ngày 3: Chợ Đêm Dinh Cậu - Bún Quậy Kiến Xây - Tiễn Sân Bay', '🌅 07:30 - 09:30: Thưởng thức Bún quậy Kiến Xây & Mua sắm Rượu sim Phú Quốc\n\n☀️ 10:00 - 12:30: Tham quan Cơ sở nuôi cấy Ngọc Trai cao cấp & Tiễn sân bay'),
(121, 35, 1, 'Ngày 1: Phú Quốc - Vinpearl Safari & VinWonders Đỉnh Cao', '🌅 07:30 - 09:30: Bay đến Phú Quốc, xe riêng đón về Vinpearl Resort 5★\n\n☀️ 10:00 - 12:30: Khám phá Công viên vạn thú bán hoang dã Vinpearl Safari\n\n🌇 13:00 - 16:30: Vui chơi công viên chủ đề VinWonders & Thủy cung Cung Điện Hải Vương\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Vinpearl Resort & Spa Phú Quốc 5★. Tự do khám phá thành phố về đêm.'),
(122, 35, 2, 'Ngày 2: Tour 4 Đảo Cano Cao Tốc - Lặn Ngắm San Hô Bãi Thơm', '🌅 07:30 - 09:30: Cano lướt sóng thăm Hòn Mây Rút, Hòn Mầm Xương & Hòn Gầm Ghì\n\n☀️ 10:00 - 12:30: Chụp hình SUP cá nhân & Lặn ngắm rạn san hô đa sắc màu\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Vinpearl Resort & Spa Phú Quốc 5★. Tự do khám phá thành phố về đêm.'),
(123, 35, 3, 'Ngày 3: Grand World - Thưởng Thức Hải Sản Bãi Trường - Tiễn Sân Bay', '🌅 07:30 - 09:30: Dạo thuyền Gondola phong cách Ý tại Grand World\n\n☀️ 10:00 - 12:30: Tiễn sân bay Phú Quốc chuyến chiều - Kết thúc chuyến nghỉ dưỡng 5★'),
(124, 36, 1, 'Ngày 1: Hà Nội - Vịnh Hạ Long - Động Thiên Cung', '🌅 07:30 - 09:30: Đón đoàn tại Hà Nội khởi hành đi Quảng Ninh\n\n☀️ 10:00 - 12:30: Lên thuyền ngắm Đỉnh Hương, Hòn Gà Chọi & Động Thiên Cung\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Mường Thanh Hạ Long. Tự do khám phá thành phố về đêm.'),
(125, 36, 2, 'Ngày 2: Hạ Long - Tràng An Ninh Bình - Khởi Hành Đi Sapa', '🌅 07:30 - 09:30: Đi thuyền trên dòng sông Sào Khê Quần thể Tràng An\n\n☀️ 10:00 - 12:30: Khởi hành theo đường cao tốc Nội Bài - Lao Cai lên Sapa\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Sapa Horizon. Tự do khám phá thành phố về đêm.'),
(126, 36, 3, 'Ngày 3: Sapa - Chinh Phục Đỉnh Fansipan 3.143m - Bản Cát Cát', '🌅 07:30 - 09:30: Đi Cáp treo chinh phục Nóc nhà Đông Dương Fansipan\n\n☀️ 10:00 - 12:30: Tham quan Bản Cát Cát người H\'Mông & Thác Thủy Điện\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Sapa Horizon. Tự do khám phá thành phố về đêm.'),
(127, 36, 4, 'Ngày 4: Sapa - Moana Sapa Check-in - Trở Về Hà Nội', '🌅 07:30 - 09:30: Check-in điểm sống ảo Moana Sapa & Mua đặc sản thịt trâu gắp bếp\n\n☀️ 10:00 - 12:30: Trở về Hà Nội - Tiễn đoàn tại Sân bay Nội Bài'),
(128, 37, 1, 'Ngày 1: Hà Nội - Vịnh Hạ Long - Du Thuyền 5★ Ambassador Cruise', '🌅 07:30 - 09:30: Xe Limousine đón tại Hà Nội ra Cảng quốc tế Tuần Châu\n\n☀️ 10:00 - 12:30: Check-in Du thuyền 5★ Ambassador Cruise & Thưởng thức Buffet Hải sản\n\n🌇 13:00 - 16:30: Chèo thuyền Kayak ngắm hoàng hôn Vịnh Hạ Long\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Du thuyền 5★ Ambassador Cruise Hạ Long. Tự do khám phá thành phố về đêm.'),
(129, 37, 2, 'Ngày 2: Thăm Hang Sửng Sốt - Đảo TiTop - Ninh Bình Emeralda 5★', '🌅 07:30 - 09:30: Khám phá Hang Sửng Sốt - Hang động rộng đẹp nhất Vịnh\n\n☀️ 10:00 - 12:30: Leo núi ngắm toàn cảnh Vịnh từ đỉnh Đảo TiTop\n\n🌇 13:00 - 16:30: Di chuyển về Ninh Bình, nhận phòng Emeralda Resort 5★\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Emeralda Resort Ninh Bình 5★. Tự do khám phá thành phố về đêm.'),
(130, 37, 3, 'Ngày 3: Ninh Bình - Tuyệt Tình Cốc - Tràng An Đầm Vân Long - Hà Nội', '🌅 07:30 - 09:30: Check-in Tuyệt tình cốc Động Am Tiên Ninh Bình\n\n☀️ 10:00 - 12:30: Đi thuyền sinh thái Đầm Vân Long ngắm Vọoc mông trắng\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 5★ Hotel de l\'Opera Hà Nội. Tự do khám phá thành phố về đêm.'),
(131, 37, 4, 'Ngày 4: Dạo Phố Cổ Hà Nội - Mua Sắm Ô Mai - Tiễn Sân Bay Nội Bài', '🌅 07:30 - 09:30: Dạo chơi Hồ Hoàn Kiếm, Đền Ngọc Sơn & Phố cổ 36 phố phường\n\n☀️ 10:00 - 12:30: Mua sắm ô mai Hàng Đường & Xe Limousine tiễn sân bay Nội Bài'),
(132, 38, 1, 'Ngày 1: Hà Nội - Xe Cao Cấp Đi Sapa - Bản Cát Cát', '🌅 07:30 - 09:30: Đón khách tại Hà Nội đi xe giường nằm lên Sapa\n\n☀️ 10:00 - 12:30: Khám phá Bản Cát Cát, chụp ảnh trang phục dân tộc H\'Mông\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 3★ Sapa Unique. Tự do khám phá thành phố về đêm.'),
(133, 38, 2, 'Ngày 2: Sapa - Cáp Treo Fansipan 3.143m - Thung Lũng Mường Hoa', '🌅 07:30 - 09:30: Chinh phục Đỉnh Fansipan bằng cáp treo & Tàu hỏa mường hoa\n\n☀️ 10:00 - 12:30: Dạo chợ đêm Sapa & Thưởng thức lẩu thắng cố / đồ nướng\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 3★ Sapa Unique. Tự do khám phá thành phố về đêm.'),
(134, 38, 3, 'Ngày 3: Sapa - Nhà Thờ Đá - Trở Về Hà Nội', '🌅 07:30 - 09:30: Check-in Nhà thờ đá cổ Sapa & Mua đặc sản nấm hương, rau mầm\n\n☀️ 10:00 - 12:30: Xe giường nằm đưa khách về Hà Nội - Kết thúc chuyến đi'),
(135, 39, 1, 'Ngày 1: Hà Nội - Viếng Chùa Tam Chúc Hà Nam - Đến Ninh Bình', '🌅 07:30 - 09:30: Đón khách tại Hà Nội khởi hành đi Hà Nam\n\n☀️ 10:00 - 12:30: Đi thuyền du ngoạn Hồ Tam Chúc & Viếng Điện Tam Thế\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ The Readon Ninh Bình. Tự do khám phá thành phố về đêm.'),
(136, 39, 2, 'Ngày 2: Ninh Bình - Khám Phá Quần Thể Di Sản Tràng An', '🌅 07:30 - 09:30: Đi thuyền chèo dọc sông Sào Khê xuyên Hang Sáng, Hang Tối\n\n☀️ 10:00 - 12:30: Check-in Hang Múa ngắm toàn cảnh sông núi Tam Cốc\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ The Readon Ninh Bình. Tự do khám phá thành phố về đêm.'),
(137, 39, 3, 'Ngày 3: Cố Đô Hoa Lư - Chùa Bái Đính - Trở Về Hà Nội', '🌅 07:30 - 09:30: Tham quan Đền Đinh - Lê tại Cố đồ Hoa Lư & Ngôi chùa Bái Đính kỷ lục\n\n☀️ 10:00 - 12:30: Trở về Hà Nội - Mua đặc sản cơm cháy Ninh Bình - Tiễn đoàn'),
(138, 40, 1, 'Ngày 1: Hà Nội - Hà Giang - Cột Mốc Số 0 - Núi Đôi Quản Bạ', '🌅 07:30 - 09:30: Khởi hành từ Hà Nội đi Hà Giang theo QL2\n\n☀️ 10:00 - 12:30: Check-in Cột mốc Số 0 Hà Giang & Ngắm Núi Đôi Quản Bạ\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 3★ Đồng Văn Hoa Cổ. Tự do khám phá thành phố về đêm.'),
(139, 40, 2, 'Ngày 2: Đồng Văn - Đèo Mã Pí Lèng - Đu Thuyền Sông Nho Quế', '🌅 07:30 - 09:30: Chinh phục Đèo Mã Pí Lèng - Một trong tứ đại đỉnh đèo\n\n☀️ 10:00 - 12:30: Đi thuyền trên Sông Nho Quế xanh ngọc & Hẻm Tu Sản\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Homestay Panorama Mèo Vạc. Tự do khám phá thành phố về đêm.'),
(140, 40, 3, 'Ngày 3: Mèo Vạc - Cột Cờ Lũng Cú - Dinh Biệt Thự Vua Mèo', '🌅 07:30 - 09:30: Viếng Cột cờ Lũng Cú - Cực Bắc thiêng liêng của Tổ Quốc\n\n☀️ 10:00 - 12:30: Tham quan Dinh biệt thự Vua Mèo Vương Chính Đức\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 3★ Hà Giang Historic. Tự do khám phá thành phố về đêm.'),
(141, 40, 4, 'Ngày 4: Hà Giang - Thác Tiên Đèo Gió - Trở Về Hà Nội', '🌅 07:30 - 09:30: Ngắm Thác Tiên Đèo Gió nguyên sơ & Mua cam sành Hà Giang\n\n☀️ 10:00 - 12:30: Trở về Hà Nội - Tiễn đoàn an toàn tại Nội Bài'),
(142, 41, 1, 'Ngày 1: Đón Khách Quy Nhơn - Ghềnh Ráng Tiên Sa - Mộ Hàn Mặc Tử', '🌅 07:30 - 09:30: Đón khách tại Sân bay Phù Cát về Quy Nhơn\n\n☀️ 10:00 - 12:30: Tham quan KDL Ghềnh Ráng Tiên Sa, Mộ thi sĩ Hàn Mặc Tử & Bãi Hoàng Hậu\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Anya Quy Nhơn. Tự do khám phá thành phố về đêm.'),
(143, 41, 2, 'Ngày 2: Cano Đảo Kỳ Co - Lặn San Hô - Eo Gió Lung Linh', '🌅 07:30 - 09:30: Cano cao tốc ra Đảo Kỳ Co - Thiên đường Maldives Việt Nam\n\n☀️ 10:00 - 12:30: Lặn ngắm san hô Bãi Rạn & Check-in con đường đi bộ Eo Gió\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Anya Quy Nhơn. Tự do khám phá thành phố về đêm.'),
(144, 41, 3, 'Ngày 3: Khu Sinh Thái Hầm Hồ - Mua Sắm Bánh Ít Lá Gai - Tiễn Đoàn', '🌅 07:30 - 09:30: Đi thuyền chèo KDL Sinh thái Hầm Hồ giữa lòng rừng xanh\n\n☀️ 10:00 - 12:30: Mua đặc sản Bánh ít lá gai, Tré Bình Định - Tiễn sân bay Phù Cát'),
(145, 42, 1, 'Ngày 1: Đón Khách Tuy Hòa Phú Yên - Gành Đá Đĩa - Đầm O Loan', '🌅 07:30 - 09:30: Đón khách tại Phú Yên, thưởng thức Sò huyết Đầm O Loan\n\n☀️ 10:00 - 12:30: Tham quan Gành Đá Đĩa - Kiệt tác tổ tinh thể đá thiên nhiên\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Sala Phú Yên Beach. Tự do khám phá thành phố về đêm.'),
(146, 42, 2, 'Ngày 2: Mũi Điện Cực Đông - Tháp Nghinh Phong - Sang Quy Nhơn', '🌅 07:30 - 09:30: Chinh phục Mũi Điện - Nơi đón ánh bình minh đầu tiên trên đất liền\n\n☀️ 10:00 - 12:30: Check-in Tháp Nghinh Phong biểu tượng mới của Phú Yên\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Seagull Quy Nhơn. Tự do khám phá thành phố về đêm.'),
(147, 42, 3, 'Ngày 3: Quy Nhơn - Đảo Kỳ Co - Eo Gió - Tịnh Xá Ngọc Hòa', '🌅 07:30 - 09:30: Cano vượt biển tắm biển Kỳ Co & Lặn ngắm san hô\n\n☀️ 10:00 - 12:30: Chiêm bái Tượng Phật đôi cao nhất Việt Nam tại Tịnh Xá Ngọc Hòa\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Seagull Quy Nhơn. Tự do khám phá thành phố về đêm.'),
(148, 42, 4, 'Ngày 4: Bảo Tàng Quang Trung - Võ Thuật Tây Sơn - Tiễn Đoàn', '🌅 07:30 - 09:30: Viếng Bảo tàng Quang Trung & Thưởng thức màn biểu diễn Võ thuật Tây Sơn\n\n☀️ 10:00 - 12:30: Tiễn khách tại Sân bay Phù Cát / Bến xe Quy Nhơn'),
(149, 43, 1, 'Ngày 1: TP.HCM - Lâm Đồng - Thám Hiểm Thác Bobla - Đến Đà Lạt', '🌅 07:30 - 09:30: Khởi hành từ TP.HCM theo QL20 lên Cao nguyên Lâm Viên\n\n☀️ 10:00 - 12:30: Khám phá Thác Bobla giữa đại ngàn rừng xanh\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Golf Valley Đà Lạt. Tự do khám phá thành phố về đêm.'),
(150, 43, 2, 'Ngày 2: Đà Lạt - Quảng Trường Lâm Viên - Fairytale Land - Hầm Vang', '🌅 07:30 - 09:30: Check-in Nụ hoa Atiso Quảng trường Lâm Viên & Hồ Xuân Hương\n\n☀️ 10:00 - 12:30: Khám phá Vùng đất cổ tích Fairytale Land & Thử rượu vang Đà Lạt\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Golf Valley Đà Lạt. Tự do khám phá thành phố về đêm.'),
(151, 43, 3, 'Ngày 3: Thung Lũng Tình Yêu - Alpine Coaster Thác Datanla - Chợ Đêm', '🌅 07:30 - 09:30: Trải nghiệm Xe trượt máng Alpine Coaster xuyên rừng Thác Datanla\n\n☀️ 10:00 - 12:30: Tham quan Thung lũng Tình Yêu & Dạo Chợ đêm Đà Lạt\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Golf Valley Đà Lạt. Tự do khám phá thành phố về đêm.'),
(152, 43, 4, 'Ngày 4: Thiền Viện Trúc Lâm - Mua Mứt Đà Lạt - Trở Về TP.HCM', '🌅 07:30 - 09:30: Viếng Thiền viện Trúc Lâm ngắm Hồ Tuyền Lâm xanh biếc\n\n☀️ 10:00 - 12:30: Mua sắm mứt đà lạt & Trở về TP.HCM - Kết thúc chuyến đi'),
(153, 44, 1, 'Ngày 1: Săn Mây Đồi Cầu Đất - Tiệm Cà Phê Trạm Ký Ức', '🌅 07:30 - 09:30: Trải nghiệm Săn mây biển sương Đồi Cầu Đất lúc 05:00 sáng\n\n☀️ 10:00 - 12:30: Thưởng thức cà phê chiều tại Trạm Ký Ức ngắm hoàng hôn Đà Lạt\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 3★ Duparc Đà Lạt. Tự do khám phá thành phố về đêm.'),
(154, 44, 2, 'Ngày 2: KDL Fresh Garden Ngàn Hoa - Trang Trại Cún Puppy Farm', '🌅 07:30 - 09:30: Tham quan Đồi hoa cánh bướm & Cổng trời KDL Fresh Garden\n\n☀️ 10:00 - 12:30: Vui chơi cùng các chú cún dễ thương tại Trang trại Puppy Farm\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 3★ Duparc Đà Lạt. Tự do khám phá thành phố về đêm.'),
(155, 44, 3, 'Ngày 3: Nông Trại Cầu Đất Tea Hill - Vườn Dâu Tây - Tiễn Đoàn', '🌅 07:30 - 09:30: Hái dâu tây sạch tại vườn & Thưởng thức bánh mì xíu mại\n\n☀️ 10:00 - 12:30: Tiễn đoàn về lại TP.HCM / Sân bay Liên Khương'),
(156, 45, 1, 'Ngày 1: Đón Khách - Tàu Đáy Kính Vĩnh Hy - Hang Rái Kỳ Vĩ', '🌅 07:30 - 09:30: Đón khách tại Ninh Thuận đi Vịnh Vĩnh Hy\n\n☀️ 10:00 - 12:30: Đi tàu đáy kính ngắm san hô Vĩnh Hy & Thám hiểm thềm đá Hang Rái\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Vinpearl Condotel Nha Trang. Tự do khám phá thành phố về đêm.'),
(157, 45, 2, 'Ngày 2: Nha Trang - Tour 4 Đảo Vịnh Nha Trang - Tắm Bùn Khoáng', '🌅 07:30 - 09:30: Cano lướt sóng thăm Hòn Mun, Hòn Một & Tắm biển Bãi Tranh\n\n☀️ 10:00 - 12:30: Thư giãn tắm bùn khoáng nóng thiên nhiên Tháp Bà\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Vinpearl Condotel Nha Trang. Tự do khám phá thành phố về đêm.'),
(158, 45, 3, 'Ngày 3: Tháp Bà Ponagar - Chùa Long Sơn - Mua Yến Sào - Tiễn Đoàn', '🌅 07:30 - 09:30: Tham quan Tháp Bà Ponagar kiến trúc Chăm Pa cổ & Chùa Long Sơn\n\n☀️ 10:00 - 12:30: Mua sắm Yến sào Nha Trang, Nem nướng Ninh Hòa - Tiễn sân bay Cam Ranh'),
(159, 46, 1, 'Ngày 1: TP.HCM - Phan Thiết - Tàu Cao Tốc Ra Đảo Phú Quý', '🌅 07:30 - 09:30: Khởi hành từ TP.HCM ra Cảng Phan Thiết\n\n☀️ 10:00 - 12:30: Tàu cao tốc 2.5 tiếng ra Đảo Phú Quý - Check-in Dốc Phượt & Đột Lỗ\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Phú Quý Island Hotel 3★. Tự do khám phá thành phố về đêm.'),
(160, 46, 2, 'Ngày 2: Hòn Tranh - Lặn Ngắm San Hô - Vịnh Triều Dương', '🌅 07:30 - 09:30: Đi ca no nhỏ sang Hòn Tranh tắm biển lặn ngắm san hô\n\n☀️ 10:00 - 12:30: Check-in Vịnh Triều Dương & Ngọn Hải Đăng Cấm ngắm toàn đảo\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Phú Quý Island Hotel 3★. Tự do khám phá thành phố về đêm.'),
(161, 46, 3, 'Ngày 3: Đỉnh Núi Cấm - Gành Hang - Tàu Cao Tốc Về Phan Thiết', '🌅 07:30 - 09:30: Check-in Khe Sung Sướng & Hồ vô cực Gành Hang Phú Quý\n\n☀️ 10:00 - 12:30: Tàu cao tốc về lại bờ - Mua nước mắm Phan Thiết & Thanh Long - Tiễn đoàn'),
(162, 47, 1, 'Ngày 1: TP.HCM - Hồ Tràm - Check-in Resort 5★ The Grand Ho Tram', '🌅 07:30 - 09:30: Đón khách tại TP.HCM đi Bà Rịa Vũng Tàu\n\n☀️ 10:00 - 12:30: Nhận phòng Resort 5★ The Grand Ho Tram Strip & Tắm biển Hồ Tràm\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại The Grand Ho Tram Resort 5★. Tự do khám phá thành phố về đêm.'),
(163, 47, 2, 'Ngày 2: Suối Khoáng Nóng Bình Châu - Trở Về TP.HCM', '🌅 07:30 - 09:30: Ngâm chân nước khoáng nóng thiên nhiên Minera Bình Châu\n\n☀️ 10:00 - 12:30: Mua hải sản tươi sống Chợ hải sản Phước Hải - Trở về TP.HCM'),
(164, 48, 1, 'Ngày 1: Đón Khách Kon Tum - Thị Trấn Sương Mù Măng Đen - Thác Pa Sỹ', '🌅 07:30 - 09:30: Đón đoàn tại Kon Tum khởi hành đi Măng Đen\n\n☀️ 10:00 - 12:30: Tham quan Thác Pa Sỹ nguyên sơ & Chiêm bái Tượng Đức Mẹ Măng Đen\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 3★ Pleiku Hotel. Tự do khám phá thành phố về đêm.'),
(165, 48, 2, 'Ngày 2: Pleiku - Biển Hồ Tơ Nưng - Hàng Cây Trăm Tuổi - Buôn Ma Thuột', '🌅 07:30 - 09:30: Check-in Biển Hồ Tơ Nưng - Đôi mắt Pleiku mơ màng\n\n☀️ 10:00 - 12:30: Dạo bước Hàng cây thông trăm tuổi & Đồi trà Biển Hồ\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Saigon Ban Me. Tự do khám phá thành phố về đêm.'),
(166, 48, 3, 'Ngày 3: Bảo Tàng Thế Giới Cà Phê - Buôn Đôn - Tiễn Đoàn', '🌅 07:30 - 09:30: Tham quan Bảo tàng Thế giới Cà phê kiến trúc nhà dài Tây Nguyên\n\n☀️ 10:00 - 12:30: Thưởng thức Cà phê Trung Nguyên chính hiệu & Tiễn sân bay Buôn Ma Thuột'),
(167, 49, 1, 'Ngày 1: TP.HCM - Mỹ Tho - Đi Xuồng Máy Cồn Phụng Bến Tre - Cần Thơ', '🌅 07:30 - 09:30: Khởi hành từ TP.HCM về Tiền Giang\n\n☀️ 10:00 - 12:30: Đi xuồng máy Cồn Phụng, làm kẹo dừa & nghe Đờn ca tài tử\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ TTC Cần Thơ. Tự do khám phá thành phố về đêm.'),
(168, 49, 2, 'Ngày 2: Chợ Nổi Cái Răng - Điện Gió Bạc Liêu - Đất Mũi Cà Mau', '🌅 07:30 - 09:30: Trải nghiệm Chợ nổi Cái Răng Cần Thơ lúc 05:30 sáng\n\n☀️ 10:00 - 12:30: Tham quan Nhà Công tử Bạc Liêu & Cánh đồng điện gió trên biển\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 3★ Mũi Cà Mau. Tự do khám phá thành phố về đêm.'),
(169, 49, 3, 'Ngày 3: Check-in Cột Mốc Cực Nam Cà Mau - Trở Về TP.HCM', '🌅 07:30 - 09:30: Chụp ảnh Cột mốc tọa độ Quốc gia GPS 0001 tại Đất Mũi Cà Mau\n\n☀️ 10:00 - 12:30: Thưởng thức Cua Cà Mau hấp sả & Xe đưa đoàn về lại TP.HCM'),
(170, 50, 1, 'Ngày 1: TP.HCM - Làng Hoa Sa Đéc Đồng Tháp - Cần Thơ', '🌅 07:30 - 09:30: Khởi hành từ TP.HCM đi Đồng Tháp Mười\n\n☀️ 10:00 - 12:30: Tham quan Làng hoa kiểng Sa Đéc rực rỡ & Nhà cổ Huỳnh Thủy Lê\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 3★ Ninh Kiều Cần Thơ. Tự do khám phá thành phố về đêm.'),
(171, 50, 2, 'Ngày 2: Chợ Nổi Cái Răng - Vườn Trái Cây Phong Điền - Trở Về TP.HCM', '🌅 07:30 - 09:30: Đi tàu chèo khám phá Chợ nổi Cái Răng & Thưởng thức hủ tiếu trên sông\n\n☀️ 10:00 - 12:30: Thăm vườn trái cây Phong Điền hái chôm chôm, nhãn - Trở về TP.HCM'),
(172, 51, 1, 'Ngày 1: TP.HCM - Tòa Thánh Tây Ninh - Sun World Núi Bà Đen - Đỉnh Vân Sơn', '🌅 07:30 - 09:30: 06:00 đón khách tại TP.HCM đi Tây Ninh theo QL22\n\n☀️ 10:00 - 12:30: Viếng Tòa Thánh Tây Ninh - Công trình kiến trúc Cao Đài độc đáo\n\n🌇 13:00 - 16:30: Đi Cáp treo Sun World lên Đỉnh Vân Sơn 986m & Chiêm bái Tượng Phật Bà Đồng 72m\n\n🌙 17:30 - 21:30: Thưởng thức đại tiệc Buffet Năm Châu 80+ món ngon & Xe tiễn về TP.HCM lúc 17:00'),
(173, 52, 1, 'Ngày 1: Đón Đoàn Phú Yên - Gành Đá Đĩa - Mũi Điện - Quy Nhơn', '🌅 07:30 - 09:30: Đón đoàn tại Phú Yên, nhận phòng khách sạn\n\n☀️ 10:00 - 12:30: Tham quan Gành Đá Đĩa & Check-in Mũi Điện cực Đông\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Sala Phú Yên Beach. Tự do khám phá thành phố về đêm.'),
(174, 52, 2, 'Ngày 2: Quy Nhơn - Kỳ Co - Eo Gió - Hành Trình Ra Phố Cổ Hội An', '🌅 07:30 - 09:30: Cano đi đảo Kỳ Co tắm biển & Ngắm cảnh Eo Gió\n\n☀️ 10:00 - 12:30: Di chuyển ra Hội An, tự do dạo phố cổ thắp đèn lồng\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Phố Cổ Hội An. Tự do khám phá thành phố về đêm.'),
(175, 52, 3, 'Ngày 3: Hội An - Đà Nẵng - Bà Nà Hills - Cầu Vàng', '🌅 07:30 - 09:30: Đi cáp treo Bà Nà Hills & Check-in Cầu Vàng nổi tiếng thế giới\n\n☀️ 10:00 - 12:30: Tối thưởng thức hải sản biển Mỹ Khê Đà Nẵng\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Sala Đà Nẵng Beach. Tự do khám phá thành phố về đêm.'),
(176, 52, 4, 'Ngày 4: Đà Nẵng - Cố Đô Huế - Đại Nội Hoàng Thành', '🌅 07:30 - 09:30: Xuyên Hầm Hải Vân ra Cố đồ Huế\n\n☀️ 10:00 - 12:30: Khám phá Đại Nội Hoàng Thành Huế, Chùa Thiên Mụ & Thưởng thức Ca Trù sông Hương\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Century Riverside Huế. Tự do khám phá thành phố về đêm.'),
(177, 52, 5, 'Ngày 5: Huế - Quảng Bình - Tham Quan Động Thiên Đường', '🌅 07:30 - 09:30: Khám phá Động Thiên Đường kỳ vĩ trong Quần thể Phong Nha Kẻ Bàng\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Mường Thanh Quảng Bình. Tự do khám phá thành phố về đêm.'),
(178, 52, 6, 'Ngày 6: Vũng Chùa Đảo Yến - Viếng Mộ Đại Tướng - Trở Về Huế', '🌅 07:30 - 09:30: Viếng mộ Đại tướng Võ Nguyên Giáp & Trở về Huế nghỉ đêm\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Century Riverside Huế. Tự do khám phá thành phố về đêm.'),
(179, 52, 7, 'Ngày 7: Lăng Khải Định - Chợ Đông Ba - Nghỉ Đêm Đà Nẵng', '🌅 07:30 - 09:30: Tham quan Lăng Khải Định kiến trúc Á - Âu tinh xảo & Mua sắm Chợ Đông Ba\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Khách sạn 4★ Sala Đà Nẵng Beach. Tự do khám phá thành phố về đêm.'),
(180, 52, 8, 'Ngày 8: Ngũ Hành Sơn - Mua Sắm Đặc Sản - Tiễn Sân Bay Đà Nẵng', '🌅 07:30 - 09:30: Tham quan Ngũ Hành Sơn & Tiễn khách ra Sân bay Đà Nẵng an toàn'),
(181, 27, 1, 'Ngày 1: Hồ Chí Minh - Đà Lạt', '🌅 07:30 - 09:30: Di chuyển từ Hồ Chí Minh đến Đà Lạt\n\n☀️ 10:00 - 12:30: Đến khách sạn nhận phòng\n\n🌇 13:00 - 16:30: Tham quan Đỉnh Langbiang\n\n🌙 17:30 - 21:30: Tham quan Thác Datanla\n\n📌 20:00 - 22:00: Tham quan Vườn thú Zoodoo\n\n📌 23:00 - 25:00: Dùng bữa tối tại nhà hàng\n\n📌 26:00 - 28:00: Tham quan Chợ Đêm Âm Phủ\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Phòng Superior (hoặc tương đương). Tự do khám phá thành phố về đêm.'),
(182, 27, 2, 'Ngày 2: Đà Lạt - Nha Trang', '🌅 07:30 - 09:30: Tham quan Samten Hills Dalat\n\n☀️ 10:00 - 12:30: Di chuyển từ Đà Lạt đến Nha Trang\n\n🌇 13:00 - 16:30: Đến khách sạn nhận phòng\n\n🌙 17:30 - 21:30: Tự do tắm biển / Nghỉ ngơi\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Phòng Standard Hướng Phố (hoặc tương đương). Tự do khám phá thành phố về đêm.'),
(183, 27, 3, 'Ngày 3: Nha Trang - Thành phố biển', '🌅 07:30 - 09:30: Khởi hành tham quan tại Nha Trang\n\n☀️ 10:00 - 12:30: Tham quan VinWonders Nha Trang\n\n🌇 13:00 - 16:30: Tham quan Lặn biển Hòn Mun\n\n🌙 17:30 - 21:30: Tham quan Tháp Bà Ponagar\n\n📌 20:00 - 22:00: Tham quan Tắm bùn khoáng I-Resort\n\n📌 23:00 - 25:00: Tự do tắm biển / Nghỉ ngơi\n\n📌 26:00 - 28:00: Dùng bữa tối tại nhà hàng\n\n📌 29:00 - 31:00: Tham quan Chợ Đêm Nha Trang\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Phòng Standard Hướng Phố (hoặc tương đương). Tự do khám phá thành phố về đêm.'),
(184, 27, 4, 'Ngày 4: Nha Trang - Hồ Chí Minh', '🌅 07:30 - 09:30: Tham quan Hải sản Thanh Sương\n\n☀️ 10:00 - 12:30: Tham quan Nem nướng Đặng Văn Quyên\n\n🌇 13:00 - 16:30: Mua sắm đặc sản & Trả khách\n\n🌙 17:30 - 21:30: Khởi hành về Hồ Chí Minh'),
(185, 29, 1, 'Ngày 1: Hồ Chí Minh - Đà Lạt', '🌅 07:30 - 09:30: Di chuyển từ Hồ Chí Minh đến Đà Lạt\n\n☀️ 10:00 - 12:30: Đến khách sạn nhận phòng\n\n🌇 13:00 - 16:30: Tham quan Đỉnh Langbiang\n\n🌙 17:30 - 21:30: Tham quan Vườn thú Zoodoo\n\n📌 20:00 - 22:00: Tham quan Thác Datanla\n\n📌 23:00 - 25:00: Dùng bữa tối tại nhà hàng\n\n📌 26:00 - 28:00: Tham quan Chợ Đêm Âm Phủ\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Phòng Superior (hoặc tương đương). Tự do khám phá thành phố về đêm.'),
(186, 29, 2, 'Ngày 2: Đà Lạt - Nha Trang', '🌅 07:30 - 09:30: Tham quan Samten Hills Dalat\n\n☀️ 10:00 - 12:30: Di chuyển từ Đà Lạt đến Nha Trang\n\n🌇 13:00 - 16:30: Đến khách sạn nhận phòng\n\n🌙 17:30 - 21:30: Tham quan Lặn biển Hòn Mun\n\n📌 20:00 - 22:00: Tự do tắm biển / Nghỉ ngơi\n\n📌 23:00 - 25:00: Dùng bữa tối tại nhà hàng\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Phòng Standard Hướng Phố (hoặc tương đương). Tự do khám phá thành phố về đêm.'),
(187, 29, 3, 'Ngày 3: Nha Trang - Thành phố biển', '🌅 07:30 - 09:30: Khởi hành tham quan tại Nha Trang\n\n☀️ 10:00 - 12:30: Tham quan VinWonders Nha Trang\n\n🌇 13:00 - 16:30: Tham quan Tháp Bà Ponagar\n\n🌙 17:30 - 21:30: Tham quan Tắm bùn khoáng I-Resort\n\n📌 20:00 - 22:00: Tham quan Nem nướng Đặng Văn Quyên\n\n📌 23:00 - 25:00: Tự do tắm biển / Nghỉ ngơi\n\n📌 26:00 - 28:00: Dùng bữa tối tại nhà hàng\n\n📌 29:00 - 31:00: Tham quan Chợ Đêm Nha Trang\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Phòng Standard Hướng Phố (hoặc tương đương). Tự do khám phá thành phố về đêm.'),
(188, 29, 4, 'Ngày 4: Nha Trang - Hồ Chí Minh', '🌅 07:30 - 09:30: Tham quan Hải sản Thanh Sương\n\n☀️ 10:00 - 12:30: Mua sắm đặc sản & Trả khách\n\n🌇 13:00 - 16:30: Khởi hành về Hồ Chí Minh'),
(189, 31, 1, 'Ngày 1: Hồ Chí Minh - Phú Quốc', '🌅 07:30 - 09:30: Bay đến Phú Quốc\n\n☀️ 10:00 - 12:30: Tham quan Sun World Hòn Thơm\n\n🌇 13:00 - 16:30: Tham quan Chợ đêm Dinh Cậu\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Emerald Bay View (JW Marriott). Tự do khám phá thành phố về đêm.'),
(190, 31, 2, 'Ngày 2: Phú Quốc - Tuyệt tác thiên nhiên', '🌅 07:30 - 09:30: Tham quan Vinpearl Safari Phú Quốc\n\n☀️ 10:00 - 12:30: Tham quan Grand World Phú Quốc\n\n🌇 13:00 - 16:30: Tham quan Bãi Sao\n\n🏨 Nghỉ đêm: Đoàn nhận phòng và nghỉ ngơi tại Emerald Bay View (JW Marriott). Tự do khám phá thành phố về đêm.'),
(191, 31, 3, 'Ngày 3: Phú Quốc - Hồ Chí Minh', '🌅 07:30 - 09:30: Tham quan Bún quậy Kiến Xây\n\n☀️ 10:00 - 12:30: Khởi hành về Hồ Chí Minh');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `itinerary_activities`
--

CREATE TABLE `itinerary_activities` (
  `activity_id` int(11) NOT NULL,
  `itinerary_id` int(11) NOT NULL,
  `activity_type` enum('Place','Accommodation','Transport','Meal','FreeTime') NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `order_index` int(11) DEFAULT 1,
  `note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `itinerary_activities`
--

INSERT INTO `itinerary_activities` (`activity_id`, `itinerary_id`, `activity_type`, `reference_id`, `start_time`, `end_time`, `order_index`, `note`) VALUES
(25, 110, 'Place', 1, '08:00:00', NULL, 1, NULL),
(26, 110, 'Place', 1, '08:00:00', NULL, 2, NULL),
(27, 110, 'Place', 1, '08:00:00', NULL, 3, NULL),
(28, 111, 'Place', 1, '08:00:00', NULL, 1, NULL),
(29, 111, 'Place', 1, '08:00:00', NULL, 2, NULL),
(30, 111, 'Place', 1, '08:00:00', NULL, 3, NULL),
(31, 112, 'Place', 1, '08:00:00', NULL, 1, NULL),
(32, 112, 'Place', 1, '08:00:00', NULL, 2, NULL),
(33, 112, 'Place', 1, '08:00:00', NULL, 3, NULL),
(34, 113, 'Place', 1, '08:00:00', NULL, 1, NULL),
(35, 113, 'Place', 1, '08:00:00', NULL, 2, NULL),
(36, 114, 'Place', 1, '08:00:00', NULL, 1, NULL),
(37, 114, 'Place', 1, '08:00:00', NULL, 2, NULL),
(38, 115, 'Place', 1, '08:00:00', NULL, 1, NULL),
(39, 115, 'Place', 1, '08:00:00', NULL, 2, NULL),
(40, 115, 'Place', 1, '08:00:00', NULL, 3, NULL),
(41, 116, 'Place', 1, '08:00:00', NULL, 1, NULL),
(42, 116, 'Place', 1, '08:00:00', NULL, 2, NULL),
(43, 117, 'Place', 1, '08:00:00', NULL, 1, NULL),
(44, 117, 'Place', 1, '08:00:00', NULL, 2, NULL),
(45, 118, 'Place', 1, '08:00:00', NULL, 1, NULL),
(46, 118, 'Place', 1, '08:00:00', NULL, 2, NULL),
(47, 119, 'Place', 1, '08:00:00', NULL, 1, NULL),
(48, 119, 'Place', 1, '08:00:00', NULL, 2, NULL),
(49, 120, 'Place', 1, '08:00:00', NULL, 1, NULL),
(50, 120, 'Place', 1, '08:00:00', NULL, 2, NULL),
(51, 121, 'Place', 1, '08:00:00', NULL, 1, NULL),
(52, 121, 'Place', 1, '08:00:00', NULL, 2, NULL),
(53, 121, 'Place', 1, '08:00:00', NULL, 3, NULL),
(54, 122, 'Place', 1, '08:00:00', NULL, 1, NULL),
(55, 122, 'Place', 1, '08:00:00', NULL, 2, NULL),
(56, 123, 'Place', 1, '08:00:00', NULL, 1, NULL),
(57, 123, 'Place', 1, '08:00:00', NULL, 2, NULL),
(58, 124, 'Place', 1, '08:00:00', NULL, 1, NULL),
(59, 124, 'Place', 1, '08:00:00', NULL, 2, NULL),
(60, 125, 'Place', 1, '08:00:00', NULL, 1, NULL),
(61, 125, 'Place', 1, '08:00:00', NULL, 2, NULL),
(62, 126, 'Place', 1, '08:00:00', NULL, 1, NULL),
(63, 126, 'Place', 1, '08:00:00', NULL, 2, NULL),
(64, 127, 'Place', 1, '08:00:00', NULL, 1, NULL),
(65, 127, 'Place', 1, '08:00:00', NULL, 2, NULL),
(66, 128, 'Place', 1, '08:00:00', NULL, 1, NULL),
(67, 128, 'Place', 1, '08:00:00', NULL, 2, NULL),
(68, 128, 'Place', 1, '08:00:00', NULL, 3, NULL),
(69, 129, 'Place', 1, '08:00:00', NULL, 1, NULL),
(70, 129, 'Place', 1, '08:00:00', NULL, 2, NULL),
(71, 129, 'Place', 1, '08:00:00', NULL, 3, NULL),
(72, 130, 'Place', 1, '08:00:00', NULL, 1, NULL),
(73, 130, 'Place', 1, '08:00:00', NULL, 2, NULL),
(74, 131, 'Place', 1, '08:00:00', NULL, 1, NULL),
(75, 131, 'Place', 1, '08:00:00', NULL, 2, NULL),
(76, 132, 'Place', 1, '08:00:00', NULL, 1, NULL),
(77, 132, 'Place', 1, '08:00:00', NULL, 2, NULL),
(78, 133, 'Place', 1, '08:00:00', NULL, 1, NULL),
(79, 133, 'Place', 1, '08:00:00', NULL, 2, NULL),
(80, 134, 'Place', 1, '08:00:00', NULL, 1, NULL),
(81, 134, 'Place', 1, '08:00:00', NULL, 2, NULL),
(82, 135, 'Place', 1, '08:00:00', NULL, 1, NULL),
(83, 135, 'Place', 1, '08:00:00', NULL, 2, NULL),
(84, 136, 'Place', 1, '08:00:00', NULL, 1, NULL),
(85, 136, 'Place', 1, '08:00:00', NULL, 2, NULL),
(86, 137, 'Place', 1, '08:00:00', NULL, 1, NULL),
(87, 137, 'Place', 1, '08:00:00', NULL, 2, NULL),
(88, 138, 'Place', 1, '08:00:00', NULL, 1, NULL),
(89, 138, 'Place', 1, '08:00:00', NULL, 2, NULL),
(90, 139, 'Place', 1, '08:00:00', NULL, 1, NULL),
(91, 139, 'Place', 1, '08:00:00', NULL, 2, NULL),
(92, 140, 'Place', 1, '08:00:00', NULL, 1, NULL),
(93, 140, 'Place', 1, '08:00:00', NULL, 2, NULL),
(94, 141, 'Place', 1, '08:00:00', NULL, 1, NULL),
(95, 141, 'Place', 1, '08:00:00', NULL, 2, NULL),
(96, 142, 'Place', 1, '08:00:00', NULL, 1, NULL),
(97, 142, 'Place', 1, '08:00:00', NULL, 2, NULL),
(98, 143, 'Place', 1, '08:00:00', NULL, 1, NULL),
(99, 143, 'Place', 1, '08:00:00', NULL, 2, NULL),
(100, 144, 'Place', 1, '08:00:00', NULL, 1, NULL),
(101, 144, 'Place', 1, '08:00:00', NULL, 2, NULL),
(102, 145, 'Place', 1, '08:00:00', NULL, 1, NULL),
(103, 145, 'Place', 1, '08:00:00', NULL, 2, NULL),
(104, 146, 'Place', 1, '08:00:00', NULL, 1, NULL),
(105, 146, 'Place', 1, '08:00:00', NULL, 2, NULL),
(106, 147, 'Place', 1, '08:00:00', NULL, 1, NULL),
(107, 147, 'Place', 1, '08:00:00', NULL, 2, NULL),
(108, 148, 'Place', 1, '08:00:00', NULL, 1, NULL),
(109, 148, 'Place', 1, '08:00:00', NULL, 2, NULL),
(110, 149, 'Place', 1, '08:00:00', NULL, 1, NULL),
(111, 149, 'Place', 1, '08:00:00', NULL, 2, NULL),
(112, 150, 'Place', 1, '08:00:00', NULL, 1, NULL),
(113, 150, 'Place', 1, '08:00:00', NULL, 2, NULL),
(114, 151, 'Place', 1, '08:00:00', NULL, 1, NULL),
(115, 151, 'Place', 1, '08:00:00', NULL, 2, NULL),
(116, 152, 'Place', 1, '08:00:00', NULL, 1, NULL),
(117, 152, 'Place', 1, '08:00:00', NULL, 2, NULL),
(118, 153, 'Place', 1, '08:00:00', NULL, 1, NULL),
(119, 153, 'Place', 1, '08:00:00', NULL, 2, NULL),
(120, 154, 'Place', 1, '08:00:00', NULL, 1, NULL),
(121, 154, 'Place', 1, '08:00:00', NULL, 2, NULL),
(122, 155, 'Place', 1, '08:00:00', NULL, 1, NULL),
(123, 155, 'Place', 1, '08:00:00', NULL, 2, NULL),
(124, 156, 'Place', 1, '08:00:00', NULL, 1, NULL),
(125, 156, 'Place', 1, '08:00:00', NULL, 2, NULL),
(126, 157, 'Place', 1, '08:00:00', NULL, 1, NULL),
(127, 157, 'Place', 1, '08:00:00', NULL, 2, NULL),
(128, 158, 'Place', 1, '08:00:00', NULL, 1, NULL),
(129, 158, 'Place', 1, '08:00:00', NULL, 2, NULL),
(130, 159, 'Place', 1, '08:00:00', NULL, 1, NULL),
(131, 159, 'Place', 1, '08:00:00', NULL, 2, NULL),
(132, 160, 'Place', 1, '08:00:00', NULL, 1, NULL),
(133, 160, 'Place', 1, '08:00:00', NULL, 2, NULL),
(134, 161, 'Place', 1, '08:00:00', NULL, 1, NULL),
(135, 161, 'Place', 1, '08:00:00', NULL, 2, NULL),
(136, 162, 'Place', 1, '08:00:00', NULL, 1, NULL),
(137, 162, 'Place', 1, '08:00:00', NULL, 2, NULL),
(138, 163, 'Place', 1, '08:00:00', NULL, 1, NULL),
(139, 163, 'Place', 1, '08:00:00', NULL, 2, NULL),
(140, 164, 'Place', 1, '08:00:00', NULL, 1, NULL),
(141, 164, 'Place', 1, '08:00:00', NULL, 2, NULL),
(142, 165, 'Place', 1, '08:00:00', NULL, 1, NULL),
(143, 165, 'Place', 1, '08:00:00', NULL, 2, NULL),
(144, 166, 'Place', 1, '08:00:00', NULL, 1, NULL),
(145, 166, 'Place', 1, '08:00:00', NULL, 2, NULL),
(146, 167, 'Place', 1, '08:00:00', NULL, 1, NULL),
(147, 167, 'Place', 1, '08:00:00', NULL, 2, NULL),
(148, 168, 'Place', 1, '08:00:00', NULL, 1, NULL),
(149, 168, 'Place', 1, '08:00:00', NULL, 2, NULL),
(150, 169, 'Place', 1, '08:00:00', NULL, 1, NULL),
(151, 169, 'Place', 1, '08:00:00', NULL, 2, NULL),
(152, 170, 'Place', 1, '08:00:00', NULL, 1, NULL),
(153, 170, 'Place', 1, '08:00:00', NULL, 2, NULL),
(154, 171, 'Place', 1, '08:00:00', NULL, 1, NULL),
(155, 171, 'Place', 1, '08:00:00', NULL, 2, NULL),
(156, 172, 'Place', 1, '08:00:00', NULL, 1, NULL),
(157, 172, 'Place', 1, '08:00:00', NULL, 2, NULL),
(158, 172, 'Place', 1, '08:00:00', NULL, 3, NULL),
(159, 172, 'Place', 1, '08:00:00', NULL, 4, NULL),
(160, 173, 'Place', 1, '08:00:00', NULL, 1, NULL),
(161, 173, 'Place', 1, '08:00:00', NULL, 2, NULL),
(162, 174, 'Place', 1, '08:00:00', NULL, 1, NULL),
(163, 174, 'Place', 1, '08:00:00', NULL, 2, NULL),
(164, 175, 'Place', 1, '08:00:00', NULL, 1, NULL),
(165, 175, 'Place', 1, '08:00:00', NULL, 2, NULL),
(166, 176, 'Place', 1, '08:00:00', NULL, 1, NULL),
(167, 176, 'Place', 1, '08:00:00', NULL, 2, NULL),
(168, 177, 'Place', 1, '08:00:00', NULL, 1, NULL),
(169, 178, 'Place', 1, '08:00:00', NULL, 1, NULL),
(170, 179, 'Place', 1, '08:00:00', NULL, 1, NULL),
(171, 180, 'Place', 1, '08:00:00', NULL, 1, NULL),
(172, 181, 'Place', 1, '08:00:00', NULL, 1, NULL),
(173, 182, 'Place', 1, '08:00:00', NULL, 1, NULL),
(174, 183, 'Place', 1, '08:00:00', NULL, 1, NULL),
(175, 184, 'Place', 1, '08:00:00', NULL, 1, NULL),
(176, 185, 'Place', 1, '08:00:00', NULL, 1, NULL),
(177, 186, 'Place', 1, '08:00:00', NULL, 1, NULL),
(178, 187, 'Place', 1, '08:00:00', NULL, 1, NULL),
(179, 188, 'Place', 1, '08:00:00', NULL, 1, NULL),
(180, 189, 'Place', 1, '08:00:00', NULL, 1, NULL),
(181, 190, 'Place', 1, '08:00:00', NULL, 1, NULL),
(182, 191, 'Place', 1, '08:00:00', NULL, 1, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `itinerary_places`
--

CREATE TABLE `itinerary_places` (
  `id` int(11) NOT NULL,
  `itinerary_id` int(11) NOT NULL COMMENT 'Liên kết với ngày cụ thể trong bảng itineraries',
  `place_id` int(11) NOT NULL COMMENT 'Liên kết với địa điểm trong bảng places',
  `visit_order` int(11) DEFAULT 1 COMMENT 'Thứ tự tham quan trong ngày',
  `visit_time` time DEFAULT NULL COMMENT 'Giờ dự kiến (VD: 08:30:00)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `leave_requests`
--

CREATE TABLE `leave_requests` (
  `request_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `request_type` enum('Future_Leave','Past_Explanation') NOT NULL DEFAULT 'Future_Leave',
  `leave_type` varchar(100) DEFAULT NULL,
  `explanation_type` varchar(100) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `target_date` date DEFAULT NULL,
  `proposed_check_in` time DEFAULT NULL,
  `proposed_check_out` time DEFAULT NULL,
  `reason` text NOT NULL,
  `attachment_url` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `manager_id` int(11) DEFAULT NULL,
  `manager_note` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `leave_requests`
--

INSERT INTO `leave_requests` (`request_id`, `employee_id`, `request_type`, `leave_type`, `explanation_type`, `start_date`, `end_date`, `target_date`, `proposed_check_in`, `proposed_check_out`, `reason`, `attachment_url`, `status`, `manager_id`, `manager_note`, `created_at`, `updated_at`) VALUES
(1, 4, 'Past_Explanation', NULL, 'Quên Check-in', NULL, NULL, '2026-08-24', '08:00:00', '17:00:00', 'Giải trình test quên check in', NULL, 'Approved', 2, NULL, '2026-08-31 23:48:31', '2026-08-31 23:52:14'),
(3, 4, 'Future_Leave', 'Nghỉ ốm', NULL, '2026-09-17', '2026-09-17', NULL, NULL, NULL, 'sdfdf', NULL, 'Pending', NULL, NULL, '2026-08-31 23:49:13', '2026-08-31 23:49:13');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `content`, `is_read`, `created_at`) VALUES
(1, 7, 'Chào mừng', 'Xin chào', 0, '2026-06-20 17:53:18');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `partners`
--

CREATE TABLE `partners` (
  `partner_id` int(11) NOT NULL,
  `destination_id` int(11) DEFAULT NULL,
  `partner_name` varchar(255) DEFAULT NULL,
  `partner_type` enum('Hotel','Restaurant','Transport','Other') DEFAULT NULL,
  `contact_name` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `partners`
--

INSERT INTO `partners` (`partner_id`, `destination_id`, `partner_name`, `partner_type`, `contact_name`, `phone`, `email`, `address`, `status`) VALUES
(1, NULL, 'Vietnam Airlines', 'Transport', 'Tổng đài VNA', '19001100', NULL, NULL, 'Active'),
(2, NULL, 'Nhà xe Phương Trang (FUTA)', 'Transport', 'Mr. Hùng CSKH', '19006067', NULL, NULL, 'Active'),
(3, NULL, 'Công ty Xe Lữ Hành Toàn Quốc', 'Transport', 'Mr. Tuấn Điều hành', '0988111222', NULL, NULL, 'Active'),
(4, 1, 'Vinpearl Resort & Spa Nha Trang', 'Hotel', NULL, NULL, NULL, 'Đảo Hòn Tre, Nha Trang', 'Active'),
(5, 1, 'Khách sạn Mường Thanh Luxury', 'Hotel', NULL, NULL, 'partner.muongthanh@travel.com', '60 Trần Phú, Nha Trang', 'Active'),
(6, 2, 'Hôtel Colline Đà Lạt', 'Hotel', NULL, NULL, NULL, '10 Phan Bội Châu, Đà Lạt', 'Active'),
(7, 2, 'Ana Mandara Villas Dalat', 'Hotel', NULL, NULL, NULL, 'Lê Lai, Phường 5, Đà Lạt', 'Active'),
(8, 3, 'JW Marriott Phu Quoc', 'Hotel', NULL, NULL, NULL, 'Bãi Khem, Phú Quốc', 'Active'),
(9, 5, 'Mường Thanh Đà Nẵng', '', 'Quản lý', '0900000000', 'muongthanh_dn@gmail.com', NULL, 'Active'),
(10, 1, 'Vinpearl Resort Nha Trang', '', 'Quản lý', '0900000000', 'vinpearl_nt@gmail.com', NULL, 'Active'),
(11, NULL, 'Nhà Xe Hoàng Long Toàn Quốc', 'Transport', 'Quản lý', '0900000000', 'hoanglong_trans@gmail.com', NULL, 'Active');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `partner_services`
--

CREATE TABLE `partner_services` (
  `partner_service_id` int(11) NOT NULL,
  `partner_id` int(11) DEFAULT NULL,
  `service_id` int(11) DEFAULT NULL,
  `unit_price` decimal(15,2) DEFAULT NULL,
  `available_quantity` int(11) DEFAULT NULL,
  `status` enum('Active','Inactive','Pending') DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `partner_services`
--

INSERT INTO `partner_services` (`partner_service_id`, `partner_id`, `service_id`, `unit_price`, `available_quantity`, `status`) VALUES
(1, 9, 12, 1200000.00, 50, 'Active'),
(2, 10, 13, 2200000.00, 30, 'Active'),
(3, 11, 14, 1000000.00, 10, 'Active'),
(4, 11, 15, 1800000.00, 5, 'Active'),
(6, 10, 20, 4000000.00, 3, 'Active'),
(7, 10, 21, 3000000.00, 2, 'Pending');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `amount` decimal(15,2) DEFAULT NULL,
  `transaction_code` varchar(255) DEFAULT NULL,
  `payment_status` enum('Pending','Success','Failed') DEFAULT 'Pending',
  `paid_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payroll`
--

CREATE TABLE `payroll` (
  `payroll_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `salary_month` varchar(7) NOT NULL,
  `base_salary` decimal(12,2) NOT NULL DEFAULT 8000000.00,
  `working_days` decimal(4,1) NOT NULL DEFAULT 0.0,
  `allowance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `bonus` decimal(12,2) NOT NULL DEFAULT 0.00,
  `deductions` decimal(12,2) NOT NULL DEFAULT 0.00,
  `net_salary` decimal(12,2) NOT NULL,
  `status` enum('Draft','Calculated','Paid') DEFAULT 'Draft',
  `payment_date` date DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `performance_reviews`
--

CREATE TABLE `performance_reviews` (
  `performance_id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `reviewer_id` int(11) DEFAULT NULL,
  `score` int(11) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `review_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `performance_reviews`
--

INSERT INTO `performance_reviews` (`performance_id`, `employee_id`, `reviewer_id`, `score`, `comment`, `review_date`) VALUES
(1, 4, 2, 90, 'Hoàn thành tốt', '2026-06-01'),
(2, 4, 2, 30, 'ttfr', '2026-08-09');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `places`
--

CREATE TABLE `places` (
  `place_id` int(11) NOT NULL,
  `destination_id` int(11) DEFAULT NULL,
  `partner_id` int(11) DEFAULT NULL,
  `place_name` varchar(255) NOT NULL COMMENT 'Tên địa điểm / Quán ăn',
  `category` enum('Tham quan','Ăn uống','Vui chơi','Mua sắm','Nghỉ dưỡng') NOT NULL,
  `description` text DEFAULT NULL,
  `estimated_price` decimal(15,2) DEFAULT 0.00 COMMENT 'Giá vé/Chi phí tham khảo (0 nếu miễn phí)',
  `image_url` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `action_verb` varchar(50) DEFAULT NULL,
  `short_display_name` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `places`
--

INSERT INTO `places` (`place_id`, `destination_id`, `partner_id`, `place_name`, `category`, `description`, `estimated_price`, `image_url`, `status`, `action_verb`, `short_display_name`) VALUES
(1, 1, NULL, 'VinWonders Nha Trang', 'Vui chơi', 'Khu giải trí đẳng cấp quốc tế trên đảo Hòn Tre, bao gồm cáp treo vượt biển và công viên nước.', 880000.00, 'vinwonders-nt.jpg', 'Active', NULL, 'VinWonders Nha Trang'),
(2, 1, NULL, 'Tháp Bà Ponagar', 'Tham quan', 'Quần thể đền tháp Chăm Pa cổ kính, nơi lưu giữ giá trị văn hóa lịch sử độc đáo.', 30000.00, 'thap-ba-nt.jpg', 'Active', NULL, 'Tháp Bà Ponagar'),
(3, 1, NULL, 'Lặn biển Hòn Mun', 'Vui chơi', 'Khu bảo tồn biển với rạn san hô tuyệt đẹp, thích hợp cho lặn bình dưỡng khí.', 500000.00, 'hon-mun-nt.jpg', 'Active', NULL, 'Lặn biển Hòn Mun'),
(4, 1, NULL, 'Tắm bùn khoáng I-Resort', 'Nghỉ dưỡng', 'Khu nghỉ dưỡng suối khoáng nóng, dịch vụ tắm bùn chăm sóc sức khỏe.', 350000.00, 'iresort-nt.jpg', 'Active', NULL, 'Tắm bùn khoáng I-Resort'),
(5, 1, NULL, 'Nem nướng Đặng Văn Quyên', 'Ăn uống', 'Đặc sản nem nướng nổi tiếng nhất Nha Trang.', 60000.00, 'nem-nuong-nt.jpg', 'Active', NULL, 'Nem nướng Đặng Văn Quyên'),
(6, 1, NULL, 'Chợ Đêm Nha Trang', 'Mua sắm', 'Khu phố đi bộ sầm uất về đêm, bán đồ lưu niệm và các món ăn đường phố.', 0.00, 'cho-dem-nt.jpg', 'Active', NULL, 'Chợ Đêm Nha Trang'),
(7, 1, NULL, 'Hải sản Thanh Sương', 'Ăn uống', 'Quán hải sản tươi sống bình dân, chế biến tại chỗ.', 250000.00, 'haisan-nt.jpg', 'Active', NULL, 'Hải sản Thanh Sương'),
(8, 2, NULL, 'Đỉnh Langbiang', 'Tham quan', 'Nóc nhà của Đà Lạt, trải nghiệm đi xe Jeep lên đỉnh ngắm toàn cảnh thành phố.', 120000.00, 'langbiang-dl.jpg', 'Active', NULL, 'Đỉnh Langbiang'),
(9, 2, NULL, 'Thác Datanla', 'Vui chơi', 'Hệ thống máng trượt xuyên rừng thông dài nhất Đông Nam Á.', 170000.00, 'datanla-dl.jpg', 'Active', NULL, 'Thác Datanla'),
(10, 2, NULL, 'Vườn thú Zoodoo', 'Tham quan', 'Mô hình sở thú thân thiện mang phong cách Úc, thích hợp cho gia đình có trẻ nhỏ.', 100000.00, 'zoodoo-dl.jpg', 'Active', NULL, 'Vườn thú Zoodoo'),
(11, 2, NULL, 'Lẩu bò Ba Toa Quán Gỗ', 'Ăn uống', 'Quán lẩu bò mộc mạc lâu đời, hương vị đậm đà xua tan cái lạnh Đà Lạt.', 200000.00, 'laubo-dl.jpg', 'Active', NULL, 'Lẩu bò Ba Toa Quán Gỗ'),
(12, 2, NULL, 'Lẩu gà lá é Tao Ngộ', 'Ăn uống', 'Đặc sản lẩu gà nấm kết hợp với vị cay nồng của lá é.', 150000.00, 'lauga-dl.jpg', 'Active', NULL, 'Lẩu gà lá é Tao Ngộ'),
(13, 2, NULL, 'Chợ Đêm Âm Phủ', 'Mua sắm', 'Thiên đường đồ len và ẩm thực đường phố (bánh tráng nướng, sữa đậu nành).', 50000.00, 'chodem-dl.jpg', 'Active', NULL, 'Chợ Đêm Âm Phủ'),
(14, 2, NULL, 'Samten Hills Dalat', 'Nghỉ dưỡng', 'Khu du lịch tâm linh với bảo tháp kinh luân lớn nhất thế giới.', 250000.00, 'samten-dl.jpg', 'Active', NULL, 'Samten Hills Dalat'),
(15, 3, NULL, 'Sun World Hòn Thơm', 'Vui chơi', 'Cáp treo 3 dây vượt biển dài nhất thế giới và công viên nước Aquatopia.', 600000.00, 'honthom-pq.jpg', 'Active', NULL, 'Sun World Hòn Thơm'),
(16, 3, NULL, 'Vinpearl Safari Phú Quốc', 'Tham quan', 'Công viên chăm sóc và bảo tồn động vật bán hoang dã lớn nhất Việt Nam.', 650000.00, 'safari-pq.jpg', 'Active', NULL, 'Vinpearl Safari Phú Quốc'),
(17, 3, NULL, 'Grand World Phú Quốc', 'Tham quan', 'Thành phố không ngủ với kiến trúc Venice thu nhỏ và các show diễn thực cảnh.', 0.00, 'grandworld-pq.jpg', 'Active', NULL, 'Grand World Phú Quốc'),
(18, 3, NULL, 'Bãi Sao', 'Nghỉ dưỡng', 'Một trong những bãi biển đẹp nhất đảo ngọc với cát trắng mịn như kem.', 0.00, 'baisao-pq.jpg', 'Active', NULL, 'Bãi Sao'),
(19, 3, NULL, 'Bún quậy Kiến Xây', 'Ăn uống', 'Món bún đặc trưng, thực khách tự tay pha nước chấm theo khẩu vị.', 70000.00, 'bunquay-pq.jpg', 'Active', NULL, 'Bún quậy Kiến Xây'),
(20, 3, NULL, 'Chợ đêm Dinh Cậu', 'Mua sắm', 'Khu chợ sầm uất chuyên các món hải sản nướng, đậu phộng chou chou.', 200000.00, 'dinhcau-pq.jpg', 'Active', NULL, 'Chợ đêm Dinh Cậu'),
(21, 4, NULL, 'Đỉnh Fansipan (Cáp treo)', 'Tham quan', 'Chinh phục nóc nhà Đông Dương bằng hệ thống cáp treo hiện đại nhất thế giới.', 800000.00, 'fansipan-sp.jpg', 'Active', NULL, 'Đỉnh Fansipan (Cáp treo)'),
(22, 4, NULL, 'Bản Cát Cát', 'Tham quan', 'Bản làng cổ của người H\'Mông, mang đậm bản sắc văn hóa Tây Bắc.', 90000.00, 'catcat-sp.jpg', 'Active', NULL, 'Bản Cát Cát'),
(23, 4, NULL, 'Đèo Ô Quy Hồ', 'Tham quan', 'Một trong tứ đại đỉnh đèo của Việt Nam, điểm săn mây tuyệt đẹp.', 0.00, 'oquyho-sp.jpg', 'Active', NULL, 'Đèo Ô Quy Hồ'),
(24, 4, NULL, 'Nhà hàng Lẩu Cá Tầm', 'Ăn uống', 'Thưởng thức món lẩu cá tầm tươi ngon sưởi ấm giữa tiết trời lạnh giá.', 300000.00, 'catam-sp.jpg', 'Active', 'Thưởng thức', 'Nhà hàng Lẩu Cá Tầm'),
(25, 5, NULL, 'Bà Nà Hills', 'Tham quan', 'Khu du lịch nổi tiếng của Đà Nẵng', 900000.00, 'banahills.jpg', 'Active', NULL, 'Bà Nà Hills'),
(26, 5, NULL, 'Cầu Vàng', 'Tham quan', 'Biểu tượng du lịch Đà Nẵng', 0.00, 'cauvang.jpg', 'Active', NULL, 'Cầu Vàng'),
(27, 5, NULL, 'Cầu Rồng', 'Tham quan', 'Cầu phun lửa cuối tuần', 0.00, 'caurong.jpg', 'Active', NULL, 'Cầu Rồng'),
(28, 5, NULL, 'Biển Mỹ Khê', 'Tham quan', 'Một trong những bãi biển đẹp nhất thế giới', 0.00, 'mykhe.jpg', 'Active', NULL, 'Biển Mỹ Khê'),
(29, 5, NULL, 'Ngũ Hành Sơn', 'Tham quan', 'Quần thể núi đá vôi nổi tiếng', 40000.00, 'nguhanhson.jpg', 'Active', NULL, 'Ngũ Hành Sơn'),
(30, 5, NULL, 'Asia Park', 'Vui chơi', 'Công viên giải trí', 200000.00, 'asiapark.jpg', 'Active', NULL, 'Asia Park'),
(31, 5, NULL, 'Bảo tàng Chăm', 'Tham quan', 'Bảo tàng nghệ thuật Chăm lớn nhất', 60000.00, 'cham.jpg', 'Active', NULL, 'Bảo tàng Chăm'),
(32, 5, NULL, 'Sơn Trà', 'Tham quan', 'Bán đảo Sơn Trà', 0.00, 'sontra.jpg', 'Active', NULL, 'Sơn Trà'),
(33, 5, NULL, 'Chùa Linh Ứng', '', 'Ngôi chùa nổi tiếng', 0.00, 'linhung.jpg', 'Active', NULL, 'Chùa Linh Ứng'),
(34, 5, NULL, 'Chợ Hàn', 'Mua sắm', 'Đặc sản Đà Nẵng', 0.00, 'chohan.jpg', 'Active', NULL, 'Chợ Hàn'),
(35, 6, NULL, 'Phố cổ Hội An', 'Tham quan', 'Di sản UNESCO', 120000.00, 'phohoian.jpg', 'Active', NULL, 'Phố cổ Hội An'),
(36, 6, NULL, 'Chùa Cầu', 'Tham quan', 'Biểu tượng Hội An', 0.00, 'chuacau.jpg', 'Active', NULL, 'Chùa Cầu'),
(37, 6, NULL, 'Rừng dừa Bảy Mẫu', 'Tham quan', 'Đi thuyền thúng', 180000.00, '/uploads/1786237814077-tour-rung-dua-bay-mau-c.jpg', 'Active', NULL, 'Rừng dừa Bảy Mẫu'),
(38, 6, NULL, 'Biển An Bàng', 'Tham quan', 'Biển đẹp của Hội An', 0.00, 'anbang.jpg', 'Active', NULL, 'Biển An Bàng'),
(39, 6, NULL, 'Làng gốm Thanh Hà', '', 'Làm gốm', 80000.00, 'thanhha.jpg', 'Active', NULL, 'Làng gốm Thanh Hà'),
(40, 6, NULL, 'Làng rau Trà Quế', '', 'Làm nông dân', 100000.00, 'traque.jpg', 'Active', NULL, 'Làng rau Trà Quế'),
(41, 7, NULL, 'Đại Nội Huế', 'Tham quan', 'Hoàng thành Huế', 200000.00, 'dainoi.jpg', 'Active', NULL, 'Đại Nội Huế'),
(42, 7, NULL, 'Chùa Thiên Mụ', '', 'Ngôi chùa nổi tiếng', 0.00, 'thienmu.jpg', 'Active', NULL, 'Chùa Thiên Mụ'),
(43, 7, NULL, 'Lăng Khải Định', 'Tham quan', 'Lăng vua Khải Định', 150000.00, 'khaidinh.jpg', 'Active', NULL, 'Lăng Khải Định'),
(44, 7, NULL, 'Lăng Minh Mạng', 'Tham quan', 'Lăng vua Minh Mạng', 150000.00, 'minhmang.jpg', 'Active', NULL, 'Lăng Minh Mạng'),
(45, 7, NULL, 'Sông Hương', '', 'Nghe ca Huế', 150000.00, 'songhuong.jpg', 'Active', NULL, 'Sông Hương'),
(46, 7, NULL, 'Chợ Đông Ba', 'Mua sắm', 'Chợ nổi tiếng Huế', 0.00, 'dongba.jpg', 'Active', NULL, 'Chợ Đông Ba'),
(47, 8, NULL, 'Hồ Hoàn Kiếm', 'Tham quan', 'Biểu tượng Hà Nội', 0.00, 'hohoankiem.jpg', 'Active', NULL, 'Hồ Hoàn Kiếm'),
(48, 8, NULL, 'Lăng Bác', 'Tham quan', 'Lăng Chủ tịch Hồ Chí Minh', 0.00, 'langbac.jpg', 'Active', NULL, 'Lăng Bác'),
(49, 8, NULL, 'Văn Miếu', 'Tham quan', 'Trường đại học đầu tiên', 70000.00, 'vanmieu.jpg', 'Active', NULL, 'Văn Miếu'),
(50, 8, NULL, 'Phố cổ Hà Nội', 'Tham quan', '36 phố phường', 0.00, 'phoco.jpg', 'Active', NULL, 'Phố cổ Hà Nội'),
(51, 8, NULL, 'Nhà hát Lớn', 'Tham quan', 'Kiến trúc Pháp', 0.00, 'nhahatlon.jpg', 'Active', NULL, 'Nhà hát Lớn'),
(52, 8, NULL, 'Hồ Tây', 'Tham quan', 'Hồ lớn nhất Hà Nội', 0.00, '/uploads/1786237754477-185-1773836446051568605896.jpg', 'Active', NULL, 'Hồ Tây'),
(53, 9, NULL, 'Vịnh Hạ Long', 'Tham quan', 'Kỳ quan thiên nhiên', 950000.00, '/uploads/1786211402112-du-lich-vinh-Ha-Long-hinh-anh1_1625911963.webp', 'Active', NULL, 'Vịnh Hạ Long'),
(54, 9, NULL, 'Hang Sửng Sốt', 'Tham quan', 'Hang động nổi tiếng', 150000.00, '/uploads/1786211339888-hang-sung-sot-2_1627633591.webp', 'Active', NULL, 'Hang Sửng Sốt'),
(55, 9, NULL, 'Đảo Ti Tốp', 'Tham quan', 'Đảo đẹp của Hạ Long', 100000.00, '/uploads/1784714136526-dao-titop-quang-ninh-02_1625285135.webp', 'Active', NULL, 'Đảo Ti Tốp'),
(56, 9, NULL, 'Sun World Hạ Long', 'Vui chơi', 'Công viên giải trí', 350000.00, '/uploads/1784714091209-sunworldHL.jpg', 'Active', NULL, 'Sun World Hạ Long'),
(57, 9, NULL, 'Bảo tàng Quảng Ninh', 'Tham quan', 'Kiến trúc độc đáo', 40000.00, '/uploads/1784713934970-images.jpg', 'Active', NULL, 'Bảo tàng Quảng Ninh'),
(58, 18, NULL, 'Dinh Độc Lập', 'Tham quan', 'Di tích lịch sử nổi tiếng tại trung tâm TP.HCM, nơi lưu giữ nhiều dấu ấn của lịch sử Việt Nam.', 65000.00, 'dinh-doc-lap.jpg', 'Active', NULL, 'Dinh Độc Lập'),
(59, 18, NULL, 'Chợ Bến Thành', 'Mua sắm', 'Biểu tượng thương mại và văn hóa của Sài Gòn, nơi bán đa dạng các mặt hàng và ẩm thực địa phương.', 0.00, 'cho-ben-thanh.jpg', 'Active', NULL, 'Chợ Bến Thành'),
(60, 18, NULL, 'Địa đạo Củ Chi', 'Tham quan', 'Hệ thống đường hầm kháng chiến lịch sử với kiến trúc độc đáo dưới lòng đất.', 120000.00, 'dia-dao-cu-chi.jpg', 'Active', NULL, 'Địa đạo Củ Chi'),
(61, 15, NULL, 'Quần thể danh thắng Tràng An', 'Tham quan', 'Di sản văn hóa và thiên nhiên thế giới được UNESCO công nhận, nổi tiếng với hệ thống hang động xuyên thủy.', 250000.00, 'trang-an-nb.jpg', 'Active', NULL, 'Tràng An'),
(62, 15, NULL, 'Chùa Bái Đính', 'Tham quan', 'Quần thể chùa mang kiến trúc đồ sộ, sở hữu nhiều kỷ lục nhất Việt Nam và Châu Á.', 50000.00, 'bai-dinh-nb.jpg', 'Active', NULL, 'Chùa Bái Đính'),
(63, 16, NULL, 'Động Phong Nha', 'Tham quan', 'Động nước tuyệt đẹp thuộc Di sản thiên nhiên thế giới, có hệ thống thạch nhũ tráng lệ.', 150000.00, 'phong-nha-qb.jpg', 'Active', NULL, 'Động Phong Nha'),
(64, 16, NULL, 'Động Thiên Đường', 'Tham quan', 'Động khô dài nhất châu Á với vẻ đẹp huyền ảo, tráng lệ như cung điện hoàng gia.', 250000.00, 'thien-duong-qb.jpg', 'Active', NULL, 'Động Thiên Đường'),
(65, 12, NULL, 'Chợ nổi Cái Răng', 'Tham quan', 'Khu chợ sầm uất trên sông, mang đậm nét văn hóa giao thương đặc trưng của miền Tây Nam Bộ.', 0.00, 'cai-rang-ct.jpg', 'Active', NULL, 'Chợ nổi Cái Răng'),
(66, 12, NULL, 'Bến Ninh Kiều', 'Vui chơi', 'Biểu tượng của Cần Thơ, nơi tập trung nhiều nhà hàng, du thuyền và hoạt động về đêm.', 0.00, 'ninh-kieu-ct.jpg', 'Active', NULL, 'Bến Ninh Kiều'),
(67, 14, NULL, 'Tượng Chúa Kito Vua', 'Tham quan', 'Bức tượng Chúa khổng lồ nằm trên đỉnh núi Nhỏ, có thể ngắm toàn cảnh thành phố biển Vũng Tàu.', 0.00, 'tuong-chua-vt.jpg', 'Active', NULL, 'Tượng Chúa Kito Vua'),
(68, 14, NULL, 'Hải đăng Vũng Tàu', 'Tham quan', 'Ngọn hải đăng cổ nhất Việt Nam với kiến trúc kiểu Pháp, view ngắm hoàng hôn cực đẹp.', 0.00, 'hai-dang-vt.jpg', 'Active', NULL, 'Hải đăng Vũng Tàu'),
(69, 2, NULL, 'Thiền Viện Trúc Lâm', 'Tham quan', 'Ngôi thiền viện lớn nhất Đà Lạt, nằm uy nghi trên núi Phụng Hoàng, nhìn ra Hồ Tuyền Lâm.', 0.00, 'thien-vien-truc-lam-dl.jpg', 'Active', NULL, 'Thiền Viện Trúc Lâm'),
(70, 2, NULL, 'Hồ Tuyền Lâm', 'Tham quan', 'Hồ nước ngọt rộng lớn và đẹp nhất Đà Lạt, bao quanh bởi rừng thông xanh mát.', 0.00, 'ho-tuyen-lam-dl.jpg', 'Active', NULL, 'Hồ Tuyền Lâm'),
(71, 2, NULL, 'Đồi Chè Cầu Đất', 'Tham quan', 'Cánh đồng chè xanh ngát trải dài, điểm săn mây và check-in cùng các tuabin gió khổng lồ.', 0.00, 'doi-che-cau-dat-dl.jpg', 'Active', NULL, 'Đồi Chè Cầu Đất'),
(72, 2, NULL, 'Quảng trường Lâm Viên', 'Tham quan', 'Biểu tượng của Đà Lạt với khối nụ hoa Atiso và nụ hoa Dã Quỳ bằng kính khổng lồ.', 0.00, 'quang-truong-lam-vien-dl.jpg', 'Active', NULL, 'Quảng trường Lâm Viên'),
(73, 2, NULL, 'Thung Lũng Tình Yêu', 'Vui chơi', 'Khu du lịch sinh thái lãng mạn với nhiều tiểu cảnh, vườn hoa và các trò chơi giải trí.', 250000.00, 'thung-lung-tinh-yeu-dl.jpg', 'Active', NULL, 'Thung Lũng Tình Yêu'),
(74, 2, NULL, 'Đường Hầm Điêu Khắc', 'Tham quan', 'Ngôi làng đất sét độc đáo tái hiện lịch sử Đà Lạt, nổi tiếng với góc check-in Hồ Vô Cực.', 120000.00, 'duong-ham-dieu-khac-dl.jpg', 'Active', NULL, 'Đường Hầm Điêu Khắc'),
(75, 2, NULL, 'Nông trại Cún Puppy Farm', 'Tham quan', 'Nông trại với hàng chục giống chó đáng yêu, kết hợp vườn dâu tây và vườn cà chua công nghệ cao.', 100000.00, 'puppy-farm-dl.jpg', 'Active', NULL, 'Puppy Farm'),
(76, 2, NULL, 'Thác Pongour', 'Tham quan', 'Được mệnh danh là Nam Thiên Đệ Nhất Thác với 7 tầng đá hình bậc thang tuyệt đẹp giữa rừng.', 20000.00, 'thac-pongour-dl.jpg', 'Active', NULL, 'Thác Pongour'),
(77, 2, NULL, 'Bánh tráng nướng Dì Đinh', 'Ăn uống', 'Quán bánh tráng nướng (pizza Đà Lạt) cực kỳ nổi tiếng, đa dạng các loại topping.', 30000.00, 'banh-trang-di-dinh-dl.jpg', 'Active', NULL, 'Bánh tráng nướng Dì Đinh'),
(78, 2, NULL, 'Quán cafe Túi Mơ To', 'Ăn uống', 'Quán cafe mang phong cách mộc mạc, có view ngắm trọn khu nhà lồng trồng hoa sáng rực về đêm.', 60000.00, 'tui-mo-to-dl.jpg', 'Active', NULL, 'Cafe Túi Mơ To'),
(79, 1, NULL, 'Viện Hải dương học', 'Tham quan', 'Nơi lưu giữ và bảo tồn hàng chục ngàn mẫu vật sinh vật biển, cùng các hồ nuôi sinh vật biển sống.', 40000.00, 'vien-hai-duong-hoc-nt.jpg', 'Active', NULL, 'Viện Hải dương học'),
(80, 1, NULL, 'Chùa Long Sơn', 'Tham quan', 'Ngôi chùa cổ kính nổi tiếng với bức tượng Kim Thân Phật Tổ khổng lồ trên đỉnh đồi Trại Thủy.', 0.00, 'chua-long-son-nt.jpg', 'Active', NULL, 'Chùa Long Sơn'),
(81, 1, NULL, 'Nhà thờ Núi', 'Tham quan', 'Công trình kiến trúc Gothic tuyệt đẹp bằng đá đặc trưng, nằm ngay trung tâm thành phố.', 0.00, 'nha-tho-nui-nt.jpg', 'Active', NULL, 'Nhà thờ Núi'),
(82, 1, NULL, 'Khu du lịch Hòn Tằm', 'Nghỉ dưỡng', 'Đảo sinh thái tuyệt đẹp với bãi biển cát trắng, dịch vụ tắm bùn khoáng trên đảo và các trò chơi thể thao nước.', 800000.00, 'hon-tam-nt.jpg', 'Active', NULL, 'Khu du lịch Hòn Tằm'),
(83, 1, NULL, 'Danh thắng Hòn Chồng', 'Tham quan', 'Quần thể khối đá lớn với những hình thù kỳ lạ xếp chồng lên nhau bên bờ biển, gắn với nhiều truyền thuyết.', 30000.00, 'hon-chong-nt.jpg', 'Active', NULL, 'Danh thắng Hòn Chồng'),
(84, 1, NULL, 'Bò nướng Lạc Cảnh', 'Ăn uống', 'Quán ăn lâu đời với món thịt bò nướng than hoa tẩm ướp gia vị bí truyền trứ danh của Nha Trang.', 150000.00, 'bo-nuong-lac-canh-nt.jpg', 'Active', NULL, 'Bò nướng Lạc Cảnh'),
(85, 1, NULL, 'Đảo Khỉ (Hòn Lao)', 'Vui chơi', 'Hòn đảo hoang sơ là vương quốc của hàng ngàn chú khỉ tự nhiên, kết hợp các show diễn xiếc thú ấn tượng.', 250000.00, 'dao-khi-nt.jpg', 'Active', NULL, 'Đảo Khỉ'),
(86, 1, NULL, 'Bún cá sứa Năm Beo', 'Ăn uống', 'Món ăn sáng đặc sản Nha Trang với nước lùng thanh ngọt, chả cá dai và sứa giòn sần sật.', 45000.00, 'bun-ca-sua-nt.jpg', 'Active', NULL, 'Bún cá sứa Năm Beo'),
(87, 1, NULL, 'Skylight Nha Trang', 'Vui chơi', 'Rooftop beach club cao nhất Nha Trang, nơi ngắm toàn cảnh thành phố biển cực chill về đêm.', 200000.00, 'skylight-nt.jpg', 'Active', NULL, 'Skylight Nha Trang'),
(88, 1, NULL, 'Bãi Dài', 'Tham quan', 'Bãi biển hoang sơ, nước trong vắt và bãi cát trắng mịn trải dài tuyệt đẹp nằm cách xa trung tâm.', 0.00, 'bai-dai-nt.jpg', 'Active', NULL, 'Bãi Dài'),
(89, 5, NULL, 'Cầu Tình Yêu', 'Tham quan', 'Cây cầu lãng mạn bên bờ sông Hàn với những cột đèn lồng hình trái tim, điểm check-in yêu thích của giới trẻ.', 0.00, 'cau-tinh-yeu-dn.jpg', 'Active', NULL, 'Cầu Tình Yêu'),
(90, 5, NULL, 'Chợ Cồn', 'Mua sắm', 'Thiên đường ẩm thực đường phố và mua sắm đặc sản lớn nhất Đà Nẵng, đa dạng các món ăn vặt.', 0.00, 'cho-con-dn.jpg', 'Active', NULL, 'Chợ Cồn'),
(91, 5, NULL, 'Đỉnh Bàn Cờ', 'Tham quan', 'Nằm trên bán đảo Sơn Trà, điểm cao nhất để ngắm toàn cảnh thành phố Đà Nẵng tuyệt đẹp từ trên cao.', 0.00, 'dinh-ban-co-dn.jpg', 'Active', NULL, 'Đỉnh Bàn Cờ'),
(92, 5, NULL, 'Mì Quảng Bà Mua', 'Ăn uống', 'Quán mì Quảng nổi tiếng với hương vị đậm đà, nước dùng chuẩn vị miền Trung.', 50000.00, 'mi-quang-ba-mua-dn.jpg', 'Active', NULL, 'Mì Quảng Bà Mua'),
(93, 5, NULL, 'Hải sản Năm Đảnh', 'Ăn uống', 'Quán hải sản bình dân ngon, bổ, rẻ ẩn mình trong hẻm nhỏ nhưng luôn tấp nập thực khách.', 150000.00, 'hai-san-nam-danh-dn.jpg', 'Active', NULL, 'Hải sản Năm Đảnh'),
(94, 5, NULL, 'Bánh tráng cuốn thịt heo Quán Trần', 'Ăn uống', 'Đặc sản trứ danh Đà Nẵng với thịt heo hai đầu da, rau rừng tươi và mắm nêm đậm vị.', 120000.00, 'banh-trang-thit-heo-dn.jpg', 'Active', NULL, 'Bánh tráng cuốn thịt heo'),
(95, 5, NULL, 'Bãi biển Non Nước', 'Nghỉ dưỡng', 'Bãi biển tuyệt đẹp nằm dưới chân núi Ngũ Hành Sơn, cát trắng mịn và nước biển trong xanh.', 0.00, 'bai-bien-non-nuoc-dn.jpg', 'Active', NULL, 'Bãi biển Non Nước'),
(96, 5, NULL, 'Rạn Nam Ô', 'Tham quan', 'Bãi đá phủ rêu xanh mướt tuyệt đẹp vào mùa xuân, điểm chụp ảnh mang vẻ hoang sơ, tự nhiên.', 0.00, 'ran-nam-o-dn.jpg', 'Active', NULL, 'Rạn Nam Ô'),
(97, 5, NULL, 'Công viên Biển Đông', 'Vui chơi', 'Công viên ven biển với hàng ngàn chú chim bồ câu thân thiện, nơi thường xuyên tổ chức sự kiện ngoài trời.', 0.00, 'cong-vien-bien-dong-dn.jpg', 'Active', NULL, 'Công viên Biển Đông'),
(98, 5, NULL, 'Suối khoáng nóng Núi Thần Tài', 'Nghỉ dưỡng', 'Khu du lịch nghỉ dưỡng với các hồ tắm khoáng nóng tự nhiên, công viên nước và dịch vụ tắm bùn.', 450000.00, 'nui-than-tai-dn.jpg', 'Active', NULL, 'Núi Thần Tài'),
(99, 8, NULL, 'Hoàng Thành Thăng Long', 'Tham quan', 'Quần thể di tích lịch sử quan trọng, ghi dấu nghìn năm lịch sử của các triều đại phong kiến Việt Nam.', 30000.00, 'hoang-thanh-tl-hn.jpg', 'Active', NULL, 'Hoàng Thành Thăng Long'),
(100, 8, NULL, 'Chùa Trấn Quốc', 'Tham quan', 'Ngôi chùa cổ nhất Hà Nội nằm trên một hòn đảo nhỏ của Hồ Tây, mang kiến trúc độc đáo và linh thiêng.', 0.00, 'chua-tran-quoc-hn.jpg', 'Active', NULL, 'Chùa Trấn Quốc'),
(101, 8, NULL, 'Chợ Đồng Xuân', 'Mua sắm', 'Khu chợ đầu mối lớn và lâu đời nhất khu vực phố cổ, bày bán đa dạng các mặt hàng tiêu dùng và quà lưu niệm.', 0.00, 'cho-dong-xuan-hn.jpg', 'Active', NULL, 'Chợ Đồng Xuân'),
(102, 8, NULL, 'Cầu Long Biên', 'Tham quan', 'Cây cầu thép lịch sử bắc qua sông Hồng, một chứng nhân lịch sử với nét đẹp cổ kính, hoang sơ.', 0.00, 'cau-long-bien-hn.jpg', 'Active', NULL, 'Cầu Long Biên'),
(103, 8, NULL, 'Nhà tù Hỏa Lò', 'Tham quan', 'Di tích lịch sử nhà tù thực dân Pháp xây dựng, nơi giáo dục truyền thống yêu nước sâu sắc.', 30000.00, 'hoa-lo-hn.jpg', 'Active', NULL, 'Nhà tù Hỏa Lò'),
(104, 8, NULL, 'Bảo tàng Dân tộc học Việt Nam', 'Tham quan', 'Nơi lưu giữ, trưng bày và tái hiện sống động bản sắc văn hóa của 54 dân tộc anh em.', 40000.00, 'bao-tang-dth-hn.jpg', 'Active', NULL, 'Bảo tàng Dân tộc học'),
(105, 8, NULL, 'Phở Gia Truyền Bát Đàn', 'Ăn uống', 'Quán phở bò nổi tiếng với hương vị nước dùng thanh ngọt, thịt bò mềm và văn hóa xếp hàng đặc trưng.', 60000.00, 'pho-bat-dan-hn.jpg', 'Active', NULL, 'Phở Bát Đàn'),
(106, 8, NULL, 'Bún chả Hương Liên', 'Ăn uống', 'Quán bún chả nổi danh từng đón cựu Tổng thống Obama thưởng thức, thịt nướng thơm lừng.', 70000.00, 'bun-cha-obama-hn.jpg', 'Active', NULL, 'Bún chả Hương Liên'),
(107, 8, NULL, 'Chả cá Lã Vọng', 'Ăn uống', 'Món ăn tinh hoa ẩm thực Hà Thành, chả cá lăng nướng than hoa ăn kèm bún, mắm tôm và hành thì là.', 150000.00, 'cha-ca-la-vong-hn.jpg', 'Active', NULL, 'Chả cá Lã Vọng'),
(108, 8, NULL, 'Kem Tràng Tiền', 'Ăn uống', 'Thương hiệu kem lâu đời gắn liền với tuổi thơ người Hà Nội, nổi tiếng với kem cốm và kem ốc quế.', 15000.00, 'kem-trang-tien-hn.jpg', 'Active', NULL, 'Kem Tràng Tiền'),
(109, 11, NULL, 'Đồi Cát Bay', 'Tham quan', 'Đồi cát thay đổi hình dáng liên tục theo hướng gió, trải nghiệm trượt cát vô cùng thú vị.', 0.00, 'doi-cat-bay-mn.jpg', 'Active', NULL, 'Đồi Cát Bay'),
(110, 11, NULL, 'Bàu Trắng', 'Vui chơi', 'Được ví như tiểu sa mạc Sahara, có hồ nước ngọt trong xanh ở giữa và dịch vụ thuê xe máy cày, xe Jeep vượt địa hình.', 150000.00, 'bau-trang-mn.jpg', 'Active', NULL, 'Bàu Trắng'),
(111, 11, NULL, 'Suối Tiên', 'Tham quan', 'Dòng suối nhỏ chảy quanh năm giữa những đồi cát nhấp nhô màu đỏ vàng, cảnh quan thiên nhiên vô cùng độc đáo.', 15000.00, 'suoi-tien-mn.jpg', 'Active', NULL, 'Suối Tiên'),
(112, 11, NULL, 'Làng chài Mũi Né', 'Tham quan', 'Nơi neo đậu của hàng trăm tàu thuyền đánh cá màu sắc rực rỡ, tìm hiểu đời sống ngư dân và mua hải sản tươi sống.', 0.00, 'lang-chai-mn.jpg', 'Active', NULL, 'Làng chài Mũi Né'),
(113, 11, NULL, 'Tháp Chàm Poshanư', 'Tham quan', 'Di tích đền tháp của vương quốc Chăm Pa cổ đại, mang đậm nét văn hóa kiến trúc tôn giáo và lịch sử.', 15000.00, 'thap-poshanu-mn.jpg', 'Active', NULL, 'Tháp Poshanư'),
(114, 11, NULL, 'Lâu đài Rượu Vang', 'Tham quan', 'Công trình kiến trúc mô phỏng lâu đài châu Âu thời trung cổ, nơi tham quan hầm rượu và nếm thử các loại vang hảo hạng.', 120000.00, 'lau-dai-ruou-vang-mn.jpg', 'Active', NULL, 'Lâu đài Rượu Vang'),
(115, 11, NULL, 'Bãi đá Ông Địa', 'Tham quan', 'Bãi biển trong xanh với những mỏm đá nhô ra biển cùng bờ kè chắn sóng, là điểm check-in và tắm biển lý tưởng.', 0.00, 'bai-da-ong-dia-mn.jpg', 'Active', NULL, 'Bãi đá Ông Địa'),
(116, 11, NULL, 'Hải đăng Kê Gà', 'Tham quan', 'Ngọn hải đăng cổ bằng đá cao nhất Việt Nam nằm trên một hòn đảo nhỏ, cảnh quan hùng vĩ và hoang sơ.', 50000.00, 'hai-dang-ke-ga-mn.jpg', 'Active', NULL, 'Hải đăng Kê Gà'),
(117, 11, NULL, 'Lẩu thả Phan Thiết', 'Ăn uống', 'Món ăn đặc sản địa phương kết hợp nhiều nguyên liệu tươi ngon được bày biện rực rỡ trong bẹ hoa chuối.', 250000.00, 'lau-tha-mn.jpg', 'Active', NULL, 'Lẩu thả Phan Thiết'),
(118, 11, NULL, 'Khu ẩm thực Bờ Kè', 'Ăn uống', 'Dãy các quán hải sản bình dân nằm sát bờ biển, thưởng thức hải sản tươi sống đón gió biển mát rượi.', 200000.00, 'bo-ke-mn.jpg', 'Active', NULL, 'Hải sản Bờ Kè');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reviews`
--

CREATE TABLE `reviews` (
  `review_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `tour_id` int(11) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`) VALUES
(1, 'Administrator'),
(6, 'Customer'),
(2, 'HR Manager'),
(4, 'Office Staff'),
(7, 'Partner'),
(5, 'Tour Guide'),
(3, 'Tour Manager');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `services`
--

CREATE TABLE `services` (
  `service_id` int(11) NOT NULL,
  `service_name` varchar(255) DEFAULT NULL,
  `service_type` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive','Pending') DEFAULT 'Active',
  `partner_id` int(11) DEFAULT NULL,
  `destination_id` int(11) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `base_cost` decimal(15,2) DEFAULT NULL,
  `selling_price` decimal(15,2) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `attributes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attributes`)),
  `action_verb` varchar(50) DEFAULT NULL,
  `short_display_name` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `services`
--

INSERT INTO `services` (`service_id`, `service_name`, `service_type`, `description`, `image_url`, `status`, `partner_id`, `destination_id`, `unit`, `base_cost`, `selling_price`, `capacity`, `attributes`, `action_verb`, `short_display_name`) VALUES
(1, 'Vé máy bay Khứ hồi - Phổ thông', 'Vé máy bay', NULL, NULL, 'Active', 1, NULL, 'Vé', 2200000.00, 2200000.00, 1, '{\"vehicle_type\": \"Máy bay\", \"brand\": \"Airbus A321\", \"has_baggage\": \"20kg Ký gửi\"}', NULL, NULL),
(2, 'Vé máy bay Khứ hồi - Thương gia', 'Vé máy bay', NULL, NULL, 'Active', 1, NULL, 'Vé', 5500000.00, 5500000.00, 1, '{\"vehicle_type\": \"Máy bay\", \"brand\": \"Boeing 787\", \"has_baggage\": \"30kg Ký gửi + Phòng chờ VIP\"}', NULL, NULL),
(4, 'Xe Du lịch 16 chỗ / Ngày', 'Xe vận chuyển', '', '/uploads/1786238675096-710880483.jpg', 'Active', 3, NULL, 'Xe/Ngày', 1200000.00, 1200000.00, 15, '{}', NULL, NULL),
(5, 'Thuê xe Limousine 9 chỗ / Ngày', 'Xe vận chuyển', '', '/uploads/1786238624166-114887815.jpg', 'Active', 3, NULL, 'Xe/Ngày', 2000000.00, 2000000.00, 9, '{}', NULL, NULL),
(6, 'Phòng Deluxe Ocean View', 'Khách sạn', NULL, NULL, 'Active', 4, 1, 'Phòng/Đêm', 2500000.00, 2500000.00, 2, '{\"star_rating\": 5, \"room_type\": \"Deluxe\", \"bed_type\": \"1 King Bed\", \"has_breakfast\": true}', NULL, NULL),
(7, 'Phòng Standard Hướng Phố', 'Khách sạn', NULL, NULL, 'Active', 5, 1, 'Phòng/Đêm', 900000.00, 900000.00, 2, '{\"star_rating\": 4, \"room_type\": \"Standard\", \"bed_type\": \"2 Twin Beds\", \"has_breakfast\": true}', NULL, NULL),
(8, 'Phòng Superior', 'Khách sạn', '', '/uploads/1786237947856-208711390.jpg', 'Active', 6, 2, 'Phòng/Đêm', 1300000.00, 1300000.00, 2, '{}', NULL, NULL),
(9, 'Villa 1 Phòng Ngủ (Cổ điển)', 'Khách sạn', '', '/uploads/1786237896616-604688624.jpg', 'Active', 7, 2, 'Căn/Đêm', 3200000.00, 3200000.00, 2, '{}', NULL, NULL),
(10, 'Emerald Bay View', 'Khách sạn', '', '/uploads/1786211032534-907253131.avif', 'Active', 8, 3, 'Phòng/Đêm', 5000000.00, 5000000.00, 2, '{}', NULL, NULL),
(12, 'Phòng Deluxe Hướng Biển', 'Accommodation', '', '/uploads/1786211263783-230213333.jpg', 'Active', NULL, 5, 'Phòng/Đêm', 1200000.00, 1200000.00, 0, '{}', NULL, NULL),
(13, 'Phòng Suite Cao Cấp', 'Accommodation', '', '/uploads/1786211185878-710398912.webp', 'Active', NULL, 1, 'Phòng/Đêm', 2000000.00, 2000000.00, 0, '{}', NULL, NULL),
(14, 'Xe Ford Transit 16 Chỗ', 'Xe vận chuyển', '', '/uploads/1786210855576-636069820.webp', 'Active', NULL, NULL, 'Xe/Ngày', 960000.00, 960000.00, 0, '{}', NULL, NULL),
(15, 'Xe Thaco 29 Chỗ', 'Xe vận chuyển', '', '/uploads/1786210745118-332571067.jpg', 'Active', NULL, NULL, 'Xe/Ngày', 1760000.00, 1760000.00, 0, '{}', NULL, NULL),
(20, 'Phòng Suite Cơ Bản', 'Khách sạn', 'Trải nghiệm sang trọng, dịch vụ đẳng cấp', '/uploads/1786209370282-387963415.webp', 'Active', 10, 1, 'Phòng/Đêm', 0.00, 0.00, 2, '{}', NULL, NULL),
(21, 'Phòng Suite Cao Cấp', 'Khách sạn', 'ỷhh', '/uploads/1786246706834-935012199.webp', 'Pending', 10, 1, 'Phòng/Đêm', 0.00, 0.00, 2, NULL, NULL, NULL),
(22, 'Xe SUV 7 chỗ (Innova/Fortuner) / Ngày', 'Xe vận chuyển', 'Xe 7 chỗ đời mới, gầm cao, phù hợp cho nhóm gia đình nhỏ hoặc tour thiết kế riêng.', '/uploads/1787459248482-55394049.jpg', 'Active', 3, NULL, 'Xe/Ngày', 900000.00, 900000.00, 7, '{}', NULL, NULL),
(23, 'Xe Limousine 11 chỗ VIP / Ngày', 'Xe vận chuyển', 'Xe Limousine độ ghế massage cao cấp, chuyên phục vụ khách VIP.', '/uploads/1787459197786-354992328.jpeg', 'Active', 3, NULL, 'Xe/Ngày', 2200000.00, 2200000.00, 11, '{}', NULL, NULL),
(24, 'Xe 29 chỗ Thaco Town / Ngày', 'Xe vận chuyển', 'Xe 29 chỗ rộng rãi, hầm cốp lớn, phù hợp cho đoàn công ty vừa và nhỏ.', '/uploads/1787459151889-630393448.jpg', 'Active', 3, NULL, 'Xe/Ngày', 1600000.00, 1600000.00, 29, '{}', NULL, NULL),
(25, 'Xe 45 chỗ Universe / Ngày', 'Xe vận chuyển', 'Dòng xe 45 chỗ cao cấp nhất, bầu hơi êm ái, chuyên chạy tour ghép đoàn lớn.', '/uploads/1787459109242-530366681.jpeg', 'Active', 3, NULL, 'Xe/Ngày', 2500000.00, 2500000.00, 45, '{}', NULL, NULL),
(26, 'Khách sạn 3★ Đồng Văn Hoa Cổ', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 19, 'Phòng/Đêm', 850000.00, NULL, NULL, NULL, NULL, NULL),
(27, 'Khách sạn 4★ Phoenix Hà Giang', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 19, 'Phòng/Đêm', 1200000.00, NULL, NULL, NULL, NULL, NULL),
(28, 'Hmong Village Resort 4★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 19, 'Phòng/Đêm', 1600000.00, NULL, NULL, NULL, NULL, NULL),
(29, 'Khách sạn 4★ Sala Phú Yên Beach', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 20, 'Phòng/Đêm', 1200000.00, NULL, NULL, NULL, NULL, NULL),
(30, 'Stelia Beach Resort 5★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 20, 'Phòng/Đêm', 2800000.00, NULL, NULL, NULL, NULL, NULL),
(31, 'Khách sạn 3★ Hùng Vương Phú Yên', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 20, 'Phòng/Đêm', 750000.00, NULL, NULL, NULL, NULL, NULL),
(32, 'Khách sạn 4★ Seagull Quy Nhơn', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 10, 'Phòng/Đêm', 1300000.00, NULL, NULL, NULL, NULL, NULL),
(33, 'FLC Luxury Resort Quy Nhơn 5★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 10, 'Phòng/Đêm', 3500000.00, NULL, NULL, NULL, NULL, NULL),
(34, 'Khách sạn 3★ Hải Âu Quy Nhơn', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 10, 'Phòng/Đêm', 800000.00, NULL, NULL, NULL, NULL, NULL),
(35, 'Khách sạn 4★ Phố Cổ Hội An', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 6, 'Phòng/Đêm', 1300000.00, NULL, NULL, NULL, NULL, NULL),
(36, 'Silk Sense Hoi An River Resort 5★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 6, 'Phòng/Đêm', 2900000.00, NULL, NULL, NULL, NULL, NULL),
(37, 'Khách sạn 3★ Hoi An Historic', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 6, 'Phòng/Đêm', 850000.00, NULL, NULL, NULL, NULL, NULL),
(38, 'Khách sạn 4★ Century Riverside Huế', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 7, 'Phòng/Đêm', 1200000.00, NULL, NULL, NULL, NULL, NULL),
(39, 'Silk Path Grand Hue Hotel 5★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 7, 'Phòng/Đêm', 2500000.00, NULL, NULL, NULL, NULL, NULL),
(40, 'Khách sạn 3★ Moonlight Huế', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 7, 'Phòng/Đêm', 800000.00, NULL, NULL, NULL, NULL, NULL),
(41, 'Khách sạn 4★ Mường Thanh Quảng Bình', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 16, 'Phòng/Đêm', 1250000.00, NULL, NULL, NULL, NULL, NULL),
(42, 'Sun Spa Resort Quảng Bình 5★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 16, 'Phòng/Đêm', 2800000.00, NULL, NULL, NULL, NULL, NULL),
(43, 'Khách sạn 3★ Tân Bình Quảng Bình', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 16, 'Phòng/Đêm', 750000.00, NULL, NULL, NULL, NULL, NULL),
(44, 'Khách sạn 4★ Sapa Horizon', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 4, 'Phòng/Đêm', 1400000.00, NULL, NULL, NULL, NULL, NULL),
(45, 'Hotel de la Coupole Sapa 5★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 4, 'Phòng/Đêm', 3800000.00, NULL, NULL, NULL, NULL, NULL),
(46, 'Khách sạn 3★ Bamboo Sapa', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 4, 'Phòng/Đêm', 950000.00, NULL, NULL, NULL, NULL, NULL),
(47, 'Khách sạn 4★ Mường Thanh Luxury Hạ Long', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 9, 'Phòng/Đêm', 1500000.00, NULL, NULL, NULL, NULL, NULL),
(48, 'Vinpearl Resort & Spa Hạ Long 5★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 9, 'Phòng/Đêm', 3600000.00, NULL, NULL, NULL, NULL, NULL),
(49, 'Khách sạn 3★ Halong Bay Hotel', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 9, 'Phòng/Đêm', 850000.00, NULL, NULL, NULL, NULL, NULL),
(50, 'Emeralda Resort Ninh Bình 5★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 15, 'Phòng/Đêm', 2600000.00, NULL, NULL, NULL, NULL, NULL),
(51, 'Khách sạn 4★ Legend Ninh Bình', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 15, 'Phòng/Đêm', 1300000.00, NULL, NULL, NULL, NULL, NULL),
(52, 'Khách sạn 3★ Bái Đính Ninh Bình', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 15, 'Phòng/Đêm', 800000.00, NULL, NULL, NULL, NULL, NULL),
(53, 'Khách sạn 4★ TTC Cần Thơ', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 12, 'Phòng/Đêm', 1200000.00, NULL, NULL, NULL, NULL, NULL),
(54, 'Victoria Cần Thơ Resort 5★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 12, 'Phòng/Đêm', 2700000.00, NULL, NULL, NULL, NULL, NULL),
(55, 'Khách sạn 3★ Ninh Kiều Cần Thơ', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 12, 'Phòng/Đêm', 850000.00, NULL, NULL, NULL, NULL, NULL),
(56, 'Six Senses Côn Đảo 5★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 13, 'Phòng/Đêm', 8500000.00, NULL, NULL, NULL, NULL, NULL),
(57, 'The Secret Côn Đảo 4★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 13, 'Phòng/Đêm', 2200000.00, NULL, NULL, NULL, NULL, NULL),
(58, 'Khách sạn 3★ Côn Đảo Resort', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 13, 'Phòng/Đêm', 1100000.00, NULL, NULL, NULL, NULL, NULL),
(59, 'The Grand Ho Tram Resort 5★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 14, 'Phòng/Đêm', 3200000.00, NULL, NULL, NULL, NULL, NULL),
(60, 'Imperial Hotel Vũng Tàu 5★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 14, 'Phòng/Đêm', 2600000.00, NULL, NULL, NULL, NULL, NULL),
(61, 'Khách sạn 4★ Malibu Vũng Tàu', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 14, 'Phòng/Đêm', 1400000.00, NULL, NULL, NULL, NULL, NULL),
(62, 'Khách sạn 4★ Saigon Ban Me', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 21, 'Phòng/Đêm', 1200000.00, NULL, NULL, NULL, NULL, NULL),
(63, 'Khách sạn 3★ Pleiku Hotel', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 21, 'Phòng/Đêm', 850000.00, NULL, NULL, NULL, NULL, NULL),
(64, 'Elephants Hotel Buôn Ma Thuột 4★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 21, 'Phòng/Đêm', 1100000.00, NULL, NULL, NULL, NULL, NULL),
(65, 'Khách sạn 3★ Mũi Cà Mau', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 22, 'Phòng/Đêm', 800000.00, NULL, NULL, NULL, NULL, NULL),
(66, 'Khách sạn 4★ Mường Thanh Luxury Cà Mau', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 22, 'Phòng/Đêm', 1300000.00, NULL, NULL, NULL, NULL, NULL),
(67, 'Melia Vinpearl Tây Ninh 5★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 23, 'Phòng/Đêm', 1600000.00, NULL, NULL, NULL, NULL, NULL),
(68, 'Khách sạn 3★ Sunrise Tây Ninh', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 23, 'Phòng/Đêm', 750000.00, NULL, NULL, NULL, NULL, NULL),
(69, 'Phú Quý Island Hotel 3★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 11, 'Phòng/Đêm', 900000.00, NULL, NULL, NULL, NULL, NULL),
(70, 'Centara Mirage Resort Mũi Né 5★', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 11, 'Phòng/Đêm', 2900000.00, NULL, NULL, NULL, NULL, NULL),
(71, 'Khách sạn 5★ Lotte Hotel Hà Nội', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 8, 'Phòng/Đêm', 3200000.00, NULL, NULL, NULL, NULL, NULL),
(72, 'Khách sạn 4★ Silk Path Hà Nội', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 8, 'Phòng/Đêm', 1600000.00, NULL, NULL, NULL, NULL, NULL),
(73, 'Khách sạn 5★ Rex Hotel Saigon', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 18, 'Phòng/Đêm', 2800000.00, NULL, NULL, NULL, NULL, NULL),
(74, 'Khách sạn 4★ Liberty Central Saigon', 'Khách sạn', 'Dịch vụ lưu trú chất lượng cao', NULL, 'Active', NULL, 18, 'Phòng/Đêm', 1500000.00, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `service_bookings`
--

CREATE TABLE `service_bookings` (
  `booking_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `usage_date` date NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `payment_method` enum('Prepaid','Pay_at_Location') DEFAULT 'Prepaid',
  `status` enum('Pending','Confirmed','Paid','Rejected','Completed') DEFAULT 'Pending',
  `voucher_code` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `service_bookings`
--

INSERT INTO `service_bookings` (`booking_id`, `customer_id`, `service_id`, `quantity`, `usage_date`, `total_amount`, `payment_method`, `status`, `voucher_code`, `notes`, `created_at`) VALUES
(1, 8, 7, 1, '2026-08-09', 1200000.00, 'Pay_at_Location', 'Confirmed', 'VOUCHER-7C4CIH', '', '2026-08-08 03:30:55'),
(3, 8, 20, 1, '2026-08-13', 4200000.00, 'Pay_at_Location', 'Confirmed', 'VOUCHER-PJ14XB', '', '2026-08-08 18:03:44'),
(4, 8, 20, 1, '2026-08-14', 4200000.00, 'Pay_at_Location', '', NULL, '', '2026-08-09 03:36:58');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `service_requests`
--

CREATE TABLE `service_requests` (
  `request_id` int(11) NOT NULL,
  `departure_id` int(11) DEFAULT NULL,
  `service_booking_id` int(11) DEFAULT NULL,
  `partner_id` int(11) DEFAULT NULL,
  `requested_by` int(11) DEFAULT NULL,
  `request_content` text DEFAULT NULL,
  `status` enum('Pending','Accepted','Rejected') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `agreed_price` int(11) DEFAULT 0 COMMENT 'Giá thỏa thuận chốt cứng tại thời điểm đặt'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `service_requests`
--

INSERT INTO `service_requests` (`request_id`, `departure_id`, `service_booking_id`, `partner_id`, `requested_by`, `request_content`, `status`, `created_at`, `agreed_price`) VALUES
(7, NULL, 1, 5, 4, 'Khách hàng đặt: Ngày 2026-08-09 - Số lượng: 1', 'Accepted', '2026-08-08 10:39:19', 1200000),
(8, NULL, 3, 10, 8, 'Khách hàng đặt: Ngày 2026-08-13 - Số lượng: 1', 'Accepted', '2026-08-08 18:03:44', 4200000),
(9, NULL, 4, 10, 8, 'Khách hàng đặt: Ngày 2026-08-14 - Số lượng: 1', 'Pending', '2026-08-09 03:36:58', 4200000);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `timekeeping`
--

CREATE TABLE `timekeeping` (
  `timekeeping_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `work_date` date NOT NULL,
  `status` enum('Present','Absent','Late','Leave') DEFAULT 'Present',
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `location_address` varchar(255) DEFAULT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `face_image_url` varchar(255) DEFAULT NULL,
  `face_verified` tinyint(1) DEFAULT 1,
  `match_confidence` decimal(5,2) DEFAULT 98.50,
  `notes` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `timekeeping`
--

INSERT INTO `timekeeping` (`timekeeping_id`, `employee_id`, `work_date`, `status`, `check_in`, `check_out`, `latitude`, `longitude`, `location_address`, `device_info`, `face_image_url`, `face_verified`, `match_confidence`, `notes`) VALUES
(1, 2, '2026-08-04', 'Late', '14:35:57', '14:36:12', 10.83480407, 106.63652891, 'Hẻm 54/75 Bùi Quang Là, Khu phố 16, Phường An Hội Tây, Thuận An, Thành phố Hồ Chí Minh, 71509, Việt Nam', 'Browser Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb', NULL, 1, 98.50, 'Định vị GPS chính xác ±124m | Định vị GPS chính xác ±124m'),
(2, 5, '2026-08-04', 'Late', '20:59:42', '21:00:26', 10.83481648, 106.63652603, 'Hẻm 74 Bùi Quang Là, Khu phố 15, Phường An Hội Tây, Thuận An, Thành phố Hồ Chí Minh, 71427, Việt Nam', 'Browser AI Camera • Mozilla/5.0 (Windows NT 10.0; Win64; x64', '/uploads/face_5_1785851982704.jpg', 1, 98.50, 'Đã xác thực AI khuôn mặt (98.5%) + GPS ±117m | Đã xác thực AI khuôn mặt (98.5%) + GPS ±121m'),
(3, 6, '2026-08-04', 'Late', '21:07:28', NULL, 10.83485025, 106.63647016, 'Hẻm 74 Bùi Quang Là, Khu phố 15, Phường An Hội Tây, Thuận An, Thành phố Hồ Chí Minh, 71427, Việt Nam', 'Browser AI Camera • Mozilla/5.0 (Windows NT 10.0; Win64; x64', '/uploads/face_6_1785852448081.jpg', 1, 98.50, 'Đã xác thực AI khuôn mặt (98.5%) + GPS ±115m'),
(4, 4, '2026-08-22', 'Present', '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, 1, 98.50, 'Tự động chốt công ngày đi tour theo đơn hàng #BKG-24 đã được duyệt'),
(5, 4, '2026-08-24', 'Present', '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, 1, 98.50, 'Giải trình quên chấm công (Quên Check-in) theo đơn #1'),
(6, 10, '2026-09-03', 'Late', '09:19:50', NULL, 19.04385760, 105.42948170, 'Tọa độ GPS: 19.04386°N, 105.42948°E (±279m)', 'Browser AI Live Camera • Mozilla/5.0 (Windows NT 10.0; Win64; x64', '/uploads/face_10_1788401990425.jpg', 1, 98.50, 'Xác thực AI khuôn mặt camera trực tiếp (98.5%) + GPS ±279m');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tours`
--

CREATE TABLE `tours` (
  `tour_id` int(11) NOT NULL,
  `tour_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `duration_days` int(11) DEFAULT NULL,
  `base_price` decimal(15,2) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Approved','Active','Inactive','Rejected') DEFAULT 'Pending',
  `created_by` int(11) DEFAULT NULL,
  `base_cost` decimal(15,2) DEFAULT 0.00 COMMENT 'Tổng chi phí gốc ghép dịch vụ',
  `markup_percent` int(11) DEFAULT 20 COMMENT 'Tỉ lệ lợi nhuận mong muốn (%)',
  `design_data` longtext DEFAULT NULL COMMENT 'Lưu trạng thái UI kéo thả',
  `rejection_reason` text DEFAULT NULL,
  `is_custom` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `tours`
--

INSERT INTO `tours` (`tour_id`, `tour_name`, `description`, `destination`, `duration_days`, `base_price`, `image_url`, `status`, `created_by`, `base_cost`, `markup_percent`, `design_data`, `rejection_reason`, `is_custom`) VALUES
(7, 'Khám phá Đà Lạt', 'Khám phá thành phố ngàn hoa', 'Đà Lạt', 3, 3036000.00, '/uploads/74691fd358e36379d4a32e8986a561e9', 'Inactive', 4, 2640000.00, 15, '{\"fixedServices\":{\"accommodation\":[{\"id\":\"ext_hotel_3_1783564192169\",\"name\":\"Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm\",\"type\":\"🏨 Lưu trú\",\"price\":\"1000000.00\",\"original_id\":\"hotel_3\"}],\"transport\":[{\"id\":\"ext_transport_8_1783564187414\",\"name\":\"Nhà xe Phương Trang (FUTA Bus) - Vé xe giường nằm - Khứ hồi\",\"type\":\"✈️ Di chuyển\",\"price\":\"600000.00\",\"original_id\":\"transport_8\"}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"Ngày 1\",\"slots\":{\"morning\":[{\"id\":\"ext_act_1_1783564180045\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0,\"original_id\":\"act_1\"}],\"noon\":[{\"id\":\"ext_place_8_1783564199672\",\"name\":\"Đỉnh Langbiang\",\"type\":\"🎟️ Tham quan\",\"price\":\"120000.00\",\"original_id\":\"place_8\"}],\"evening\":[{\"id\":\"ext_place_13_1783564269657\",\"name\":\"Chợ Đêm Âm Phủ\",\"type\":\"🎟️ Tham quan\",\"price\":\"50000.00\",\"original_id\":\"place_13\"},{\"id\":\"ext_act_2_1_1783564180045\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0,\"original_id\":\"act_2\"}]}},{\"dayIndex\":2,\"dateString\":\"Ngày 2\",\"slots\":{\"morning\":[{\"id\":\"ext_place_9_1783564233754\",\"name\":\"Thác Datanla\",\"type\":\"🎟️ Tham quan\",\"price\":\"170000.00\",\"original_id\":\"place_9\"}],\"noon\":[{\"id\":\"ext_place_10_1783564236199\",\"name\":\"Vườn thú Zoodoo\",\"type\":\"🎟️ Tham quan\",\"price\":\"100000.00\",\"original_id\":\"place_10\"}],\"evening\":[{\"id\":\"ext_place_12_1783564242972\",\"name\":\"Lẩu gà lá é Tao Ngộ\",\"type\":\"🎟️ Tham quan\",\"price\":\"150000.00\",\"original_id\":\"place_12\"},{\"id\":\"ext_act_2_2_1783564180045\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0,\"original_id\":\"act_2\"}]}},{\"dayIndex\":3,\"dateString\":\"Ngày 3\",\"slots\":{\"morning\":[{\"id\":\"ext_act_2_3_1783564180045\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0,\"original_id\":\"act_2\"}],\"noon\":[{\"id\":\"ext_place_14_1783564275740\",\"name\":\"Samten Hills Dalat\",\"type\":\"🎟️ Tham quan\",\"price\":\"250000.00\",\"original_id\":\"place_14\"}],\"evening\":[{\"id\":\"ext_place_11_1783564253510\",\"name\":\"Lẩu bò Ba Toa Quán Gỗ\",\"type\":\"🎟️ Tham quan\",\"price\":\"200000.00\",\"original_id\":\"place_11\"},{\"id\":\"ext_act_3_1783564180045\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0,\"original_id\":\"act_3\"}]}}]}', NULL, 0),
(8, 'Khám phá Phú Quốc', '', 'Phú Quốc', 3, 4271600.00, '/uploads/2caf891f3b5404c5d53fb225dbc185b7', 'Pending', 4, 3620000.00, 18, '{\"days\":[{\"dayIndex\":1,\"route_title\":\"Khám phá Phú Quốc - Ngày 1\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Sun World Hòn Thơm\",\"price\":600000},{\"type\":\"Tham quan\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0}],\"accommodation\":{\"name\":\"Vinpearl Resort Phú Quốc - Phòng Tiêu chuẩn (Standard) - Đêm\",\"price\":\"1500000.00\",\"service_id\":\"existing\"},\"meals\":{\"breakfast\":true,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"route_title\":\"Khám phá Phú Quốc - Ngày 2\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Vinpearl Safari Phú Quốc\",\"price\":650000},{\"type\":\"Tham quan\",\"name\":\"Bãi Sao\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Grand World Phú Quốc\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0}],\"accommodation\":{\"name\":\"Vinpearl Resort Phú Quốc - Phòng Tiêu chuẩn (Standard) - Đêm\",\"price\":\"1500000.00\",\"service_id\":\"existing\"},\"meals\":{\"breakfast\":true,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"route_title\":\"Khám phá Phú Quốc - Ngày 3\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Bún quậy Kiến Xây\",\"price\":70000},{\"type\":\"Tham quan\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Chợ đêm Dinh Cậu\",\"price\":200000}],\"accommodation\":{\"name\":\"Vinpearl Resort Phú Quốc - Phòng Tiêu chuẩn (Standard) - Đêm\",\"price\":\"1500000.00\",\"service_id\":\"existing\"},\"meals\":{\"breakfast\":true,\"lunch\":true,\"dinner\":true}}],\"costConfig\":{\"minimumPax\":15,\"margin\":18,\"selectedTransport\":{\"name\":\"Nhà xe Phương Trang (FUTA Bus) - Vé xe giường nằm - Khứ hồi\",\"price\":\"600000.00\"},\"transportTimes\":{\"startD\":\"07:00\",\"endD\":\"11:30\",\"startR\":\"13:00\",\"endR\":\"18:00\"},\"fixed\":{\"guidePerDay\":500000},\"variable\":{\"breakfast\":100000,\"lunch\":150000,\"dinner\":200000}},\"computed\":{\"netCost\":3620000,\"sellingPrice\":4271600,\"totalDays\":3,\"totalNights\":2},\"categories\":[\"Khám phá\",\"Nghỉ dưỡng\"],\"highlights\":\"Khám phá các điểm đến hấp dẫn và thưởng thức đặc sản tuyệt vời\"}', NULL, 0),
(9, 'Tour Đà Lạt ', '', 'Đà Lạt', 3, 4248000.00, '/uploads/985ba96391367fa25195b9f957ffa672', 'Pending', 4, 3540000.00, 20, '{\"days\":[{\"dayIndex\":1,\"route_title\":\"Tour Đà Lạt  - Ngày 1\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Vườn thú Zoodoo\",\"price\":100000},{\"type\":\"Tham quan\",\"name\":\"Lẩu bò Ba Toa Quán Gỗ\",\"price\":200000},{\"type\":\"Tham quan\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0}],\"accommodation\":{\"name\":\"Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm\",\"price\":\"1000000.00\",\"service_id\":\"existing\"},\"meals\":{\"breakfast\":true,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"route_title\":\"Tour Đà Lạt  - Ngày 2\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Đỉnh Langbiang\",\"price\":120000},{\"type\":\"Tham quan\",\"name\":\"Lẩu gà lá é Tao Ngộ\",\"price\":150000},{\"type\":\"Tham quan\",\"name\":\"Chợ Đêm Âm Phủ\",\"price\":50000},{\"type\":\"Tham quan\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0}],\"accommodation\":{\"name\":\"Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm\",\"price\":\"1000000.00\",\"service_id\":\"existing\"},\"meals\":{\"breakfast\":true,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"route_title\":\"Tour Đà Lạt  - Ngày 3\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Thác Datanla\",\"price\":170000},{\"type\":\"Tham quan\",\"name\":\"Samten Hills Dalat\",\"price\":250000},{\"type\":\"Tham quan\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0}],\"accommodation\":{\"name\":\"Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm\",\"price\":\"1000000.00\",\"service_id\":\"existing\"},\"meals\":{\"breakfast\":true,\"lunch\":true,\"dinner\":true}}],\"costConfig\":{\"minimumPax\":15,\"margin\":18,\"selectedTransport\":{\"name\":\"Dịch vụ xe ghép 16 chỗ - Thuê xe Du lịch 16 chỗ - Ngày\",\"price\":\"1500000.00\"},\"transportTimes\":{\"startD\":\"07:00\",\"endD\":\"11:30\",\"startR\":\"13:00\",\"endR\":\"18:00\"},\"fixed\":{\"guidePerDay\":500000},\"variable\":{\"breakfast\":100000,\"lunch\":150000,\"dinner\":200000}},\"computed\":{\"netCost\":3620000,\"sellingPrice\":4271600,\"totalDays\":3,\"totalNights\":2},\"categories\":[\"Khám phá\",\"Nghỉ dưỡng\"],\"highlights\":\"Khám phá các điểm đến hấp dẫn và thưởng thức đặc sản tuyệt vời\"}', NULL, 0),
(10, 'Khám phá Phú Quốc ', '', 'Phú Quốc', 3, 6984000.00, '/uploads/1784651147243-499615130.jpg', 'Inactive', 4, 5820000.00, 20, '{\"fixedServices\":{\"accommodation\":[{\"id\":\"ext_hotel_5_1784626478505\",\"name\":\"Vinpearl Resort Phú Quốc - Phòng Tiêu chuẩn (Standard) - Đêm\",\"type\":\"🏨 Lưu trú\",\"price\":\"1500000.00\",\"original_id\":\"hotel_5\"}],\"transport\":[{\"id\":\"ext_transport_7_1784626467429\",\"name\":\"Vietnam Airlines - Vé máy bay Khứ hồi - Phổ thông\",\"type\":\"✈️ Di chuyển\",\"price\":\"2800000.00\",\"original_id\":\"transport_7\"}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"Ngày 1\",\"slots\":{\"morning\":[{\"id\":\"ext_act_1_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0,\"original_id\":\"act_1\"}],\"noon\":[{\"id\":\"ext_act_2_1_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"},{\"id\":\"ext_place_15_1784626488681\",\"name\":\"Sun World Hòn Thơm\",\"type\":\"🎟️ Tham quan\",\"price\":\"600000.00\",\"original_id\":\"place_15\"}],\"evening\":[{\"id\":\"ext_place_19_1784626492543\",\"name\":\"Bún quậy Kiến Xây\",\"type\":\"🎟️ Tham quan\",\"price\":\"70000.00\",\"original_id\":\"place_19\"}]}},{\"dayIndex\":2,\"dateString\":\"Ngày 2\",\"slots\":{\"morning\":[{\"id\":\"ext_place_16_1784626503112\",\"name\":\"Vinpearl Safari Phú Quốc\",\"type\":\"🎟️ Tham quan\",\"price\":\"650000.00\",\"original_id\":\"place_16\"}],\"noon\":[{\"id\":\"ext_act_2_2_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"}],\"evening\":[{\"id\":\"ext_place_20_1784626507944\",\"name\":\"Chợ đêm Dinh Cậu\",\"type\":\"🎟️ Tham quan\",\"price\":\"200000.00\",\"original_id\":\"place_20\"}]}},{\"dayIndex\":3,\"dateString\":\"Ngày 3\",\"slots\":{\"morning\":[{\"id\":\"ext_place_18_1784626515233\",\"name\":\"Bãi Sao\",\"type\":\"🎟️ Tham quan\",\"price\":\"0.00\",\"original_id\":\"place_18\"}],\"noon\":[{\"id\":\"ext_act_2_3_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"},{\"id\":\"ext_place_17_1784626511158\",\"name\":\"Grand World Phú Quốc\",\"type\":\"🎟️ Tham quan\",\"price\":\"0.00\",\"original_id\":\"place_17\"}],\"evening\":[{\"id\":\"ext_act_3_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0,\"original_id\":\"act_3\"}]}}]}', NULL, 0),
(27, 'Khám phá Đà Lạt - Nha Trang 4N3Đ', '', '2', 4, 7636000.00, '/uploads/1786955134884-399383371.jpg', 'Pending', 4, 6363333.00, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"18\",\"end_destination_id\":\"2\",\"route_title\":\"Hồ Chí Minh - Đà Lạt\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Di chuyển từ Hồ Chí Minh đến Đà Lạt\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Đến khách sạn nhận phòng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đỉnh Langbiang\",\"price\":\"120000.00\",\"place_id\":8},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Datanla\",\"price\":\"170000.00\",\"place_id\":9},{\"type\":\"Tham quan\",\"name\":\"Tham quan Vườn thú Zoodoo\",\"price\":\"100000.00\",\"place_id\":10},{\"type\":\"Nghỉ ngơi\",\"name\":\"Dùng bữa tối tại nhà hàng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ Đêm Âm Phủ\",\"price\":\"50000.00\",\"place_id\":13}],\"isTitleEdited\":false,\"accommodation\":{\"service_id\":8,\"name\":\"Phòng Superior (hoặc tương đương)\",\"price\":\"1300000.00\",\"meals\":{\"breakfast\":false,\"lunch\":false,\"dinner\":false}}},{\"dayIndex\":2,\"start_destination_id\":\"2\",\"end_destination_id\":\"1\",\"route_title\":\"Đà Lạt - Nha Trang\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Samten Hills Dalat\",\"price\":\"250000.00\",\"place_id\":14},{\"type\":\"Nghỉ ngơi\",\"name\":\"Di chuyển từ Đà Lạt đến Nha Trang\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Đến khách sạn nhận phòng\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"isTitleEdited\":false,\"accommodation\":{\"service_id\":7,\"name\":\"Phòng Standard Hướng Phố (hoặc tương đương)\",\"price\":\"900000.00\",\"meals\":{\"breakfast\":true,\"lunch\":false,\"dinner\":false}}},{\"dayIndex\":3,\"start_destination_id\":\"1\",\"end_destination_id\":\"1\",\"route_title\":\"Nha Trang - Thành phố biển\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành tham quan tại Nha Trang\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan VinWonders Nha Trang\",\"price\":\"880000.00\",\"place_id\":1},{\"type\":\"Tham quan\",\"name\":\"Tham quan Lặn biển Hòn Mun\",\"price\":\"500000.00\",\"place_id\":3},{\"type\":\"Tham quan\",\"name\":\"Tham quan Tháp Bà Ponagar\",\"price\":\"30000.00\",\"place_id\":2},{\"type\":\"Tham quan\",\"name\":\"Tham quan Tắm bùn khoáng I-Resort\",\"price\":\"350000.00\",\"place_id\":4},{\"type\":\"Nghỉ ngơi\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Dùng bữa tối tại nhà hàng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ Đêm Nha Trang\",\"price\":\"0.00\",\"place_id\":6}],\"isTitleEdited\":false,\"accommodation\":{\"service_id\":7,\"name\":\"Phòng Standard Hướng Phố (hoặc tương đương)\",\"price\":\"900000.00\",\"meals\":{\"breakfast\":true,\"lunch\":false,\"dinner\":false}}},{\"dayIndex\":4,\"start_destination_id\":\"1\",\"end_destination_id\":\"18\",\"route_title\":\"Nha Trang - Hồ Chí Minh\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Hải sản Thanh Sương\",\"price\":\"250000.00\",\"place_id\":7},{\"type\":\"Tham quan\",\"name\":\"Tham quan Nem nướng Đặng Văn Quyên\",\"price\":\"60000.00\",\"place_id\":5},{\"type\":\"Nghỉ ngơi\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành về Hồ Chí Minh\",\"price\":0}],\"isTitleEdited\":false}],\"costConfig\":{\"minimumPax\":15,\"margin\":20,\"fixed\":{\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":\"200000\",\"lunch\":\"200000\",\"dinner\":\"200000\",\"tickets\":0,\"insurance\":0},\"ageMultiplier\":{\"child\":75,\"infant\":25},\"selectedTransport\":{\"service_id\":4,\"name\":\"Thuê xe Du lịch 16 chỗ / Ngày\",\"unit\":\"Xe/Ngày\",\"price\":\"1200000.00\"},\"transportTimes\":{\"startD\":\"05:30\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"17:30\"}},\"computed\":{\"netCost\":6363333,\"sellingPrice\":7636000,\"totalDays\":4,\"totalNights\":3,\"totalMeals\":{\"breakfast\":1,\"lunch\":4,\"dinner\":3},\"autoTicketsCost\":2760000,\"autoAccommodationCost\":1550000,\"autoFixedTransport\":4800000,\"autoVariableTransport\":0},\"dayImages\":{\"1\":\"/uploads/1786953540270-33229155.jpg\"}}', NULL, 0),
(29, 'Khám phá Đà Lạt - Nha Trang', 'Bạn có thể tự do khám phá thiên nhiên kỳ thú, tận hưởng trọn vẹn từng khoảng khắc bên bạn bè và người thân', 'Đà Lạt', 4, 7599000.00, '/uploads/1787155033861-300696428.jpg', 'Active', 4, 6312666.67, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"18\",\"end_destination_id\":\"2\",\"route_title\":\"Hồ Chí Minh - Đà Lạt\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Di chuyển từ Hồ Chí Minh đến Đà Lạt\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Đến khách sạn nhận phòng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đỉnh Langbiang\",\"price\":\"120000.00\",\"place_id\":8},{\"type\":\"Tham quan\",\"name\":\"Tham quan Vườn thú Zoodoo\",\"price\":\"100000.00\",\"place_id\":10},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Datanla\",\"price\":\"170000.00\",\"place_id\":9},{\"type\":\"Nghỉ ngơi\",\"name\":\"Dùng bữa tối tại nhà hàng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ Đêm Âm Phủ\",\"price\":\"50000.00\",\"place_id\":13}],\"accommodation\":{\"service_id\":8,\"name\":\"Phòng Superior (hoặc tương đương)\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":\"external\",\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"2\",\"end_destination_id\":\"1\",\"route_title\":\"Đà Lạt - Nha Trang\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Samten Hills Dalat\",\"price\":\"250000.00\",\"place_id\":14},{\"type\":\"Nghỉ ngơi\",\"name\":\"Di chuyển từ Đà Lạt đến Nha Trang\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Đến khách sạn nhận phòng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Lặn biển Hòn Mun\",\"price\":\"500000.00\",\"place_id\":3},{\"type\":\"Nghỉ ngơi\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Dùng bữa tối tại nhà hàng\",\"price\":0}],\"accommodation\":{\"service_id\":7,\"name\":\"Phòng Standard Hướng Phố (hoặc tương đương)\",\"price\":\"900000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"1\",\"end_destination_id\":\"1\",\"route_title\":\"Nha Trang - Thành phố biển\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành tham quan tại Nha Trang\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan VinWonders Nha Trang\",\"price\":\"880000.00\",\"place_id\":1},{\"type\":\"Tham quan\",\"name\":\"Tham quan Tháp Bà Ponagar\",\"price\":\"30000.00\",\"place_id\":2},{\"type\":\"Tham quan\",\"name\":\"Tham quan Tắm bùn khoáng I-Resort\",\"price\":\"350000.00\",\"place_id\":4},{\"type\":\"Tham quan\",\"name\":\"Tham quan Nem nướng Đặng Văn Quyên\",\"price\":\"60000.00\",\"place_id\":5},{\"type\":\"Nghỉ ngơi\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Dùng bữa tối tại nhà hàng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ Đêm Nha Trang\",\"price\":\"0.00\",\"place_id\":6}],\"accommodation\":{\"service_id\":7,\"name\":\"Phòng Standard Hướng Phố (hoặc tương đương)\",\"price\":\"900000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":4,\"start_destination_id\":\"1\",\"end_destination_id\":\"18\",\"route_title\":\"Nha Trang - Hồ Chí Minh\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Hải sản Thanh Sương\",\"price\":\"250000.00\",\"place_id\":7},{\"type\":\"Nghỉ ngơi\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành về Hồ Chí Minh\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":15,\"margin\":20.377019748653492,\"fixed\":{\"transport\":7040000,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":200000,\"lunch\":200000,\"dinner\":200000,\"tickets\":0,\"insurance\":0,\"transportTicket\":0},\"ageMultiplier\":{\"child\":{\"percent\":50,\"fixed_surcharge\":0},\"toddler\":{\"percent\":0,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"road\"},\"selectedTransport\":{\"service_id\":15,\"service_name\":\"Xe Thaco 29 Chỗ\",\"service_type\":\"Xe vận chuyển\",\"description\":\"\",\"image_url\":\"/uploads/1786210745118-332571067.jpg\",\"status\":\"Active\",\"partner_id\":null,\"destination_id\":null,\"unit\":\"Xe/Ngày\",\"base_cost\":\"1760000.00\",\"selling_price\":\"2200000.00\",\"capacity\":0,\"attributes\":\"{}\",\"action_verb\":null,\"short_display_name\":null,\"partner_name\":null,\"destination_name\":null,\"proposed_cost\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"05:30\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"17:30\"}},\"computed\":{\"netCost\":6312666.666666667,\"sellingPrice\":7599000,\"totalDays\":4,\"totalNights\":3,\"totalMeals\":{\"breakfast\":0,\"lunch\":4,\"dinner\":3},\"autoTicketsCost\":2760000},\"categories\":[\"Nghỉ dưỡng\",\"Khám phá\",\"Văn hóa\",\"Biển đảo\",\"Gia đình\"],\"highlights\":\"Tặng đặt sản địa phương\\nKhám phá vẻ đẹp tự nhiên, hoang sơ\",\"dayImages\":{\"1\":\"/uploads/1787155033875-510651347.webp\",\"2\":\"/uploads/1787155033878-433529452.jpg\",\"3\":\"/uploads/1787155033878-395761434.webp\",\"4\":\"/uploads/1787155033882-633882125.jpg\"}}', NULL, 0),
(31, 'Khám phá Đảo Ngọc Phú Quốc 3N2Đ (Cao cấp)', 'Trải nghiệm kỳ nghỉ dưỡng đẳng cấp tại Phú Quốc cùng vé máy bay khứ hồi và khách sạn 5 sao.', 'Phú Quốc', 3, 9924000.00, '/uploads/1787457747363-251721431.png', 'Active', 4, 8270000.00, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"18\",\"end_destination_id\":\"3\",\"route_title\":\"Hồ Chí Minh - Phú Quốc\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Bay đến Phú Quốc\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Sun World Hòn Thơm\",\"price\":\"600000.00\",\"place_id\":15},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ đêm Dinh Cậu\",\"price\":\"200000.00\",\"place_id\":20}],\"accommodation\":{\"service_id\":10,\"name\":\"Emerald Bay View (JW Marriott)\",\"price\":\"5000000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"3\",\"end_destination_id\":\"3\",\"route_title\":\"Phú Quốc - Tuyệt tác thiên nhiên\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Vinpearl Safari Phú Quốc\",\"price\":\"650000.00\",\"place_id\":16},{\"type\":\"Tham quan\",\"name\":\"Tham quan Grand World Phú Quốc\",\"price\":\"0.00\",\"place_id\":17},{\"type\":\"Tham quan\",\"name\":\"Tham quan Bãi Sao\",\"price\":\"0.00\",\"place_id\":18}],\"accommodation\":{\"service_id\":10,\"name\":\"Emerald Bay View (JW Marriott)\",\"price\":\"5000000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"3\",\"end_destination_id\":\"18\",\"route_title\":\"Phú Quốc - Hồ Chí Minh\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Bún quậy Kiến Xây\",\"price\":\"70000.00\",\"place_id\":19},{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành về Hồ Chí Minh\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":200000,\"lunch\":200000,\"dinner\":200000,\"tickets\":0,\"insurance\":0},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Vé máy bay Khứ hồi - Phổ thông\",\"unit\":\"Vé\",\"price\":\"2200000.00\"},\"transportTimes\":{\"startD\":\"05:30\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"17:30\"}},\"computed\":{\"netCost\":8270000,\"sellingPrice\":9924000,\"totalDays\":3,\"totalNights\":2,\"totalMeals\":{\"breakfast\":0,\"lunch\":3,\"dinner\":2},\"autoTicketsCost\":1520000},\"categories\":[\"Biển đảo\",\"Khám phá\",\"Nghỉ dưỡng cao cấp\"],\"highlights\":\"\",\"dayImages\":{\"1\":\"/uploads/1787457747380-101710045.jpg\",\"2\":\"/uploads/1787457747382-812222074.jpg\",\"3\":\"/uploads/1787457747383-723507097.jpg\"}}', NULL, 0),
(32, 'Tour Đà Nẵng - Bà Nà Hills - Phố Cổ Hội An 3N2Đ', 'Khám phá thành phố đáng sống Đà Nẵng, chiêm ngưỡng Cầu Vàng trên đỉnh Bà Nà Hills, dạo phố cổ Hội An rực rỡ đèn lồng và tắm biển Mỹ Khê tuyệt đẹp.', 'Đà Nẵng', 3, 4250000.00, '/uploads/19466_TOUR_ĐÀ_NẴNG_3N2Đ_BÀ_NÀ_-_PHỐ_CỔ_HỘI_AN.jpg', 'Active', 1, 3541666.67, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"32\",\"end_destination_id\":\"32\",\"route_title\":\"TP.HCM / Hà Nội - Đà Nẵng - Sơn Trà - Biển Mỹ Khê\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Đón đoàn tại Sân bay Đà Nẵng / Bến xe\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Viếng Chùa Linh Ứng Bán Đảo Sơn Trà & Tượng Phật Bà 67m\",\"price\":100000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Tự do tắm biển Mỹ Khê & Thưởng thức hải sản biển\",\"price\":250000}],\"accommodation\":{\"service_id\":1,\"name\":\"Khách sạn 4★ Sala Đà Nẵng Beach\",\"price\":\"1200000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"32\",\"end_destination_id\":\"32\",\"route_title\":\"Đà Nẵng - Bà Nà Hills - Cầu Vàng - Phố Cổ Hội An\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Đi cáp treo Bà Nà Hills & Check-in Cầu Vàng bàn tay khổng lồ\",\"price\":900000},{\"type\":\"Tham quan\",\"name\":\"Khám phá Làng Pháp & Vui chơi Công viên Fantasy Park\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Dạo Phố Cổ Hội An lung linh đèn lồng & Thưởng thức Cao Lầu\",\"price\":150000}],\"accommodation\":{\"service_id\":1,\"name\":\"Khách sạn 4★ Sala Đà Nẵng Beach\",\"price\":\"1200000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"32\",\"end_destination_id\":\"32\",\"route_title\":\"Đà Nẵng - Mua Sắm Đặc Sản - Tiễn Sân Bay\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Danh thắng Ngũ Hành Sơn & Làng đá mỹ nghệ Non Nước\",\"price\":50000},{\"type\":\"Tham quan\",\"name\":\"Mua sắm đặc sản Chả bò Đà Nẵng & Trái cây sấy tại Chợ Cồn\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Xe tiễn đoàn ra Sân bay Đà Nẵng - Kết thúc chương trình\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch 29 chỗ đời mới / Vé máy bay khứ hồi\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":3541667,\"sellingPrice\":4250000,\"totalDays\":3,\"totalNights\":2,\"totalMeals\":{\"breakfast\":2,\"lunch\":3,\"dinner\":2},\"autoTicketsCost\":1200000},\"categories\":[\"Biển đảo\",\"Khám phá\",\"Văn hóa\"],\"highlights\":\"Đi cáp treo Bà Nà Hills, check-in Cầu Vàng, phố cổ Hội An đêm lung linh, tắm biển Mỹ Khê\"}', NULL, 0),
(33, 'Tour Đà Nẵng - Huế - Bà Nà - Động Phong Nha 5N4Đ', 'Hành trình di sản Miền Trung tuyệt vời xuyên Việt qua Đà Nẵng, Cố đô Huế cổ kính và hành trình khám phá kỳ quan Động Phong Nha hùng vĩ tại Quảng Bình.', 'Đà Nẵng', 5, 6850000.00, '/uploads/19070_TOUR_ĐÀ_NẴNG_MÙA_HÈ_5N4Đ_BÀ_NÀ_-_HỘI_AN_-_HUẾ_-_ĐỘNG_PHONG_NHA.jpg', 'Active', 1, 5708333.33, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"33\",\"end_destination_id\":\"33\",\"route_title\":\"Đón đoàn Đà Nẵng - Bán đảo Sơn Trà - Phố cổ Hội An\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Đón đoàn tại Đà Nẵng, nhận phòng nghỉ ngơi\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Bán đảo Sơn Trà & Thả hoa đăng Phố cổ Hội An\",\"price\":150000}],\"accommodation\":{\"service_id\":2,\"name\":\"Khách sạn 4★ Mường Thanh Đà Nẵng\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"33\",\"end_destination_id\":\"33\",\"route_title\":\"Đà Nẵng - KDL Bà Nà Hills - Cầu Vàng - Cầu Rồng Phun Nước\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Chinh phục Bà Nà Hills bằng cáp treo đạt 4 kỷ lục thế giới\",\"price\":900000},{\"type\":\"Tham quan\",\"name\":\"Ngắm Cầu Rồng & Cầu Tình Yêu sông Hàn về đêm\",\"price\":0}],\"accommodation\":{\"service_id\":2,\"name\":\"Khách sạn 4★ Mường Thanh Đà Nẵng\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"33\",\"end_destination_id\":\"33\",\"route_title\":\"Đà Nẵng - Đèo Hải Vân - Cố Đô Huế - Đại Nội - Chùa Thiên Mụ\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Vượt Đèo Hải Vân thiên hạ đệ nhất hùng quan ra Huế\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đại Nội Hoàng Thành Huế & Chùa Thiên Mụ cổ kính\",\"price\":200000},{\"type\":\"Tham quan\",\"name\":\"Nghe ca trù & Thả hoa đăng trên Sông Hương\",\"price\":150000}],\"accommodation\":{\"service_id\":3,\"name\":\"Khách sạn 4★ Century Riverside Huế\",\"price\":\"1200000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":4,\"start_destination_id\":\"33\",\"end_destination_id\":\"33\",\"route_title\":\"Huế - Quảng Bình - Khám Phá Động Thiên Đường Kỳ Vĩ\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Khởi hành ra Quảng Bình qua Thánh địa La Vang\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Khám phá Động Thiên Đường - Hoàng cung trong lòng đất\",\"price\":250000}],\"accommodation\":{\"service_id\":4,\"name\":\"Khách sạn 4★ Mường Thanh Quảng Bình\",\"price\":\"1250000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":5,\"start_destination_id\":\"33\",\"end_destination_id\":\"33\",\"route_title\":\"Quảng Bình - Viếng Mộ Đại Tướng - Tiễn Đoàn\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Viếng mộ Đại tướng Võ Nguyên Giáp tại Vũng Chùa Đảo Yến\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Mua sắm đặc sản Nón lá, Mắm tôm chua Cố Đô & Tiễn sân bay\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch VIP 35 chỗ cao cấp\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":5708333,\"sellingPrice\":6850000,\"totalDays\":5,\"totalNights\":4,\"totalMeals\":{\"breakfast\":4,\"lunch\":5,\"dinner\":4},\"autoTicketsCost\":1200000},\"categories\":[\"Văn hóa\",\"Di sản\",\"Khám phá\"],\"highlights\":\"Khám phá Bà Nà Hills, Cố đồ Huế, Đại Nội Hoàng Thành, Động Thiên Đường Quảng Bình\"}', NULL, 0),
(34, 'Tour Phú Quốc 3N2Đ: Grand World - VinWonders - Cáp Treo Hòn Thơm', 'Trải nghiệm thiên đường nghỉ dưỡng Đảo Ngọc Phú Quốc, tham quan thành phố không ngủ Grand World, công viên chủ đề VinWonders và cáp treo Hòn Thơm vượt biển dài nhất thế giới.', 'Phú Quốc', 3, 5490000.00, '/uploads/19464_TOUR_PHÚ_QUỐC_3N2Đ_GRAND_WORLD_-_VINWONDERS_-_CÁP_TREO_HÒN_THƠM.jpg', 'Active', 1, 4575000.00, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"34\",\"end_destination_id\":\"34\",\"route_title\":\"Đón khách Sân bay Phú Quốc - Check-in Grand World\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Bay đến Đảo Ngọc Phú Quốc, xe đưa về khách sạn\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Khám phá Grand World - Kênh đào Venice & Show Tinh Hoa Việt Nam\",\"price\":300000}],\"accommodation\":{\"service_id\":5,\"name\":\"Vinholidays Fiesta Phú Quốc 4★\",\"price\":\"1800000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"34\",\"end_destination_id\":\"34\",\"route_title\":\"Trải Nghiệm Cáp Treo Hòn Thơm - Bãi Sao - Tự Do Tắm Biển\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Đi cáp treo Hòn Thơm vượt biển dài nhất thế giới 7.899m\",\"price\":600000},{\"type\":\"Tham quan\",\"name\":\"Vui chơi Công viên nước Aquatopia & Tắm biển Bãi Sao\",\"price\":0}],\"accommodation\":{\"service_id\":5,\"name\":\"Vinholidays Fiesta Phú Quốc 4★\",\"price\":\"1800000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"34\",\"end_destination_id\":\"34\",\"route_title\":\"Chợ Đêm Dinh Cậu - Bún Quậy Kiến Xây - Tiễn Sân Bay\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Thưởng thức Bún quậy Kiến Xây & Mua sắm Rượu sim Phú Quốc\",\"price\":70000},{\"type\":\"Tham quan\",\"name\":\"Tham quan Cơ sở nuôi cấy Ngọc Trai cao cấp & Tiễn sân bay\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Vé máy bay Khứ hồi Phú Quốc & Xe đưa đón\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":4575000,\"sellingPrice\":5490000,\"totalDays\":3,\"totalNights\":2,\"totalMeals\":{\"breakfast\":2,\"lunch\":3,\"dinner\":2},\"autoTicketsCost\":1200000},\"categories\":[\"Biển đảo\",\"Nghỉ dưỡng\",\"Công viên giải trí\"],\"highlights\":\"Thành phố không ngủ Grand World, Show Tinh Hoa Việt Nam, Cáp treo Hòn Thơm\"}', NULL, 0),
(35, 'Tour Phú Quốc Hè 3N2Đ: Grand World - VinWonders - Safari - Hòn Thơm', 'Chương trình du lịch Phú Quốc hè trọn gói cao cấp bao gồm vé Vinpearl Safari bán hoang dã, VinWonders, show diễn Tinh Hoa Việt Nam và dịch vụ nghỉ dưỡng resort 4 sao sát biển.', 'Phú Quốc', 3, 7990000.00, '/uploads/19465_TOUR_PHÚ_QUỐC_HÈ_3N2Đ_GRAND_WORLD_-_VINWONDERS_-_SAFARI_-_CÁP_TREO_HÒN_THƠM.jpg', 'Active', 1, 6658333.33, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"35\",\"end_destination_id\":\"35\",\"route_title\":\"Phú Quốc - Vinpearl Safari & VinWonders Đỉnh Cao\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Bay đến Phú Quốc, xe riêng đón về Vinpearl Resort 5★\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Khám phá Công viên vạn thú bán hoang dã Vinpearl Safari\",\"price\":650000},{\"type\":\"Tham quan\",\"name\":\"Vui chơi công viên chủ đề VinWonders & Thủy cung Cung Điện Hải Vương\",\"price\":950000}],\"accommodation\":{\"service_id\":6,\"name\":\"Vinpearl Resort & Spa Phú Quốc 5★\",\"price\":\"3500000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"35\",\"end_destination_id\":\"35\",\"route_title\":\"Tour 4 Đảo Cano Cao Tốc - Lặn Ngắm San Hô Bãi Thơm\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Cano lướt sóng thăm Hòn Mây Rút, Hòn Mầm Xương & Hòn Gầm Ghì\",\"price\":500000},{\"type\":\"Tham quan\",\"name\":\"Chụp hình SUP cá nhân & Lặn ngắm rạn san hô đa sắc màu\",\"price\":200000}],\"accommodation\":{\"service_id\":6,\"name\":\"Vinpearl Resort & Spa Phú Quốc 5★\",\"price\":\"3500000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"35\",\"end_destination_id\":\"35\",\"route_title\":\"Grand World - Thưởng Thức Hải Sản Bãi Trường - Tiễn Sân Bay\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Dạo thuyền Gondola phong cách Ý tại Grand World\",\"price\":200000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Tiễn sân bay Phú Quốc chuyến chiều - Kết thúc chuyến nghỉ dưỡng 5★\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Vé máy bay Hạng Phổ Thông Cao Cấp Khứ hồi\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":6658333,\"sellingPrice\":7990000,\"totalDays\":3,\"totalNights\":2,\"totalMeals\":{\"breakfast\":2,\"lunch\":3,\"dinner\":2},\"autoTicketsCost\":1200000},\"categories\":[\"Biển đảo\",\"Nghỉ dưỡng cao cấp\",\"Safari\"],\"highlights\":\"Vinpearl Safari bán hoang dã, VinWonders, Du thuyền lặn ngắm san hô, Khách sạn 5★\"}', NULL, 0),
(36, 'Tour Hạ Long - Tràng An - Sapa - Fansipan 4N3Đ', 'Chuyến du ngoạn Miền Bắc tuyệt mỹ kết hợp danh thắng Vịnh Hạ Long, quần thể danh thắng di sản Tràng An - Ninh Bình và đỉnh núi Fansipan mờ sương Sapa.', 'Hạ Long', 4, 5950000.00, '/uploads/19083_TOUR_MIỀN_BẮC_MÙA_HÈ_4N3Đ_HẠ_LONG_-_TRÀNG_AN_-_SAPA_-_FANSIPAN.jpg`', 'Active', 1, 4958333.33, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"36\",\"end_destination_id\":\"36\",\"route_title\":\"Hà Nội - Vịnh Hạ Long - Động Thiên Cung\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Đón đoàn tại Hà Nội khởi hành đi Quảng Ninh\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Lên thuyền ngắm Đỉnh Hương, Hòn Gà Chọi & Động Thiên Cung\",\"price\":350000}],\"accommodation\":{\"service_id\":7,\"name\":\"Khách sạn 4★ Mường Thanh Hạ Long\",\"price\":\"1200000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"36\",\"end_destination_id\":\"36\",\"route_title\":\"Hạ Long - Tràng An Ninh Bình - Khởi Hành Đi Sapa\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Đi thuyền trên dòng sông Sào Khê Quần thể Tràng An\",\"price\":250000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành theo đường cao tốc Nội Bài - Lao Cai lên Sapa\",\"price\":0}],\"accommodation\":{\"service_id\":8,\"name\":\"Khách sạn 4★ Sapa Horizon\",\"price\":\"1400000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"36\",\"end_destination_id\":\"36\",\"route_title\":\"Sapa - Chinh Phục Đỉnh Fansipan 3.143m - Bản Cát Cát\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Đi Cáp treo chinh phục Nóc nhà Đông Dương Fansipan\",\"price\":850000},{\"type\":\"Tham quan\",\"name\":\"Tham quan Bản Cát Cát người H\'Mông & Thác Thủy Điện\",\"price\":150000}],\"accommodation\":{\"service_id\":8,\"name\":\"Khách sạn 4★ Sapa Horizon\",\"price\":\"1400000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":4,\"start_destination_id\":\"36\",\"end_destination_id\":\"36\",\"route_title\":\"Sapa - Moana Sapa Check-in - Trở Về Hà Nội\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Check-in điểm sống ảo Moana Sapa & Mua đặc sản thịt trâu gắp bếp\",\"price\":100000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Trở về Hà Nội - Tiễn đoàn tại Sân bay Nội Bài\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch 29 chỗ đời mới toàn hành trình\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":4958333,\"sellingPrice\":5950000,\"totalDays\":4,\"totalNights\":3,\"totalMeals\":{\"breakfast\":3,\"lunch\":4,\"dinner\":3},\"autoTicketsCost\":1200000},\"categories\":[\"Khám phá\",\"Nghỉ dưỡng\",\"Vùng cao\"],\"highlights\":\"Vịnh Hạ Long, Tràng An Ninh Bình, Chinh phục Fansipan Sapa\"}', NULL, 0),
(37, 'Tour Vịnh Hạ Long 4N3Đ - Du Thuyền 5 Sao Sang Trọng', 'Đặc quyền nghỉ dưỡng trên du thuyền 5 sao vịnh Hạ Long, chèo thuyền Kayak ngắm hoàng hôn, tắm biển Đảo Ti Tốp và tham quan Sun World Hạ Long Park.', 'Hạ Long', 4, 8450000.00, '/uploads/19624_TOUR_MIỀN_BẮC_MÙA_HÈ_4N3Đ_VỊNH_HẠ_LONG_-_TRẢI_NGHIỆM_DU_THUYỀN_ĐẶC_QUYỀN_GIÁ_SUN.jpg', 'Active', 1, 7041666.67, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"37\",\"end_destination_id\":\"37\",\"route_title\":\"Hà Nội - Vịnh Hạ Long - Du Thuyền 5★ Ambassador Cruise\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Xe Limousine đón tại Hà Nội ra Cảng quốc tế Tuần Châu\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Check-in Du thuyền 5★ Ambassador Cruise & Thưởng thức Buffet Hải sản\",\"price\":2500000},{\"type\":\"Tham quan\",\"name\":\"Chèo thuyền Kayak ngắm hoàng hôn Vịnh Hạ Long\",\"price\":200000}],\"accommodation\":{\"service_id\":9,\"name\":\"Du thuyền 5★ Ambassador Cruise Hạ Long\",\"price\":\"4500000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"37\",\"end_destination_id\":\"37\",\"route_title\":\"Thăm Hang Sửng Sốt - Đảo TiTop - Ninh Bình Emeralda 5★\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Khám phá Hang Sửng Sốt - Hang động rộng đẹp nhất Vịnh\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Leo núi ngắm toàn cảnh Vịnh từ đỉnh Đảo TiTop\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Di chuyển về Ninh Bình, nhận phòng Emeralda Resort 5★\",\"price\":0}],\"accommodation\":{\"service_id\":10,\"name\":\"Emeralda Resort Ninh Bình 5★\",\"price\":\"2800000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"37\",\"end_destination_id\":\"37\",\"route_title\":\"Ninh Bình - Tuyệt Tình Cốc - Tràng An Đầm Vân Long - Hà Nội\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Check-in Tuyệt tình cốc Động Am Tiên Ninh Bình\",\"price\":100000},{\"type\":\"Tham quan\",\"name\":\"Đi thuyền sinh thái Đầm Vân Long ngắm Vọoc mông trắng\",\"price\":150000}],\"accommodation\":{\"service_id\":11,\"name\":\"Khách sạn 5★ Hotel de l\'Opera Hà Nội\",\"price\":\"3200000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":4,\"start_destination_id\":\"37\",\"end_destination_id\":\"37\",\"route_title\":\"Dạo Phố Cổ Hà Nội - Mua Sắm Ô Mai - Tiễn Sân Bay Nội Bài\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Dạo chơi Hồ Hoàn Kiếm, Đền Ngọc Sơn & Phố cổ 36 phố phường\",\"price\":50000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Mua sắm ô mai Hàng Đường & Xe Limousine tiễn sân bay Nội Bài\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe Limousine VIP 9 chỗ sang trọng\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":7041667,\"sellingPrice\":8450000,\"totalDays\":4,\"totalNights\":3,\"totalMeals\":{\"breakfast\":3,\"lunch\":4,\"dinner\":3},\"autoTicketsCost\":1200000},\"categories\":[\"Du thuyền\",\"Nghỉ dưỡng cao cấp\",\"Biển đảo\"],\"highlights\":\"Du thuyền 5★ Ambassador Hạ Long, Động TiTop, Hang Sửng Sốt, Ninh Bình Emeralda\"}', NULL, 0),
(38, 'Tour Hà Nội - Sapa - Chinh Phục Đỉnh Fansipan 3N2Đ', 'Khám phá thị trấn mờ sương Sapa, trải nghiệm văn hóa bản địa dân tộc H’Mông, Dao Đỏ và chinh phục cột mốc Nóc nhà Đông Dương Fansipan cao 3.143m.', 'Sapa', 3, 3850000.00, '/uploads/19471_TOUR_MIỀN_BẮC_MÙA_HÈ_3N2Đ_HÀ_NỘI_-_SAPA_-_FANSIPAN.jpg', 'Active', 1, 3208333.33, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"38\",\"end_destination_id\":\"38\",\"route_title\":\"Hà Nội - Xe Cao Cấp Đi Sapa - Bản Cát Cát\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Đón khách tại Hà Nội đi xe giường nằm lên Sapa\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Khám phá Bản Cát Cát, chụp ảnh trang phục dân tộc H\'Mông\",\"price\":150000}],\"accommodation\":{\"service_id\":12,\"name\":\"Khách sạn 3★ Sapa Unique\",\"price\":\"800000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"38\",\"end_destination_id\":\"38\",\"route_title\":\"Sapa - Cáp Treo Fansipan 3.143m - Thung Lũng Mường Hoa\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Chinh phục Đỉnh Fansipan bằng cáp treo & Tàu hỏa mường hoa\",\"price\":850000},{\"type\":\"Tham quan\",\"name\":\"Dạo chợ đêm Sapa & Thưởng thức lẩu thắng cố / đồ nướng\",\"price\":200000}],\"accommodation\":{\"service_id\":12,\"name\":\"Khách sạn 3★ Sapa Unique\",\"price\":\"800000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"38\",\"end_destination_id\":\"38\",\"route_title\":\"Sapa - Nhà Thờ Đá - Trở Về Hà Nội\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Check-in Nhà thờ đá cổ Sapa & Mua đặc sản nấm hương, rau mầm\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Xe giường nằm đưa khách về Hà Nội - Kết thúc chuyến đi\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe giường nằm cao cấp Hà Nội - Sapa\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":3208333,\"sellingPrice\":3850000,\"totalDays\":3,\"totalNights\":2,\"totalMeals\":{\"breakfast\":2,\"lunch\":3,\"dinner\":2},\"autoTicketsCost\":1200000},\"categories\":[\"Vùng cao\",\"Khám phá\",\"Chinh phục\"],\"highlights\":\"Sapa Nóc nhà Đông Dương, Cáp treo Fansipan, Bản Cát Cát người H\'Mông\"}', NULL, 0),
(39, 'Tour Hà Nội - Chùa Tam Chúc - Ninh Bình - Tràng An 3N2Đ', 'Hành trình tâm linh và danh thắng nổi tiếng Miền Bắc: Viếng Ngôi Chùa Tam Chúc lớn nhất thế giới, đi thuyền sinh thái Tràng An và thưởng thức cơm cháy dê núi Ninh Bình.', 'Hà Nội', 3, 3450000.00, '/uploads/19470_TOUR_MIỀN_BẮC_MÙA_HÈ_3N2Đ_HÀ_NỘI_-_CHÙA_TAM_CHÚC_-_NINH_BÌNH_-_TRÀNG_AN.jpg', 'Active', 1, 2875000.00, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"39\",\"end_destination_id\":\"39\",\"route_title\":\"Hà Nội - Viếng Chùa Tam Chúc Hà Nam - Đến Ninh Bình\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Đón khách tại Hà Nội khởi hành đi Hà Nam\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Đi thuyền du ngoạn Hồ Tam Chúc & Viếng Điện Tam Thế\",\"price\":200000}],\"accommodation\":{\"service_id\":13,\"name\":\"Khách sạn 4★ The Readon Ninh Bình\",\"price\":\"1100000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"39\",\"end_destination_id\":\"39\",\"route_title\":\"Ninh Bình - Khám Phá Quần Thể Di Sản Tràng An\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Đi thuyền chèo dọc sông Sào Khê xuyên Hang Sáng, Hang Tối\",\"price\":250000},{\"type\":\"Tham quan\",\"name\":\"Check-in Hang Múa ngắm toàn cảnh sông núi Tam Cốc\",\"price\":100000}],\"accommodation\":{\"service_id\":13,\"name\":\"Khách sạn 4★ The Readon Ninh Bình\",\"price\":\"1100000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"39\",\"end_destination_id\":\"39\",\"route_title\":\"Cố Đô Hoa Lư - Chùa Bái Đính - Trở Về Hà Nội\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Đền Đinh - Lê tại Cố đồ Hoa Lư & Ngôi chùa Bái Đính kỷ lục\",\"price\":150000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Trở về Hà Nội - Mua đặc sản cơm cháy Ninh Bình - Tiễn đoàn\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch 29 chỗ đời mới\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":2875000,\"sellingPrice\":3450000,\"totalDays\":3,\"totalNights\":2,\"totalMeals\":{\"breakfast\":2,\"lunch\":3,\"dinner\":2},\"autoTicketsCost\":1200000},\"categories\":[\"Văn hóa\",\"Tâm linh\",\"Di sản\"],\"highlights\":\"Chùa Tam Chúc Hà Nam, Danh thắng Tràng An Ninh Bình, Cố đô Hoa Lư\"}', NULL, 0);
INSERT INTO `tours` (`tour_id`, `tour_name`, `description`, `destination`, `duration_days`, `base_price`, `image_url`, `status`, `created_by`, `base_cost`, `markup_percent`, `design_data`, `rejection_reason`, `is_custom`) VALUES
(40, 'Tour Hà Giang - Quản Bạ - Sông Nho Quế 4N3Đ', 'Chinh phục cung đường di sản Cao nguyên đá Đồng Văn Hà Giang, trải nghiệm đi thuyền hẻm vực Tu Sản - Sông Nho Quế và check-in Cột cờ Lũng Cú.', 'Hà Giang', 4, 4950000.00, '/uploads/19476_TOUR_ĐÔNG_BẮC_MÙA_HÈ_4N3Đ_HÀ_GIANG_-_QUẢN_BẠ_-_SÔNG_NHO_QUẾ.jpg', 'Active', 1, 4125000.00, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"40\",\"end_destination_id\":\"40\",\"route_title\":\"Hà Nội - Hà Giang - Cột Mốc Số 0 - Núi Đôi Quản Bạ\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành từ Hà Nội đi Hà Giang theo QL2\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Check-in Cột mốc Số 0 Hà Giang & Ngắm Núi Đôi Quản Bạ\",\"price\":0}],\"accommodation\":{\"service_id\":14,\"name\":\"Khách sạn 3★ Đồng Văn Hoa Cổ\",\"price\":\"850000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"40\",\"end_destination_id\":\"40\",\"route_title\":\"Đồng Văn - Đèo Mã Pí Lèng - Đu Thuyền Sông Nho Quế\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Chinh phục Đèo Mã Pí Lèng - Một trong tứ đại đỉnh đèo\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Đi thuyền trên Sông Nho Quế xanh ngọc & Hẻm Tu Sản\",\"price\":200000}],\"accommodation\":{\"service_id\":15,\"name\":\"Homestay Panorama Mèo Vạc\",\"price\":\"700000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"40\",\"end_destination_id\":\"40\",\"route_title\":\"Mèo Vạc - Cột Cờ Lũng Cú - Dinh Biệt Thự Vua Mèo\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Viếng Cột cờ Lũng Cú - Cực Bắc thiêng liêng của Tổ Quốc\",\"price\":50000},{\"type\":\"Tham quan\",\"name\":\"Tham quan Dinh biệt thự Vua Mèo Vương Chính Đức\",\"price\":30000}],\"accommodation\":{\"service_id\":16,\"name\":\"Khách sạn 3★ Hà Giang Historic\",\"price\":\"800000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":4,\"start_destination_id\":\"40\",\"end_destination_id\":\"40\",\"route_title\":\"Hà Giang - Thác Tiên Đèo Gió - Trở Về Hà Nội\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Ngắm Thác Tiên Đèo Gió nguyên sơ & Mua cam sành Hà Giang\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Trở về Hà Nội - Tiễn đoàn an toàn tại Nội Bài\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch 16 chỗ chuyên tuyến đường núi\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":4125000,\"sellingPrice\":4950000,\"totalDays\":4,\"totalNights\":3,\"totalMeals\":{\"breakfast\":3,\"lunch\":4,\"dinner\":3},\"autoTicketsCost\":1200000},\"categories\":[\"Khám phá\",\"Vùng cao\",\"Trải nghiệm\"],\"highlights\":\"Đi thuyền Sông Nho Quế, Cột cờ Lũng Cú, Đèo Mã Pí Lèng, Núi đôi Quản Bạ\"}', NULL, 0),
(41, 'Tour Quy Nhơn Mùa Hè 3N2Đ: Hầm Hồ - Ghềnh Ráng - Kỳ Co - Eo Gió', 'Đến với miền đất võ thiên đường biển Quy Nhơn, lặn biển ngắm san hô tại đảo Kỳ Co, đón bình minh tại Eo Gió ngắm tuyệt tác thiên nhiên.', 'Quy Nhơn', 3, 3990000.00, '/uploads/19104_TOUR_QUY_NHƠN_MÙA_HÈ_3N2Đ_KDL_HẦM_HÔ_-_GHỀNH_RÁNG_-_KỲ_CO_-_EO_GIÓ.jpg', 'Active', 1, 3325000.00, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"41\",\"end_destination_id\":\"41\",\"route_title\":\"Đón Khách Quy Nhơn - Ghềnh Ráng Tiên Sa - Mộ Hàn Mặc Tử\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Đón khách tại Sân bay Phù Cát về Quy Nhơn\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan KDL Ghềnh Ráng Tiên Sa, Mộ thi sĩ Hàn Mặc Tử & Bãi Hoàng Hậu\",\"price\":50000}],\"accommodation\":{\"service_id\":17,\"name\":\"Khách sạn 4★ Anya Quy Nhơn\",\"price\":\"1350000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"41\",\"end_destination_id\":\"41\",\"route_title\":\"Cano Đảo Kỳ Co - Lặn San Hô - Eo Gió Lung Linh\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Cano cao tốc ra Đảo Kỳ Co - Thiên đường Maldives Việt Nam\",\"price\":450000},{\"type\":\"Tham quan\",\"name\":\"Lặn ngắm san hô Bãi Rạn & Check-in con đường đi bộ Eo Gió\",\"price\":150000}],\"accommodation\":{\"service_id\":17,\"name\":\"Khách sạn 4★ Anya Quy Nhơn\",\"price\":\"1350000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"41\",\"end_destination_id\":\"41\",\"route_title\":\"Khu Sinh Thái Hầm Hồ - Mua Sắm Bánh Ít Lá Gai - Tiễn Đoàn\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Đi thuyền chèo KDL Sinh thái Hầm Hồ giữa lòng rừng xanh\",\"price\":100000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Mua đặc sản Bánh ít lá gai, Tré Bình Định - Tiễn sân bay Phù Cát\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch 29 chỗ & Cano cao tốc\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":3325000,\"sellingPrice\":3990000,\"totalDays\":3,\"totalNights\":2,\"totalMeals\":{\"breakfast\":2,\"lunch\":3,\"dinner\":2},\"autoTicketsCost\":1200000},\"categories\":[\"Biển đảo\",\"Khám phá\",\"Ẩm thực\"],\"highlights\":\"Biển Kỳ Co, Eo Gió đón bình minh, Ghềnh Ráng Tiên Sa, Hầm Hồ\"}', NULL, 0),
(42, 'Tour Quy Nhơn - Phú Yên 4N3Đ: Mũi Điện - Gành Đá Đĩa - Kỳ Co', 'Hành trình liên tuyến tuyệt vời khám phá xứ sở Hoa Vàng Trên Cỏ Xanh Phú Yên và thiên đường biển xanh Quy Nhơn trọn gói.', 'Phú Yên', 4, 5250000.00, '/uploads/19106_TOUR_QUY_NHƠN_-_PHÚ_YÊN_MÙA_HÈ_4N3Đ_MŨI_ĐIỆN_-_GÀNH_ĐÁ_DĨA_-_KỲ_CO_-_EO_GIÓ.jpg', 'Active', 1, 4375000.00, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"42\",\"end_destination_id\":\"42\",\"route_title\":\"Đón Khách Tuy Hòa Phú Yên - Gành Đá Đĩa - Đầm O Loan\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Đón khách tại Phú Yên, thưởng thức Sò huyết Đầm O Loan\",\"price\":200000},{\"type\":\"Tham quan\",\"name\":\"Tham quan Gành Đá Đĩa - Kiệt tác tổ tinh thể đá thiên nhiên\",\"price\":50000}],\"accommodation\":{\"service_id\":18,\"name\":\"Khách sạn 4★ Sala Phú Yên Beach\",\"price\":\"1250000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"42\",\"end_destination_id\":\"42\",\"route_title\":\"Mũi Điện Cực Đông - Tháp Nghinh Phong - Sang Quy Nhơn\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Chinh phục Mũi Điện - Nơi đón ánh bình minh đầu tiên trên đất liền\",\"price\":50000},{\"type\":\"Tham quan\",\"name\":\"Check-in Tháp Nghinh Phong biểu tượng mới của Phú Yên\",\"price\":0}],\"accommodation\":{\"service_id\":19,\"name\":\"Khách sạn 4★ Seagull Quy Nhơn\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"42\",\"end_destination_id\":\"42\",\"route_title\":\"Quy Nhơn - Đảo Kỳ Co - Eo Gió - Tịnh Xá Ngọc Hòa\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Cano vượt biển tắm biển Kỳ Co & Lặn ngắm san hô\",\"price\":450000},{\"type\":\"Tham quan\",\"name\":\"Chiêm bái Tượng Phật đôi cao nhất Việt Nam tại Tịnh Xá Ngọc Hòa\",\"price\":0}],\"accommodation\":{\"service_id\":19,\"name\":\"Khách sạn 4★ Seagull Quy Nhơn\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":4,\"start_destination_id\":\"42\",\"end_destination_id\":\"42\",\"route_title\":\"Bảo Tàng Quang Trung - Võ Thuật Tây Sơn - Tiễn Đoàn\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Viếng Bảo tàng Quang Trung & Thưởng thức màn biểu diễn Võ thuật Tây Sơn\",\"price\":100000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Tiễn khách tại Sân bay Phù Cát / Bến xe Quy Nhơn\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch 29 chỗ đời mới\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":4375000,\"sellingPrice\":5250000,\"totalDays\":4,\"totalNights\":3,\"totalMeals\":{\"breakfast\":3,\"lunch\":4,\"dinner\":3},\"autoTicketsCost\":1200000},\"categories\":[\"Biển đảo\",\"Khám phá\",\"Nghỉ dưỡng\"],\"highlights\":\"Gành Đá Đĩa Phú Yên, Mũi Điện cực Đông, Kỳ Co Eo Gió Quy Nhơn\"}', NULL, 0),
(43, 'Tour Đà Lạt Mùa Hè 4N3Đ: Thác Bobla - Vùng Đất Cổ Tích', 'Trải nghiệm mùa hè mát lạnh tại ngàn hoa Đà Lạt, thưởng ngoạn Thác Bobla nguyên sơ hùng vĩ, Fresh Garden và Vùng đất cổ tích Fairytale Land.', 'Đà Lạt', 4, 4650000.00, '/uploads/19508_TOUR_ĐÀ_LẠT_MÙA_HÈ_4N3Đ_THÁC_BOBLA_-_VÙNG_ĐẤT_CỔ_TÍCH.jpg', 'Active', 1, 3875000.00, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"43\",\"end_destination_id\":\"43\",\"route_title\":\"TP.HCM - Lâm Đồng - Thám Hiểm Thác Bobla - Đến Đà Lạt\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành từ TP.HCM theo QL20 lên Cao nguyên Lâm Viên\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Khám phá Thác Bobla giữa đại ngàn rừng xanh\",\"price\":100000}],\"accommodation\":{\"service_id\":20,\"name\":\"Khách sạn 4★ Golf Valley Đà Lạt\",\"price\":\"1500000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"43\",\"end_destination_id\":\"43\",\"route_title\":\"Đà Lạt - Quảng Trường Lâm Viên - Fairytale Land - Hầm Vang\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Check-in Nụ hoa Atiso Quảng trường Lâm Viên & Hồ Xuân Hương\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Khám phá Vùng đất cổ tích Fairytale Land & Thử rượu vang Đà Lạt\",\"price\":150000}],\"accommodation\":{\"service_id\":20,\"name\":\"Khách sạn 4★ Golf Valley Đà Lạt\",\"price\":\"1500000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"43\",\"end_destination_id\":\"43\",\"route_title\":\"Thung Lũng Tình Yêu - Alpine Coaster Thác Datanla - Chợ Đêm\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Trải nghiệm Xe trượt máng Alpine Coaster xuyên rừng Thác Datanla\",\"price\":200000},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thung lũng Tình Yêu & Dạo Chợ đêm Đà Lạt\",\"price\":250000}],\"accommodation\":{\"service_id\":20,\"name\":\"Khách sạn 4★ Golf Valley Đà Lạt\",\"price\":\"1500000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":4,\"start_destination_id\":\"43\",\"end_destination_id\":\"43\",\"route_title\":\"Thiền Viện Trúc Lâm - Mua Mứt Đà Lạt - Trở Về TP.HCM\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Viếng Thiền viện Trúc Lâm ngắm Hồ Tuyền Lâm xanh biếc\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Mua sắm mứt đà lạt & Trở về TP.HCM - Kết thúc chuyến đi\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch 29 chỗ đời mới VIP\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":3875000,\"sellingPrice\":4650000,\"totalDays\":4,\"totalNights\":3,\"totalMeals\":{\"breakfast\":3,\"lunch\":4,\"dinner\":3},\"autoTicketsCost\":1200000},\"categories\":[\"Nghỉ dưỡng\",\"Cổ tích\",\"Hoa mộng\"],\"highlights\":\"Thác Bobla hùng vĩ, Fairytale Land, Alpine Coaster Datanla, Thung lũng Tình Yêu\"}', NULL, 0),
(44, 'Tour Đà Lạt 3N3Đ: Săn Mây - Trạm Ký Ức - Fresh Garden', 'Tour săn mây bình minh Cầu Đất siêu HOT, check-in Trạm Ký Ức hoài niệm, vườn hoa Fresh Garden và thưởng thức lẩu gà lá é đặc sản Đà Lạt.', 'Đà Lạt', 3, 3250000.00, '/uploads/19510_TOUR_ĐÀ_LẠT_MÙA_HÈ_3N3Đ_Săn_Mây_-_Trạm_Ký_Ức_-_Fresh_Garden.jpg', 'Active', 1, 2708333.33, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"44\",\"end_destination_id\":\"44\",\"route_title\":\"Săn Mây Đồi Cầu Đất - Tiệm Cà Phê Trạm Ký Ức\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Trải nghiệm Săn mây biển sương Đồi Cầu Đất lúc 05:00 sáng\",\"price\":120000},{\"type\":\"Tham quan\",\"name\":\"Thưởng thức cà phê chiều tại Trạm Ký Ức ngắm hoàng hôn Đà Lạt\",\"price\":80000}],\"accommodation\":{\"service_id\":21,\"name\":\"Khách sạn 3★ Duparc Đà Lạt\",\"price\":\"900000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"44\",\"end_destination_id\":\"44\",\"route_title\":\"KDL Fresh Garden Ngàn Hoa - Trang Trại Cún Puppy Farm\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Đồi hoa cánh bướm & Cổng trời KDL Fresh Garden\",\"price\":100000},{\"type\":\"Tham quan\",\"name\":\"Vui chơi cùng các chú cún dễ thương tại Trang trại Puppy Farm\",\"price\":100000}],\"accommodation\":{\"service_id\":21,\"name\":\"Khách sạn 3★ Duparc Đà Lạt\",\"price\":\"900000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"44\",\"end_destination_id\":\"44\",\"route_title\":\"Nông Trại Cầu Đất Tea Hill - Vườn Dâu Tây - Tiễn Đoàn\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Hái dâu tây sạch tại vườn & Thưởng thức bánh mì xíu mại\",\"price\":100000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Tiễn đoàn về lại TP.HCM / Sân bay Liên Khương\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch 16/29 chỗ cao cấp\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":2708333,\"sellingPrice\":3250000,\"totalDays\":3,\"totalNights\":2,\"totalMeals\":{\"breakfast\":2,\"lunch\":3,\"dinner\":2},\"autoTicketsCost\":1200000},\"categories\":[\"Săn mây\",\"Check-in\",\"Nghỉ dưỡng\"],\"highlights\":\"Săn mây Đồi Cầu Đất, Trạm Ký Ức, Fresh Garden ngàn hoa, Puppy Farm\"}', NULL, 0),
(45, 'Tour Vĩnh Hy - Nha Trang 3N3Đ Mùa Hè', 'Kết hợp khám phá Vịnh Vĩnh Hy - một trong bốn vịnh đẹp nhất Việt Nam và thành phố biển Nha Trang sôi động với Tháp Bà Ponagar, đảo Hòn Mun.', 'Nha Trang', 3, 3750000.00, '/uploads/19514_TOUR_VĨNH_HY_-_NHA_TRANG_3N3Đ_MÙA_HÈ.jpg', 'Active', 1, 3125000.00, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"45\",\"end_destination_id\":\"45\",\"route_title\":\"Đón Khách - Tàu Đáy Kính Vĩnh Hy - Hang Rái Kỳ Vĩ\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Đón khách tại Ninh Thuận đi Vịnh Vĩnh Hy\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Đi tàu đáy kính ngắm san hô Vĩnh Hy & Thám hiểm thềm đá Hang Rái\",\"price\":200000}],\"accommodation\":{\"service_id\":22,\"name\":\"Khách sạn 4★ Vinpearl Condotel Nha Trang\",\"price\":\"1400000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"45\",\"end_destination_id\":\"45\",\"route_title\":\"Nha Trang - Tour 4 Đảo Vịnh Nha Trang - Tắm Bùn Khoáng\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Cano lướt sóng thăm Hòn Mun, Hòn Một & Tắm biển Bãi Tranh\",\"price\":400000},{\"type\":\"Tham quan\",\"name\":\"Thư giãn tắm bùn khoáng nóng thiên nhiên Tháp Bà\",\"price\":250000}],\"accommodation\":{\"service_id\":22,\"name\":\"Khách sạn 4★ Vinpearl Condotel Nha Trang\",\"price\":\"1400000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"45\",\"end_destination_id\":\"45\",\"route_title\":\"Tháp Bà Ponagar - Chùa Long Sơn - Mua Yến Sào - Tiễn Đoàn\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Tháp Bà Ponagar kiến trúc Chăm Pa cổ & Chùa Long Sơn\",\"price\":50000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Mua sắm Yến sào Nha Trang, Nem nướng Ninh Hòa - Tiễn sân bay Cam Ranh\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch 29 chỗ & Tàu đáy kính\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":3125000,\"sellingPrice\":3750000,\"totalDays\":3,\"totalNights\":2,\"totalMeals\":{\"breakfast\":2,\"lunch\":3,\"dinner\":2},\"autoTicketsCost\":1200000},\"categories\":[\"Biển đảo\",\"Khám phá\",\"Vịnh biển\"],\"highlights\":\"Tàu đáy kính Vịnh Vĩnh Hy, Hang Rái Ninh Thuận, Vịnh Nha Trang\"}', NULL, 0),
(46, 'Tour Phan Thiết 3N2Đ: Đảo Phú Quý - Thiên Đường Biển Xanh', 'Chinh phục đảo ngọc Phú Quý hoang sơ tại Bình Thuận, check-in Dốc Phượt, Cột cờ Chủ Quyền, Vịnh Triều Dương và hồ bơi vô cực tự nhiên Bãi Nhỏ.', 'Nha Trang', 3, 4150000.00, '/uploads/18935_TOUR_PHAN_THIẾT_3N2Đ_ĐẢO_PHÚ_QUÝ_-_THIÊN_ĐƯỜNG_BIỂN_XANH.jpg', 'Active', 1, 3458333.33, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"46\",\"end_destination_id\":\"46\",\"route_title\":\"TP.HCM - Phan Thiết - Tàu Cao Tốc Ra Đảo Phú Quý\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành từ TP.HCM ra Cảng Phan Thiết\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tàu cao tốc 2.5 tiếng ra Đảo Phú Quý - Check-in Dốc Phượt & Đột Lỗ\",\"price\":400000}],\"accommodation\":{\"service_id\":23,\"name\":\"Phú Quý Island Hotel 3★\",\"price\":\"900000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"46\",\"end_destination_id\":\"46\",\"route_title\":\"Hòn Tranh - Lặn Ngắm San Hô - Vịnh Triều Dương\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Đi ca no nhỏ sang Hòn Tranh tắm biển lặn ngắm san hô\",\"price\":250000},{\"type\":\"Tham quan\",\"name\":\"Check-in Vịnh Triều Dương & Ngọn Hải Đăng Cấm ngắm toàn đảo\",\"price\":50000}],\"accommodation\":{\"service_id\":23,\"name\":\"Phú Quý Island Hotel 3★\",\"price\":\"900000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"46\",\"end_destination_id\":\"46\",\"route_title\":\"Đỉnh Núi Cấm - Gành Hang - Tàu Cao Tốc Về Phan Thiết\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Check-in Khe Sung Sướng & Hồ vô cực Gành Hang Phú Quý\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Tàu cao tốc về lại bờ - Mua nước mắm Phan Thiết & Thanh Long - Tiễn đoàn\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch & Tàu cao tốc Superdong Phan Thiết\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":3458333,\"sellingPrice\":4150000,\"totalDays\":3,\"totalNights\":2,\"totalMeals\":{\"breakfast\":2,\"lunch\":3,\"dinner\":2},\"autoTicketsCost\":1200000},\"categories\":[\"Biển đảo\",\"Khám phá\",\"Cực hot\"],\"highlights\":\"Đảo Phú Quý, Hòn Tranh, Gành Hang, Cột mốc chủ quyền biển đảo\"}', NULL, 0),
(47, 'Tour Hồ Tràm 2N1Đ: Tận Hưởng Biển Xanh - Nghỉ Dưỡng Cao Cấp', 'Chuyến nghỉ dưỡng ngắt kết nối cuối tuần hoàn hảo tại biển Hồ Tràm 4 sao, thư giãn ngâm suối khoáng nóng Bình Châu và thưởng thức hải sản tươi sống.', 'Nha Trang', 2, 2450000.00, '/uploads/19611_TOUR_HỒ_TRÀM_2N1Đ_Tận_Hưởng_Biển_Xanh_-_Nghỉ_Dưỡng_Cao_Cấp.jpg', 'Active', 1, 2041666.67, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"47\",\"end_destination_id\":\"47\",\"route_title\":\"TP.HCM - Hồ Tràm - Check-in Resort 5★ The Grand Ho Tram\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Đón khách tại TP.HCM đi Bà Rịa Vũng Tàu\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Nhận phòng Resort 5★ The Grand Ho Tram Strip & Tắm biển Hồ Tràm\",\"price\":0}],\"accommodation\":{\"service_id\":24,\"name\":\"The Grand Ho Tram Resort 5★\",\"price\":\"3200000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"47\",\"end_destination_id\":\"47\",\"route_title\":\"Suối Khoáng Nóng Bình Châu - Trở Về TP.HCM\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Ngâm chân nước khoáng nóng thiên nhiên Minera Bình Châu\",\"price\":200000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Mua hải sản tươi sống Chợ hải sản Phước Hải - Trở về TP.HCM\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch 16/29 chỗ đời mới\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":2041667,\"sellingPrice\":2450000,\"totalDays\":2,\"totalNights\":1,\"totalMeals\":{\"breakfast\":1,\"lunch\":2,\"dinner\":1},\"autoTicketsCost\":1200000},\"categories\":[\"Nghỉ dưỡng cao cấp\",\"Biển đảo\",\"Cuối tuần\"],\"highlights\":\"Resort 5★ The Grand Ho Tram Strip, Hồ bơi vô cực, Khoáng nóng Bình Châu\"}', NULL, 0),
(48, 'Tour Tây Nguyên 3N3Đ: Măng Đen - Pleiku - Buôn Ma Thuột', 'Hành trình huyền thoại đại ngàn Tây Nguyên khám phá Măng Đen được mệnh danh Đà Lạt thứ 2, Đôi mắt Pleiku Biển Hồ T Nưng và Thác Dray Nur kỳ vĩ.', 'Tây Nguyên', 3, 3950000.00, '/uploads/19580_TOUR_BUÔN_MA_THUỘT_MÙA_HÈ_3N3Đ_MĂNG_ĐEN_-_PLEIKU_-_BUÔN_MA_THUỘT.jpg', 'Active', 1, 3291666.67, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"48\",\"end_destination_id\":\"48\",\"route_title\":\"Đón Khách Kon Tum - Thị Trấn Sương Mù Măng Đen - Thác Pa Sỹ\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Đón đoàn tại Kon Tum khởi hành đi Măng Đen\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Pa Sỹ nguyên sơ & Chiêm bái Tượng Đức Mẹ Măng Đen\",\"price\":50000}],\"accommodation\":{\"service_id\":25,\"name\":\"Khách sạn 3★ Pleiku Hotel\",\"price\":\"850000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"48\",\"end_destination_id\":\"48\",\"route_title\":\"Pleiku - Biển Hồ Tơ Nưng - Hàng Cây Trăm Tuổi - Buôn Ma Thuột\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Check-in Biển Hồ Tơ Nưng - Đôi mắt Pleiku mơ màng\",\"price\":30000},{\"type\":\"Tham quan\",\"name\":\"Dạo bước Hàng cây thông trăm tuổi & Đồi trà Biển Hồ\",\"price\":0}],\"accommodation\":{\"service_id\":26,\"name\":\"Khách sạn 4★ Saigon Ban Me\",\"price\":\"1200000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"48\",\"end_destination_id\":\"48\",\"route_title\":\"Bảo Tàng Thế Giới Cà Phê - Buôn Đôn - Tiễn Đoàn\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Bảo tàng Thế giới Cà phê kiến trúc nhà dài Tây Nguyên\",\"price\":150000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Thưởng thức Cà phê Trung Nguyên chính hiệu & Tiễn sân bay Buôn Ma Thuột\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch 29 chỗ đời mới chuyên tuyến Tây Nguyên\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":3291667,\"sellingPrice\":3950000,\"totalDays\":3,\"totalNights\":2,\"totalMeals\":{\"breakfast\":2,\"lunch\":3,\"dinner\":2},\"autoTicketsCost\":1200000},\"categories\":[\"Tây Nguyên\",\"Vùng cao\",\"Khám phá\"],\"highlights\":\"Măng Đen sương mù, Biển Hồ Tơ Nưng Pleiku, Bảo tàng Cà phê Buôn Ma Thuột\"}', NULL, 0),
(49, 'Tour Miền Tây 3N2Đ: Mỹ Tho - Bến Tre - Cần Thơ - Bạc Liêu - Cà Mau', 'Hành trình khám phá trọn vẹn 6 tỉnh Miền Tây Nam Bộ: Sông nước Cù lao Thới Sơn, Chợ nổi Cái Răng, Chùa Dơi Sóc Trăng, Nhà Công tử Bạc Liêu và Đất Mũi Cà Mau.', 'Cần Thơ', 3, 3150000.00, '/uploads/18924_TOUR_MIỀN_TÂY_3N2Đ_MỸ_THO_-_BẾN_TRE_-_CẦN_THƠ_-_SÓC_TRĂNG_-_BẠC_LIÊU_-_CÀ_MAU.jpg', 'Active', 1, 2625000.00, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"49\",\"end_destination_id\":\"49\",\"route_title\":\"TP.HCM - Mỹ Tho - Đi Xuồng Máy Cồn Phụng Bến Tre - Cần Thơ\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành từ TP.HCM về Tiền Giang\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Đi xuồng máy Cồn Phụng, làm kẹo dừa & nghe Đờn ca tài tử\",\"price\":150000}],\"accommodation\":{\"service_id\":27,\"name\":\"Khách sạn 4★ TTC Cần Thơ\",\"price\":\"1200000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"49\",\"end_destination_id\":\"49\",\"route_title\":\"Chợ Nổi Cái Răng - Điện Gió Bạc Liêu - Đất Mũi Cà Mau\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Trải nghiệm Chợ nổi Cái Răng Cần Thơ lúc 05:30 sáng\",\"price\":100000},{\"type\":\"Tham quan\",\"name\":\"Tham quan Nhà Công tử Bạc Liêu & Cánh đồng điện gió trên biển\",\"price\":100000}],\"accommodation\":{\"service_id\":28,\"name\":\"Khách sạn 3★ Mũi Cà Mau\",\"price\":\"800000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"49\",\"end_destination_id\":\"49\",\"route_title\":\"Check-in Cột Mốc Cực Nam Cà Mau - Trở Về TP.HCM\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Chụp ảnh Cột mốc tọa độ Quốc gia GPS 0001 tại Đất Mũi Cà Mau\",\"price\":50000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Thưởng thức Cua Cà Mau hấp sả & Xe đưa đoàn về lại TP.HCM\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch 29 chỗ & Xuồng máy sông nước\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":2625000,\"sellingPrice\":3150000,\"totalDays\":3,\"totalNights\":2,\"totalMeals\":{\"breakfast\":2,\"lunch\":3,\"dinner\":2},\"autoTicketsCost\":1200000},\"categories\":[\"Sông nước\",\"Miền Tây\",\"Văn hóa\"],\"highlights\":\"Chợ nổi Cái Răng, Cồn Phụng Bến Tre, Đất Mũi Cà Mau Cực Nam Tổ Quốc\"}', NULL, 0),
(50, 'Tour Đồng Tháp - Làng Hoa Sa Đéc - Cần Thơ 2N1Đ', 'Chuyến du ngoạn về Xứ hoa kiểng Miền Tây Sa Đéc Đồng Tháp trăm năm tuổi, check-in KDL sinh thái Xẻo Quýt và du thuyền Cần Thơ trên sông Hậu.', 'Cần Thơ', 2, 1950000.00, '/uploads/19245_TOUR_ĐỒNG_THÁP_-_LÀNG_HOA_SA_ĐÉC_-_CẦN_THƠ_2N1Đ_Về_Xứ_Hoa_Kiểng_Miền_Tây.jpg', 'Active', 1, 1625000.00, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"50\",\"end_destination_id\":\"50\",\"route_title\":\"TP.HCM - Làng Hoa Sa Đéc Đồng Tháp - Cần Thơ\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành từ TP.HCM đi Đồng Tháp Mười\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Làng hoa kiểng Sa Đéc rực rỡ & Nhà cổ Huỳnh Thủy Lê\",\"price\":120000}],\"accommodation\":{\"service_id\":29,\"name\":\"Khách sạn 3★ Ninh Kiều Cần Thơ\",\"price\":\"850000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"50\",\"end_destination_id\":\"50\",\"route_title\":\"Chợ Nổi Cái Răng - Vườn Trái Cây Phong Điền - Trở Về TP.HCM\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Đi tàu chèo khám phá Chợ nổi Cái Răng & Thưởng thức hủ tiếu trên sông\",\"price\":100000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Thăm vườn trái cây Phong Điền hái chôm chôm, nhãn - Trở về TP.HCM\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch 16/29 chỗ đời mới\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":1625000,\"sellingPrice\":1950000,\"totalDays\":2,\"totalNights\":1,\"totalMeals\":{\"breakfast\":1,\"lunch\":2,\"dinner\":1},\"autoTicketsCost\":1200000},\"categories\":[\"Miền Tây\",\"Làng hoa\",\"Sông nước\"],\"highlights\":\"Làng hoa Sa Đéc Đồng Tháp, Nhà cổ Huỳnh Thủy Lê, Chợ nổi Cái Răng\"}', NULL, 0),
(51, 'Tour Tây Ninh 1N: Núi Bà Đen - Đỉnh Vân Sơn - Buffet Năm Châu', 'Hành trình 1 ngày hành hương tâm linh Sun World Núi Bà Đen Tây Ninh, chiêm bái Tượng Phật Bà Tây Bổ Đà Sơn bằng đồng cao nhất Châu Á và thưởng thức Buffet 80+ món.', 'Tây Ninh', 1, 1150000.00, '/uploads/18921_TOUR_TÂY_NINH_1N_NÚI_BÀ_-_ĐỈNH_VÂN_SƠN_-_BUFFET_NĂM_CHÂU.jpg', 'Active', 1, 958333.33, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"51\",\"end_destination_id\":\"51\",\"route_title\":\"TP.HCM - Tòa Thánh Tây Ninh - Sun World Núi Bà Đen - Đỉnh Vân Sơn\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"06:00 đón khách tại TP.HCM đi Tây Ninh theo QL22\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Viếng Tòa Thánh Tây Ninh - Công trình kiến trúc Cao Đài độc đáo\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Đi Cáp treo Sun World lên Đỉnh Vân Sơn 986m & Chiêm bái Tượng Phật Bà Đồng 72m\",\"price\":400000},{\"type\":\"Nghỉ ngơi\",\"name\":\"Thưởng thức đại tiệc Buffet Năm Châu 80+ món ngon & Xe tiễn về TP.HCM lúc 17:00\",\"price\":250000}],\"accommodation\":null,\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch 29/45 chỗ cao cấp\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":958333,\"sellingPrice\":1150000,\"totalDays\":1,\"totalNights\":0,\"totalMeals\":{\"breakfast\":0,\"lunch\":1,\"dinner\":0},\"autoTicketsCost\":1200000},\"categories\":[\"Tâm linh\",\"Cáp treo\",\"Buffet\"],\"highlights\":\"Cáp treo Núi Bà Đen, Đỉnh Vân Sơn 986m, Tòa Thánh Tây Ninh, Đại tiệc Buffet Năm Châu\"}', NULL, 0),
(52, 'Tour Xuyên Việt 8N7Đ: Phú Yên - Quy Nhơn - Đà Nẵng - Huế - Quảng Bình', 'Hành trình du lịch Xuyên Việt dọc dải đất di sản Miền Trung qua Phú Yên, Quy Nhơn, Phố cổ Hội An, Đà Nẵng, Cố đô Huế và Động Thiên Đường Quảng Bình.', 'Đà Nẵng', 8, 11850000.00, '/uploads/19587_TOUR_XUYÊN_VIỆT_8N7Đ_PHÚ_YÊN_-_QUY_NHƠN_-_ĐÀ_NẴNG_-_HUẾ_-_QUẢNG_BÌNH.jpg', 'Active', 1, 9875000.00, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"52\",\"end_destination_id\":\"52\",\"route_title\":\"Đón Đoàn Phú Yên - Gành Đá Đĩa - Mũi Điện - Quy Nhơn\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Đón đoàn tại Phú Yên, nhận phòng khách sạn\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Gành Đá Đĩa & Check-in Mũi Điện cực Đông\",\"price\":100000}],\"accommodation\":{\"service_id\":30,\"name\":\"Khách sạn 4★ Sala Phú Yên Beach\",\"price\":\"1200000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"52\",\"end_destination_id\":\"52\",\"route_title\":\"Quy Nhơn - Kỳ Co - Eo Gió - Hành Trình Ra Phố Cổ Hội An\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Cano đi đảo Kỳ Co tắm biển & Ngắm cảnh Eo Gió\",\"price\":450000},{\"type\":\"Tham quan\",\"name\":\"Di chuyển ra Hội An, tự do dạo phố cổ thắp đèn lồng\",\"price\":150000}],\"accommodation\":{\"service_id\":31,\"name\":\"Khách sạn 4★ Phố Cổ Hội An\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"52\",\"end_destination_id\":\"52\",\"route_title\":\"Hội An - Đà Nẵng - Bà Nà Hills - Cầu Vàng\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Đi cáp treo Bà Nà Hills & Check-in Cầu Vàng nổi tiếng thế giới\",\"price\":900000},{\"type\":\"Tham quan\",\"name\":\"Tối thưởng thức hải sản biển Mỹ Khê Đà Nẵng\",\"price\":200000}],\"accommodation\":{\"service_id\":1,\"name\":\"Khách sạn 4★ Sala Đà Nẵng Beach\",\"price\":\"1200000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":4,\"start_destination_id\":\"52\",\"end_destination_id\":\"52\",\"route_title\":\"Đà Nẵng - Cố Đô Huế - Đại Nội Hoàng Thành\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Xuyên Hầm Hải Vân ra Cố đồ Huế\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Khám phá Đại Nội Hoàng Thành Huế, Chùa Thiên Mụ & Thưởng thức Ca Trù sông Hương\",\"price\":300000}],\"accommodation\":{\"service_id\":3,\"name\":\"Khách sạn 4★ Century Riverside Huế\",\"price\":\"1200000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":5,\"start_destination_id\":\"52\",\"end_destination_id\":\"52\",\"route_title\":\"Huế - Quảng Bình - Tham Quan Động Thiên Đường\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Khám phá Động Thiên Đường kỳ vĩ trong Quần thể Phong Nha Kẻ Bàng\",\"price\":250000}],\"accommodation\":{\"service_id\":4,\"name\":\"Khách sạn 4★ Mường Thanh Quảng Bình\",\"price\":\"1250000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":6,\"start_destination_id\":\"52\",\"end_destination_id\":\"52\",\"route_title\":\"Vũng Chùa Đảo Yến - Viếng Mộ Đại Tướng - Trở Về Huế\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Viếng mộ Đại tướng Võ Nguyên Giáp & Trở về Huế nghỉ đêm\",\"price\":0}],\"accommodation\":{\"service_id\":3,\"name\":\"Khách sạn 4★ Century Riverside Huế\",\"price\":\"1200000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":7,\"start_destination_id\":\"52\",\"end_destination_id\":\"52\",\"route_title\":\"Lăng Khải Định - Chợ Đông Ba - Nghỉ Đêm Đà Nẵng\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Lăng Khải Định kiến trúc Á - Âu tinh xảo & Mua sắm Chợ Đông Ba\",\"price\":150000}],\"accommodation\":{\"service_id\":1,\"name\":\"Khách sạn 4★ Sala Đà Nẵng Beach\",\"price\":\"1200000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":8,\"start_destination_id\":\"52\",\"end_destination_id\":\"52\",\"route_title\":\"Ngũ Hành Sơn - Mua Sắm Đặc Sản - Tiễn Sân Bay Đà Nẵng\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Ngũ Hành Sơn & Tiễn khách ra Sân bay Đà Nẵng an toàn\",\"price\":50000}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":150000,\"lunch\":200000,\"dinner\":250000,\"tickets\":0,\"insurance\":50000},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Xe du lịch Universe 45 chỗ đời mới cao cấp\",\"unit\":\"Vé\",\"price\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"06:00\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"18:00\"}},\"computed\":{\"netCost\":9875000,\"sellingPrice\":11850000,\"totalDays\":8,\"totalNights\":7,\"totalMeals\":{\"breakfast\":7,\"lunch\":8,\"dinner\":7},\"autoTicketsCost\":1200000},\"categories\":[\"Xuyên Việt\",\"Khám phá\",\"Di sản\"],\"highlights\":\"Gành Đá Đĩa Phú Yên, Kỳ Co Quy Nhơn, Phố cổ Hội An, Bà Nà Hills Cầu Vàng, Đại Nội Huế, Động Thiên Đường Quảng Bình\"}', NULL, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tour_categories`
--

CREATE TABLE `tour_categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `tour_categories`
--

INSERT INTO `tour_categories` (`category_id`, `category_name`) VALUES
(1, 'Trong nước'),
(2, 'Nước ngoài');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tour_category_map`
--

CREATE TABLE `tour_category_map` (
  `id` int(11) NOT NULL,
  `tour_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `tour_category_map`
--

INSERT INTO `tour_category_map` (`id`, `tour_id`, `category_id`) VALUES
(3, 32, 1),
(4, 33, 1),
(5, 34, 1),
(6, 35, 1),
(7, 36, 1),
(8, 37, 1),
(9, 38, 1),
(10, 39, 1),
(11, 40, 1),
(12, 41, 1),
(13, 42, 1),
(14, 43, 1),
(15, 44, 1),
(16, 45, 1),
(17, 46, 1),
(18, 47, 1),
(19, 48, 1),
(20, 49, 1),
(21, 50, 1),
(22, 51, 1),
(23, 52, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `trip_reports`
--

CREATE TABLE `trip_reports` (
  `report_id` int(11) NOT NULL,
  `departure_id` int(11) NOT NULL,
  `guide_id` int(11) NOT NULL,
  `total_passengers` int(11) DEFAULT 0,
  `checked_in_passengers` int(11) DEFAULT 0,
  `incident_count` int(11) DEFAULT 0,
  `vehicle_feedback` text DEFAULT NULL,
  `hotel_feedback` text DEFAULT NULL,
  `restaurant_feedback` text DEFAULT NULL,
  `guide_notes` text NOT NULL,
  `overall_rating` varchar(50) DEFAULT 'Xuất sắc',
  `status` enum('Submitted','Approved') NOT NULL DEFAULT 'Submitted',
  `admin_note` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `trip_reports`
--

INSERT INTO `trip_reports` (`report_id`, `departure_id`, `guide_id`, `total_passengers`, `checked_in_passengers`, `incident_count`, `vehicle_feedback`, `hotel_feedback`, `restaurant_feedback`, `guide_notes`, `overall_rating`, `status`, `admin_note`, `created_at`, `updated_at`) VALUES
(1, 3, 1, 0, 0, 0, 'Xe 45 chỗ đời mới, lái xe nhiệt tình, đi an toàn.', 'Khách sạn sạch đẹp, nhận phòng nhanh chóng, nhân viên hỗ trợ tốt.', 'Thức ăn ngon, vừa miệng đoàn, chuẩn bị đúng giờ.', 'Chuyến đi hoàn thành tốt đẹp, khách hàng hài lòng.', 'Xuất sắc', 'Submitted', NULL, '2026-09-01 01:35:10', '2026-09-01 01:35:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar` text DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `status` enum('Active','Inactive','Blocked') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`user_id`, `role_id`, `full_name`, `email`, `password_hash`, `phone`, `avatar`, `gender`, `date_of_birth`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Admin', 'admin@gmail.com', '$2b$10$x1TcT7jDDa0T2/k73QqzB.uB5Tczgmfou83MQ0jMRvzW/gs4E6RLq', '0900000001', NULL, 'Male', '1990-01-01', 'Active', '2026-06-20 17:53:17', '2026-06-27 05:48:26'),
(2, 2, 'HR Manager', 'hr@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0900000002', NULL, 'Female', '1991-02-02', 'Active', '2026-06-20 17:53:17', '2026-06-27 05:48:34'),
(3, 3, 'Tour Manager', 'manager@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0900000003', NULL, 'Male', '1989-03-03', 'Active', '2026-06-20 17:53:17', '2026-06-27 05:48:40'),
(4, 4, 'Office Staff', 'staff@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0900000004', NULL, 'Female', '1995-04-04', 'Active', '2026-06-20 17:53:17', '2026-06-27 05:48:45'),
(5, 5, 'Guide One', 'guide1@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0900000005', NULL, 'Male', '1992-05-05', 'Active', '2026-06-20 17:53:17', '2026-06-27 05:48:52'),
(6, 5, 'Guide Two', 'guide2@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0900000006', '/uploads/avatar_6_1785853247689.jpg', 'Female', '1993-06-06', 'Active', '2026-06-20 17:53:17', '2026-08-04 14:20:47'),
(7, 6, 'Nguyễn Văn Hoàng', 'nguyenvanhoang@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0900000007', NULL, 'Male', '2000-01-01', 'Active', '2026-06-20 17:53:17', '2026-06-28 07:09:17'),
(8, 6, 'Trần Kiến Quốc', 'trankienquoc@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0900000008', NULL, 'Female', '2001-01-01', 'Active', '2026-06-20 17:53:17', '2026-06-28 07:10:12'),
(9, 7, 'Nha xe Đức Mai', 'ducmai@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0326753674', NULL, 'Male', NULL, 'Active', '2026-06-27 09:59:12', '2026-06-28 06:58:12'),
(10, 4, 'tdoan', 'doanthitramyt2004@gmail.com', '$2b$10$Gpa90D0cbSaicPW3deTo/uxfKC2ehntZ02hC2qeWs8rM02MjXBJLi', '0347853897', NULL, 'Female', '2001-02-06', 'Active', '2026-08-03 13:03:03', '2026-08-03 13:03:03'),
(11, 7, 'Partner', 'partner.muongthanh@travel.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0900000055', NULL, NULL, NULL, 'Active', '2026-08-08 10:23:29', '2026-08-08 10:25:08'),
(12, 7, 'KS Mường Thanh Đà Nẵng', 'muongthanh_dn@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0901234567', NULL, NULL, NULL, 'Active', '2026-08-08 14:38:24', '2026-08-08 14:46:03'),
(13, 7, 'Vinpearl Nha Trang', 'vinpearl_nt@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0902345678', NULL, NULL, NULL, 'Active', '2026-08-08 14:38:24', '2026-08-08 14:46:51'),
(14, 7, 'Nhà Xe Hoàng Long', 'hoanglong_trans@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0903456789', NULL, NULL, NULL, 'Active', '2026-08-08 14:38:24', '2026-08-08 14:46:11');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `departure_id` (`departure_id`),
  ADD KEY `fk_bookings_custom_quotes` (`quote_id`);

--
-- Chỉ mục cho bảng `booking_change_requests`
--
ALTER TABLE `booking_change_requests`
  ADD PRIMARY KEY (`change_id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `processed_by` (`processed_by`);

--
-- Chỉ mục cho bảng `booking_passengers`
--
ALTER TABLE `booking_passengers`
  ADD PRIMARY KEY (`passenger_id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Chỉ mục cho bảng `consultation_requests`
--
ALTER TABLE `consultation_requests`
  ADD PRIMARY KEY (`consultation_id`),
  ADD KEY `handled_by` (`handled_by`);

--
-- Chỉ mục cho bảng `customer_behavior_logs`
--
ALTER TABLE `customer_behavior_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `event_type` (`event_type`),
  ADD KEY `tour_id` (`tour_id`);

--
-- Chỉ mục cho bảng `customer_travel_preferences`
--
ALTER TABLE `customer_travel_preferences`
  ADD PRIMARY KEY (`preference_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `session_id` (`session_id`);

--
-- Chỉ mục cho bảng `custom_tour_quotes`
--
ALTER TABLE `custom_tour_quotes`
  ADD PRIMARY KEY (`quote_id`),
  ADD KEY `request_id` (`request_id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `manager_id` (`manager_id`);

--
-- Chỉ mục cho bảng `custom_tour_requests`
--
ALTER TABLE `custom_tour_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Chỉ mục cho bảng `departures`
--
ALTER TABLE `departures`
  ADD PRIMARY KEY (`departure_id`),
  ADD KEY `tour_id` (`tour_id`);

--
-- Chỉ mục cho bảng `departure_updates`
--
ALTER TABLE `departure_updates`
  ADD PRIMARY KEY (`update_id`),
  ADD KEY `departure_id` (`departure_id`);

--
-- Chỉ mục cho bảng `destinations`
--
ALTER TABLE `destinations`
  ADD PRIMARY KEY (`destination_id`);

--
-- Chỉ mục cho bảng `guides`
--
ALTER TABLE `guides`
  ADD PRIMARY KEY (`guide_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `guide_assignments`
--
ALTER TABLE `guide_assignments`
  ADD PRIMARY KEY (`assignment_id`),
  ADD KEY `departure_id` (`departure_id`),
  ADD KEY `guide_id` (`guide_id`);

--
-- Chỉ mục cho bảng `incident_reports`
--
ALTER TABLE `incident_reports`
  ADD PRIMARY KEY (`incident_id`),
  ADD KEY `guide_id` (`guide_id`),
  ADD KEY `departure_id` (`departure_id`);

--
-- Chỉ mục cho bảng `itineraries`
--
ALTER TABLE `itineraries`
  ADD PRIMARY KEY (`itinerary_id`),
  ADD KEY `tour_id` (`tour_id`);

--
-- Chỉ mục cho bảng `itinerary_activities`
--
ALTER TABLE `itinerary_activities`
  ADD PRIMARY KEY (`activity_id`),
  ADD KEY `itinerary_id` (`itinerary_id`);

--
-- Chỉ mục cho bảng `itinerary_places`
--
ALTER TABLE `itinerary_places`
  ADD PRIMARY KEY (`id`),
  ADD KEY `itinerary_id` (`itinerary_id`),
  ADD KEY `place_id` (`place_id`);

--
-- Chỉ mục cho bảng `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `partners`
--
ALTER TABLE `partners`
  ADD PRIMARY KEY (`partner_id`),
  ADD KEY `fk_partners_destinations` (`destination_id`);

--
-- Chỉ mục cho bảng `partner_services`
--
ALTER TABLE `partner_services`
  ADD PRIMARY KEY (`partner_service_id`),
  ADD KEY `partner_id` (`partner_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Chỉ mục cho bảng `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Chỉ mục cho bảng `payroll`
--
ALTER TABLE `payroll`
  ADD PRIMARY KEY (`payroll_id`),
  ADD UNIQUE KEY `unique_emp_month` (`employee_id`,`salary_month`);

--
-- Chỉ mục cho bảng `performance_reviews`
--
ALTER TABLE `performance_reviews`
  ADD PRIMARY KEY (`performance_id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `reviewer_id` (`reviewer_id`);

--
-- Chỉ mục cho bảng `places`
--
ALTER TABLE `places`
  ADD PRIMARY KEY (`place_id`),
  ADD KEY `fk_places_partner` (`partner_id`);

--
-- Chỉ mục cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `tour_id` (`tour_id`);

--
-- Chỉ mục cho bảng `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Chỉ mục cho bảng `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`service_id`);

--
-- Chỉ mục cho bảng `service_bookings`
--
ALTER TABLE `service_bookings`
  ADD PRIMARY KEY (`booking_id`);

--
-- Chỉ mục cho bảng `service_requests`
--
ALTER TABLE `service_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `departure_id` (`departure_id`),
  ADD KEY `partner_id` (`partner_id`),
  ADD KEY `requested_by` (`requested_by`);

--
-- Chỉ mục cho bảng `timekeeping`
--
ALTER TABLE `timekeeping`
  ADD PRIMARY KEY (`timekeeping_id`),
  ADD UNIQUE KEY `unique_emp_date` (`employee_id`,`work_date`);

--
-- Chỉ mục cho bảng `tours`
--
ALTER TABLE `tours`
  ADD PRIMARY KEY (`tour_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Chỉ mục cho bảng `tour_categories`
--
ALTER TABLE `tour_categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Chỉ mục cho bảng `tour_category_map`
--
ALTER TABLE `tour_category_map`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tour_id` (`tour_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Chỉ mục cho bảng `trip_reports`
--
ALTER TABLE `trip_reports`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `departure_id` (`departure_id`),
  ADD KEY `guide_id` (`guide_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `bookings`
--
ALTER TABLE `bookings`
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `booking_change_requests`
--
ALTER TABLE `booking_change_requests`
  MODIFY `change_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `booking_passengers`
--
ALTER TABLE `booking_passengers`
  MODIFY `passenger_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `consultation_requests`
--
ALTER TABLE `consultation_requests`
  MODIFY `consultation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `customer_behavior_logs`
--
ALTER TABLE `customer_behavior_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT cho bảng `customer_travel_preferences`
--
ALTER TABLE `customer_travel_preferences`
  MODIFY `preference_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `custom_tour_quotes`
--
ALTER TABLE `custom_tour_quotes`
  MODIFY `quote_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `custom_tour_requests`
--
ALTER TABLE `custom_tour_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `departures`
--
ALTER TABLE `departures`
  MODIFY `departure_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT cho bảng `departure_updates`
--
ALTER TABLE `departure_updates`
  MODIFY `update_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT cho bảng `destinations`
--
ALTER TABLE `destinations`
  MODIFY `destination_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT cho bảng `guides`
--
ALTER TABLE `guides`
  MODIFY `guide_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `guide_assignments`
--
ALTER TABLE `guide_assignments`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `incident_reports`
--
ALTER TABLE `incident_reports`
  MODIFY `incident_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT cho bảng `itineraries`
--
ALTER TABLE `itineraries`
  MODIFY `itinerary_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=192;

--
-- AUTO_INCREMENT cho bảng `itinerary_activities`
--
ALTER TABLE `itinerary_activities`
  MODIFY `activity_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=183;

--
-- AUTO_INCREMENT cho bảng `itinerary_places`
--
ALTER TABLE `itinerary_places`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT cho bảng `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `partners`
--
ALTER TABLE `partners`
  MODIFY `partner_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `partner_services`
--
ALTER TABLE `partner_services`
  MODIFY `partner_service_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `payroll`
--
ALTER TABLE `payroll`
  MODIFY `payroll_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `performance_reviews`
--
ALTER TABLE `performance_reviews`
  MODIFY `performance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `places`
--
ALTER TABLE `places`
  MODIFY `place_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=119;

--
-- AUTO_INCREMENT cho bảng `reviews`
--
ALTER TABLE `reviews`
  MODIFY `review_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `services`
--
ALTER TABLE `services`
  MODIFY `service_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT cho bảng `service_bookings`
--
ALTER TABLE `service_bookings`
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `service_requests`
--
ALTER TABLE `service_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `timekeeping`
--
ALTER TABLE `timekeeping`
  MODIFY `timekeeping_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `tours`
--
ALTER TABLE `tours`
  MODIFY `tour_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT cho bảng `tour_categories`
--
ALTER TABLE `tour_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `tour_category_map`
--
ALTER TABLE `tour_category_map`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT cho bảng `trip_reports`
--
ALTER TABLE `trip_reports`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`departure_id`) REFERENCES `departures` (`departure_id`),
  ADD CONSTRAINT `fk_bookings_custom_quotes` FOREIGN KEY (`quote_id`) REFERENCES `custom_tour_quotes` (`quote_id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `booking_change_requests`
--
ALTER TABLE `booking_change_requests`
  ADD CONSTRAINT `booking_change_requests_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`),
  ADD CONSTRAINT `booking_change_requests_ibfk_2` FOREIGN KEY (`processed_by`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `booking_passengers`
--
ALTER TABLE `booking_passengers`
  ADD CONSTRAINT `booking_passengers_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`);

--
-- Các ràng buộc cho bảng `consultation_requests`
--
ALTER TABLE `consultation_requests`
  ADD CONSTRAINT `consultation_requests_ibfk_1` FOREIGN KEY (`handled_by`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `custom_tour_quotes`
--
ALTER TABLE `custom_tour_quotes`
  ADD CONSTRAINT `custom_tour_quotes_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `custom_tour_requests` (`request_id`),
  ADD CONSTRAINT `custom_tour_quotes_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `custom_tour_quotes_ibfk_3` FOREIGN KEY (`manager_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `custom_tour_requests`
--
ALTER TABLE `custom_tour_requests`
  ADD CONSTRAINT `custom_tour_requests_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `departures`
--
ALTER TABLE `departures`
  ADD CONSTRAINT `departures_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`tour_id`);

--
-- Các ràng buộc cho bảng `departure_updates`
--
ALTER TABLE `departure_updates`
  ADD CONSTRAINT `departure_updates_ibfk_1` FOREIGN KEY (`departure_id`) REFERENCES `departures` (`departure_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `guides`
--
ALTER TABLE `guides`
  ADD CONSTRAINT `guides_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `guide_assignments`
--
ALTER TABLE `guide_assignments`
  ADD CONSTRAINT `guide_assignments_ibfk_1` FOREIGN KEY (`departure_id`) REFERENCES `departures` (`departure_id`),
  ADD CONSTRAINT `guide_assignments_ibfk_2` FOREIGN KEY (`guide_id`) REFERENCES `guides` (`guide_id`);

--
-- Các ràng buộc cho bảng `incident_reports`
--
ALTER TABLE `incident_reports`
  ADD CONSTRAINT `incident_reports_ibfk_1` FOREIGN KEY (`guide_id`) REFERENCES `guides` (`guide_id`),
  ADD CONSTRAINT `incident_reports_ibfk_2` FOREIGN KEY (`departure_id`) REFERENCES `departures` (`departure_id`);

--
-- Các ràng buộc cho bảng `itineraries`
--
ALTER TABLE `itineraries`
  ADD CONSTRAINT `itineraries_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`tour_id`);

--
-- Các ràng buộc cho bảng `itinerary_activities`
--
ALTER TABLE `itinerary_activities`
  ADD CONSTRAINT `itinerary_activities_ibfk_1` FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries` (`itinerary_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `itinerary_places`
--
ALTER TABLE `itinerary_places`
  ADD CONSTRAINT `fk_itinerary_places_itinerary` FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries` (`itinerary_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_itinerary_places_place` FOREIGN KEY (`place_id`) REFERENCES `places` (`place_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `partners`
--
ALTER TABLE `partners`
  ADD CONSTRAINT `fk_partners_destinations` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`destination_id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `partner_services`
--
ALTER TABLE `partner_services`
  ADD CONSTRAINT `partner_services_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`partner_id`),
  ADD CONSTRAINT `partner_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`service_id`);

--
-- Các ràng buộc cho bảng `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`);

--
-- Các ràng buộc cho bảng `payroll`
--
ALTER TABLE `payroll`
  ADD CONSTRAINT `payroll_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `performance_reviews`
--
ALTER TABLE `performance_reviews`
  ADD CONSTRAINT `performance_reviews_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `performance_reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `places`
--
ALTER TABLE `places`
  ADD CONSTRAINT `fk_places_partner` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`partner_id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`tour_id`);

--
-- Các ràng buộc cho bảng `service_requests`
--
ALTER TABLE `service_requests`
  ADD CONSTRAINT `service_requests_ibfk_1` FOREIGN KEY (`departure_id`) REFERENCES `departures` (`departure_id`),
  ADD CONSTRAINT `service_requests_ibfk_2` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`partner_id`),
  ADD CONSTRAINT `service_requests_ibfk_3` FOREIGN KEY (`requested_by`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `timekeeping`
--
ALTER TABLE `timekeeping`
  ADD CONSTRAINT `timekeeping_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `tours`
--
ALTER TABLE `tours`
  ADD CONSTRAINT `tours_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `tour_category_map`
--
ALTER TABLE `tour_category_map`
  ADD CONSTRAINT `tour_category_map_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`tour_id`),
  ADD CONSTRAINT `tour_category_map_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `tour_categories` (`category_id`);

--
-- Các ràng buộc cho bảng `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
