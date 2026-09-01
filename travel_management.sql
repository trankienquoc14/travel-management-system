-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th9 01, 2026 lúc 08:35 AM
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
(8, 31, '2026-09-05', '2026-09-07', 15, 15, 'Open', 6);

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
(18, 'Hồ Chí Minh', NULL, NULL, 'Active', NULL);

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
(38, 10, 3, 'Ngày 3: Chùa Hộ Quốc - Dinh Cậu - Tạm Biệt Phú Quốc', '🌅 07:30 - 08:30: Dùng điểm tâm sáng, làm thủ tục trả phòng resort. HDV tập trung đoàn kiểm tra hành lý.\n\n☀️ 09:00 - 11:30: Viếng Chùa Hộ Quốc (Thiền Viện Trúc Lâm Hộ Quốc) tựa lưng núi hướng biển xanh. Tham quan Nhà thùng nước mắm truyền thống Phụng Hưng & Dinh Cậu tâm linh.\n\n🌇 12:00 - 14:00: Dùng cơm trưa tại Nhà hàng. Mua sắm đặc sản Nước mắm Phú Quốc, Hạt tiêu Suối Đá, Rượu sim làm quà.\n\n🌙 15:00 - 17:00: Xe đưa đoàn ra Sân bay Phú Quốc / Bến tàu. HDV hỗ trợ làm thủ tục check-in vé và gửi lời chào tạm biệt quý khách.');

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
(25, 'Xe 45 chỗ Universe / Ngày', 'Xe vận chuyển', 'Dòng xe 45 chỗ cao cấp nhất, bầu hơi êm ái, chuyên chạy tour ghép đoàn lớn.', '/uploads/1787459109242-530366681.jpeg', 'Active', 3, NULL, 'Xe/Ngày', 2500000.00, 2500000.00, 45, '{}', NULL, NULL);

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
(5, 4, '2026-08-24', 'Present', '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, 1, 98.50, 'Giải trình quên chấm công (Quên Check-in) theo đơn #1');

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
(8, 'Khám phá Phú Quốc', '', 'Phú Quốc', 3, 4271600.00, '/uploads/2caf891f3b5404c5d53fb225dbc185b7', 'Pending', 4, 3620000.00, 18, '{\"fixedServices\":{\"accommodation\":[{\"id\":\"ext_hotel_5_1783576300007\",\"name\":\"Vinpearl Resort Phú Quốc - Phòng Tiêu chuẩn (Standard) - Đêm\",\"type\":\"🏨 Lưu trú\",\"price\":\"1500000.00\",\"original_id\":\"hotel_5\"}],\"transport\":[{\"id\":\"ext_transport_8_1783576298231\",\"name\":\"Nhà xe Phương Trang (FUTA Bus) - Vé xe giường nằm - Khứ hồi\",\"type\":\"✈️ Di chuyển\",\"price\":\"600000.00\",\"original_id\":\"transport_8\"}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"Ngày 1\",\"slots\":{\"morning\":[{\"id\":\"ext_act_1_1783576275292\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0,\"original_id\":\"act_1\"}],\"noon\":[{\"id\":\"ext_place_15_1783576302557\",\"name\":\"Sun World Hòn Thơm\",\"type\":\"🎟️ Tham quan\",\"price\":\"600000.00\",\"original_id\":\"place_15\"}],\"evening\":[{\"id\":\"ext_act_2_1_1783576275292\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"}]}},{\"dayIndex\":2,\"dateString\":\"Ngày 2\",\"slots\":{\"morning\":[{\"id\":\"ext_place_16_1783576310983\",\"name\":\"Vinpearl Safari Phú Quốc\",\"type\":\"🎟️ Tham quan\",\"price\":\"650000.00\",\"original_id\":\"place_16\"}],\"noon\":[{\"id\":\"ext_place_18_1783576315400\",\"name\":\"Bãi Sao\",\"type\":\"🎟️ Tham quan\",\"price\":\"0.00\",\"original_id\":\"place_18\"},{\"id\":\"ext_place_17_1783576321114\",\"name\":\"Grand World Phú Quốc\",\"type\":\"🎟️ Tham quan\",\"price\":\"0.00\",\"original_id\":\"place_17\"}],\"evening\":[{\"id\":\"ext_act_2_2_1783576275292\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"}]}},{\"dayIndex\":3,\"dateString\":\"Ngày 3\",\"slots\":{\"morning\":[{\"id\":\"ext_place_19_1783576319482\",\"name\":\"Bún quậy Kiến Xây\",\"type\":\"🎟️ Tham quan\",\"price\":\"70000.00\",\"original_id\":\"place_19\"}],\"noon\":[{\"id\":\"ext_act_2_3_1783576275292\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"}],\"evening\":[{\"id\":\"ext_act_3_1783576275292\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0,\"original_id\":\"act_3\"},{\"id\":\"ext_place_20_1783576323360\",\"name\":\"Chợ đêm Dinh Cậu\",\"type\":\"🎟️ Tham quan\",\"price\":\"200000.00\",\"original_id\":\"place_20\"}]}}]}', NULL, 0),
(9, 'Tour Đà Lạt ', '', 'Đà Lạt', 3, 4248000.00, '/uploads/985ba96391367fa25195b9f957ffa672', 'Pending', 4, 3540000.00, 20, '{\"fixedServices\":{\"accommodation\":[{\"id\":\"ext_hotel_3_1784017671912\",\"name\":\"Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm\",\"type\":\"🏨 Lưu trú\",\"price\":\"1000000.00\",\"original_id\":\"hotel_3\"}],\"transport\":[{\"id\":\"ext_transport_9_1784017675463\",\"name\":\"Dịch vụ xe ghép 16 chỗ - Thuê xe Du lịch 16 chỗ - Ngày\",\"type\":\"✈️ Di chuyển\",\"price\":\"1500000.00\",\"original_id\":\"transport_9\"}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"Ngày 1\",\"slots\":{\"morning\":[{\"id\":\"ext_act_1_1784017646207\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0,\"original_id\":\"act_1\"}],\"noon\":[{\"id\":\"ext_place_10_1784017691251\",\"name\":\"Vườn thú Zoodoo\",\"type\":\"🎟️ Tham quan\",\"price\":\"100000.00\",\"original_id\":\"place_10\"}],\"evening\":[{\"id\":\"ext_place_11_1784017695703\",\"name\":\"Lẩu bò Ba Toa Quán Gỗ\",\"type\":\"🎟️ Tham quan\",\"price\":\"200000.00\",\"original_id\":\"place_11\"},{\"id\":\"ext_act_2_1_1784017646207\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0,\"original_id\":\"act_2\"}]}},{\"dayIndex\":2,\"dateString\":\"Ngày 2\",\"slots\":{\"morning\":[{\"id\":\"ext_place_8_1784017701098\",\"name\":\"Đỉnh Langbiang\",\"type\":\"🎟️ Tham quan\",\"price\":\"120000.00\",\"original_id\":\"place_8\"}],\"noon\":[{\"id\":\"ext_place_12_1784017706121\",\"name\":\"Lẩu gà lá é Tao Ngộ\",\"type\":\"🎟️ Tham quan\",\"price\":\"150000.00\",\"original_id\":\"place_12\"}],\"evening\":[{\"id\":\"ext_place_13_1784017711271\",\"name\":\"Chợ Đêm Âm Phủ\",\"type\":\"🎟️ Tham quan\",\"price\":\"50000.00\",\"original_id\":\"place_13\"},{\"id\":\"ext_act_2_2_1784017646207\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0,\"original_id\":\"act_2\"}]}},{\"dayIndex\":3,\"dateString\":\"Ngày 3\",\"slots\":{\"morning\":[{\"id\":\"ext_place_9_1784017714803\",\"name\":\"Thác Datanla\",\"type\":\"🎟️ Tham quan\",\"price\":\"170000.00\",\"original_id\":\"place_9\"}],\"noon\":[{\"id\":\"ext_place_14_1784017719234\",\"name\":\"Samten Hills Dalat\",\"type\":\"🎟️ Tham quan\",\"price\":\"250000.00\",\"original_id\":\"place_14\"}],\"evening\":[{\"id\":\"ext_act_3_1784017646207\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0,\"original_id\":\"act_3\"},{\"id\":\"ext_act_2_3_1784017646207\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0,\"original_id\":\"act_2\"}]}}]}', NULL, 0),
(10, 'Khám phá Phú Quốc ', '', 'Phú Quốc', 3, 6984000.00, '/uploads/1784651147243-499615130.jpg', 'Inactive', 4, 5820000.00, 20, '{\"fixedServices\":{\"accommodation\":[{\"id\":\"ext_hotel_5_1784626478505\",\"name\":\"Vinpearl Resort Phú Quốc - Phòng Tiêu chuẩn (Standard) - Đêm\",\"type\":\"🏨 Lưu trú\",\"price\":\"1500000.00\",\"original_id\":\"hotel_5\"}],\"transport\":[{\"id\":\"ext_transport_7_1784626467429\",\"name\":\"Vietnam Airlines - Vé máy bay Khứ hồi - Phổ thông\",\"type\":\"✈️ Di chuyển\",\"price\":\"2800000.00\",\"original_id\":\"transport_7\"}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"Ngày 1\",\"slots\":{\"morning\":[{\"id\":\"ext_act_1_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0,\"original_id\":\"act_1\"}],\"noon\":[{\"id\":\"ext_act_2_1_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"},{\"id\":\"ext_place_15_1784626488681\",\"name\":\"Sun World Hòn Thơm\",\"type\":\"🎟️ Tham quan\",\"price\":\"600000.00\",\"original_id\":\"place_15\"}],\"evening\":[{\"id\":\"ext_place_19_1784626492543\",\"name\":\"Bún quậy Kiến Xây\",\"type\":\"🎟️ Tham quan\",\"price\":\"70000.00\",\"original_id\":\"place_19\"}]}},{\"dayIndex\":2,\"dateString\":\"Ngày 2\",\"slots\":{\"morning\":[{\"id\":\"ext_place_16_1784626503112\",\"name\":\"Vinpearl Safari Phú Quốc\",\"type\":\"🎟️ Tham quan\",\"price\":\"650000.00\",\"original_id\":\"place_16\"}],\"noon\":[{\"id\":\"ext_act_2_2_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"}],\"evening\":[{\"id\":\"ext_place_20_1784626507944\",\"name\":\"Chợ đêm Dinh Cậu\",\"type\":\"🎟️ Tham quan\",\"price\":\"200000.00\",\"original_id\":\"place_20\"}]}},{\"dayIndex\":3,\"dateString\":\"Ngày 3\",\"slots\":{\"morning\":[{\"id\":\"ext_place_18_1784626515233\",\"name\":\"Bãi Sao\",\"type\":\"🎟️ Tham quan\",\"price\":\"0.00\",\"original_id\":\"place_18\"}],\"noon\":[{\"id\":\"ext_act_2_3_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"},{\"id\":\"ext_place_17_1784626511158\",\"name\":\"Grand World Phú Quốc\",\"type\":\"🎟️ Tham quan\",\"price\":\"0.00\",\"original_id\":\"place_17\"}],\"evening\":[{\"id\":\"ext_act_3_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0,\"original_id\":\"act_3\"}]}}]}', NULL, 0),
(27, 'Khám phá Đà Lạt - Nha Trang 4N3Đ', '', '2', 4, 7636000.00, '/uploads/1786955134884-399383371.jpg', 'Pending', 4, 6363333.00, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"18\",\"end_destination_id\":\"2\",\"route_title\":\"Hồ Chí Minh - Đà Lạt\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Di chuyển từ Hồ Chí Minh đến Đà Lạt\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Đến khách sạn nhận phòng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đỉnh Langbiang\",\"price\":\"120000.00\",\"place_id\":8},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Datanla\",\"price\":\"170000.00\",\"place_id\":9},{\"type\":\"Tham quan\",\"name\":\"Tham quan Vườn thú Zoodoo\",\"price\":\"100000.00\",\"place_id\":10},{\"type\":\"Nghỉ ngơi\",\"name\":\"Dùng bữa tối tại nhà hàng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ Đêm Âm Phủ\",\"price\":\"50000.00\",\"place_id\":13}],\"isTitleEdited\":false,\"accommodation\":{\"service_id\":8,\"name\":\"Phòng Superior (hoặc tương đương)\",\"price\":\"1300000.00\",\"meals\":{\"breakfast\":false,\"lunch\":false,\"dinner\":false}}},{\"dayIndex\":2,\"start_destination_id\":\"2\",\"end_destination_id\":\"1\",\"route_title\":\"Đà Lạt - Nha Trang\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Samten Hills Dalat\",\"price\":\"250000.00\",\"place_id\":14},{\"type\":\"Nghỉ ngơi\",\"name\":\"Di chuyển từ Đà Lạt đến Nha Trang\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Đến khách sạn nhận phòng\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"isTitleEdited\":false,\"accommodation\":{\"service_id\":7,\"name\":\"Phòng Standard Hướng Phố (hoặc tương đương)\",\"price\":\"900000.00\",\"meals\":{\"breakfast\":true,\"lunch\":false,\"dinner\":false}}},{\"dayIndex\":3,\"start_destination_id\":\"1\",\"end_destination_id\":\"1\",\"route_title\":\"Nha Trang - Thành phố biển\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành tham quan tại Nha Trang\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan VinWonders Nha Trang\",\"price\":\"880000.00\",\"place_id\":1},{\"type\":\"Tham quan\",\"name\":\"Tham quan Lặn biển Hòn Mun\",\"price\":\"500000.00\",\"place_id\":3},{\"type\":\"Tham quan\",\"name\":\"Tham quan Tháp Bà Ponagar\",\"price\":\"30000.00\",\"place_id\":2},{\"type\":\"Tham quan\",\"name\":\"Tham quan Tắm bùn khoáng I-Resort\",\"price\":\"350000.00\",\"place_id\":4},{\"type\":\"Nghỉ ngơi\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Dùng bữa tối tại nhà hàng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ Đêm Nha Trang\",\"price\":\"0.00\",\"place_id\":6}],\"isTitleEdited\":false,\"accommodation\":{\"service_id\":7,\"name\":\"Phòng Standard Hướng Phố (hoặc tương đương)\",\"price\":\"900000.00\",\"meals\":{\"breakfast\":true,\"lunch\":false,\"dinner\":false}}},{\"dayIndex\":4,\"start_destination_id\":\"1\",\"end_destination_id\":\"18\",\"route_title\":\"Nha Trang - Hồ Chí Minh\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Hải sản Thanh Sương\",\"price\":\"250000.00\",\"place_id\":7},{\"type\":\"Tham quan\",\"name\":\"Tham quan Nem nướng Đặng Văn Quyên\",\"price\":\"60000.00\",\"place_id\":5},{\"type\":\"Nghỉ ngơi\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành về Hồ Chí Minh\",\"price\":0}],\"isTitleEdited\":false}],\"costConfig\":{\"minimumPax\":15,\"margin\":20,\"fixed\":{\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":\"200000\",\"lunch\":\"200000\",\"dinner\":\"200000\",\"tickets\":0,\"insurance\":0},\"ageMultiplier\":{\"child\":75,\"infant\":25},\"selectedTransport\":{\"service_id\":4,\"name\":\"Thuê xe Du lịch 16 chỗ / Ngày\",\"unit\":\"Xe/Ngày\",\"price\":\"1200000.00\"},\"transportTimes\":{\"startD\":\"05:30\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"17:30\"}},\"computed\":{\"netCost\":6363333,\"sellingPrice\":7636000,\"totalDays\":4,\"totalNights\":3,\"totalMeals\":{\"breakfast\":1,\"lunch\":4,\"dinner\":3},\"autoTicketsCost\":2760000,\"autoAccommodationCost\":1550000,\"autoFixedTransport\":4800000,\"autoVariableTransport\":0},\"dayImages\":{\"1\":\"/uploads/1786953540270-33229155.jpg\"}}', NULL, 0),
(29, 'Khám phá Đà Lạt - Nha Trang', 'Bạn có thể tự do khám phá thiên nhiên kỳ thú, tận hưởng trọn vẹn từng khoảng khắc bên bạn bè và người thân', '2', 4, 7599000.00, '/uploads/1787155033861-300696428.jpg', 'Active', 4, 6312666.67, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"18\",\"end_destination_id\":\"2\",\"route_title\":\"Hồ Chí Minh - Đà Lạt\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Di chuyển từ Hồ Chí Minh đến Đà Lạt\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Đến khách sạn nhận phòng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Đỉnh Langbiang\",\"price\":\"120000.00\",\"place_id\":8},{\"type\":\"Tham quan\",\"name\":\"Tham quan Vườn thú Zoodoo\",\"price\":\"100000.00\",\"place_id\":10},{\"type\":\"Tham quan\",\"name\":\"Tham quan Thác Datanla\",\"price\":\"170000.00\",\"place_id\":9},{\"type\":\"Nghỉ ngơi\",\"name\":\"Dùng bữa tối tại nhà hàng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ Đêm Âm Phủ\",\"price\":\"50000.00\",\"place_id\":13}],\"accommodation\":{\"service_id\":8,\"name\":\"Phòng Superior (hoặc tương đương)\",\"price\":\"1300000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":\"external\",\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"2\",\"end_destination_id\":\"1\",\"route_title\":\"Đà Lạt - Nha Trang\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Samten Hills Dalat\",\"price\":\"250000.00\",\"place_id\":14},{\"type\":\"Nghỉ ngơi\",\"name\":\"Di chuyển từ Đà Lạt đến Nha Trang\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Đến khách sạn nhận phòng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Lặn biển Hòn Mun\",\"price\":\"500000.00\",\"place_id\":3},{\"type\":\"Nghỉ ngơi\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Dùng bữa tối tại nhà hàng\",\"price\":0}],\"accommodation\":{\"service_id\":7,\"name\":\"Phòng Standard Hướng Phố (hoặc tương đương)\",\"price\":\"900000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"1\",\"end_destination_id\":\"1\",\"route_title\":\"Nha Trang - Thành phố biển\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành tham quan tại Nha Trang\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan VinWonders Nha Trang\",\"price\":\"880000.00\",\"place_id\":1},{\"type\":\"Tham quan\",\"name\":\"Tham quan Tháp Bà Ponagar\",\"price\":\"30000.00\",\"place_id\":2},{\"type\":\"Tham quan\",\"name\":\"Tham quan Tắm bùn khoáng I-Resort\",\"price\":\"350000.00\",\"place_id\":4},{\"type\":\"Tham quan\",\"name\":\"Tham quan Nem nướng Đặng Văn Quyên\",\"price\":\"60000.00\",\"place_id\":5},{\"type\":\"Nghỉ ngơi\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Dùng bữa tối tại nhà hàng\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ Đêm Nha Trang\",\"price\":\"0.00\",\"place_id\":6}],\"accommodation\":{\"service_id\":7,\"name\":\"Phòng Standard Hướng Phố (hoặc tương đương)\",\"price\":\"900000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":4,\"start_destination_id\":\"1\",\"end_destination_id\":\"18\",\"route_title\":\"Nha Trang - Hồ Chí Minh\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Hải sản Thanh Sương\",\"price\":\"250000.00\",\"place_id\":7},{\"type\":\"Nghỉ ngơi\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0},{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành về Hồ Chí Minh\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":15,\"margin\":20.377019748653492,\"fixed\":{\"transport\":7040000,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":200000,\"lunch\":200000,\"dinner\":200000,\"tickets\":0,\"insurance\":0,\"transportTicket\":0},\"ageMultiplier\":{\"child\":{\"percent\":50,\"fixed_surcharge\":0},\"toddler\":{\"percent\":0,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"road\"},\"selectedTransport\":{\"service_id\":15,\"service_name\":\"Xe Thaco 29 Chỗ\",\"service_type\":\"Xe vận chuyển\",\"description\":\"\",\"image_url\":\"/uploads/1786210745118-332571067.jpg\",\"status\":\"Active\",\"partner_id\":null,\"destination_id\":null,\"unit\":\"Xe/Ngày\",\"base_cost\":\"1760000.00\",\"selling_price\":\"2200000.00\",\"capacity\":0,\"attributes\":\"{}\",\"action_verb\":null,\"short_display_name\":null,\"partner_name\":null,\"destination_name\":null,\"proposed_cost\":\"1800000.00\"},\"transportTimes\":{\"startD\":\"05:30\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"17:30\"}},\"computed\":{\"netCost\":6312666.666666667,\"sellingPrice\":7599000,\"totalDays\":4,\"totalNights\":3,\"totalMeals\":{\"breakfast\":0,\"lunch\":4,\"dinner\":3},\"autoTicketsCost\":2760000},\"categories\":[\"Nghỉ dưỡng\",\"Khám phá\",\"Văn hóa\",\"Biển đảo\",\"Gia đình\"],\"highlights\":\"Tặng đặt sản địa phương\\nKhám phá vẻ đẹp tự nhiên, hoang sơ\",\"dayImages\":{\"1\":\"/uploads/1787155033875-510651347.webp\",\"2\":\"/uploads/1787155033878-433529452.jpg\",\"3\":\"/uploads/1787155033878-395761434.webp\",\"4\":\"/uploads/1787155033882-633882125.jpg\"}}', NULL, 0),
(31, 'Khám phá Đảo Ngọc Phú Quốc 3N2Đ (Cao cấp)', 'Trải nghiệm kỳ nghỉ dưỡng đẳng cấp tại Phú Quốc cùng vé máy bay khứ hồi và khách sạn 5 sao.', '3', 3, 9924000.00, '/uploads/1787457747363-251721431.png', 'Active', 4, 8270000.00, 20, '{\"days\":[{\"dayIndex\":1,\"start_destination_id\":\"18\",\"end_destination_id\":\"3\",\"route_title\":\"Hồ Chí Minh - Phú Quốc\",\"activities\":[{\"type\":\"Nghỉ ngơi\",\"name\":\"Bay đến Phú Quốc\",\"price\":0},{\"type\":\"Tham quan\",\"name\":\"Tham quan Sun World Hòn Thơm\",\"price\":\"600000.00\",\"place_id\":15},{\"type\":\"Tham quan\",\"name\":\"Tham quan Chợ đêm Dinh Cậu\",\"price\":\"200000.00\",\"place_id\":20}],\"accommodation\":{\"service_id\":10,\"name\":\"Emerald Bay View (JW Marriott)\",\"price\":\"5000000.00\"},\"meals\":{\"breakfast\":false,\"lunch\":true,\"dinner\":true}},{\"dayIndex\":2,\"start_destination_id\":\"3\",\"end_destination_id\":\"3\",\"route_title\":\"Phú Quốc - Tuyệt tác thiên nhiên\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Vinpearl Safari Phú Quốc\",\"price\":\"650000.00\",\"place_id\":16},{\"type\":\"Tham quan\",\"name\":\"Tham quan Grand World Phú Quốc\",\"price\":\"0.00\",\"place_id\":17},{\"type\":\"Tham quan\",\"name\":\"Tham quan Bãi Sao\",\"price\":\"0.00\",\"place_id\":18}],\"accommodation\":{\"service_id\":10,\"name\":\"Emerald Bay View (JW Marriott)\",\"price\":\"5000000.00\"},\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":true}},{\"dayIndex\":3,\"start_destination_id\":\"3\",\"end_destination_id\":\"18\",\"route_title\":\"Phú Quốc - Hồ Chí Minh\",\"activities\":[{\"type\":\"Tham quan\",\"name\":\"Tham quan Bún quậy Kiến Xây\",\"price\":\"70000.00\",\"place_id\":19},{\"type\":\"Nghỉ ngơi\",\"name\":\"Khởi hành về Hồ Chí Minh\",\"price\":0}],\"accommodation\":null,\"meals\":{\"breakfast\":\"hotel\",\"lunch\":true,\"dinner\":false}}],\"costConfig\":{\"minimumPax\":2,\"margin\":20,\"fixed\":{\"transport\":0,\"guidePerDay\":500000,\"otherFixed\":0},\"variable\":{\"accommPerNight\":0,\"singleSupplement\":0,\"breakfast\":200000,\"lunch\":200000,\"dinner\":200000,\"tickets\":0,\"insurance\":0},\"ageMultiplier\":{\"child\":{\"percent\":75,\"fixed_surcharge\":0},\"toddler\":{\"percent\":50,\"fixed_surcharge\":0},\"infant\":{\"percent\":0,\"fixed_surcharge\":0},\"preset\":\"flight\"},\"selectedTransport\":{\"service_id\":1,\"service_name\":\"Vé máy bay Khứ hồi - Phổ thông\",\"unit\":\"Vé\",\"price\":\"2200000.00\"},\"transportTimes\":{\"startD\":\"05:30\",\"endD\":\"12:00\",\"startR\":\"12:00\",\"endR\":\"17:30\"}},\"computed\":{\"netCost\":8270000,\"sellingPrice\":9924000,\"totalDays\":3,\"totalNights\":2,\"totalMeals\":{\"breakfast\":0,\"lunch\":3,\"dinner\":2},\"autoTicketsCost\":1520000},\"categories\":[\"Biển đảo\",\"Khám phá\",\"Nghỉ dưỡng cao cấp\"],\"highlights\":\"\",\"dayImages\":{\"1\":\"/uploads/1787457747380-101710045.jpg\",\"2\":\"/uploads/1787457747382-812222074.jpg\",\"3\":\"/uploads/1787457747383-723507097.jpg\"}}', NULL, 0);

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
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT cho bảng `booking_change_requests`
--
ALTER TABLE `booking_change_requests`
  MODIFY `change_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `booking_passengers`
--
ALTER TABLE `booking_passengers`
  MODIFY `passenger_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT cho bảng `consultation_requests`
--
ALTER TABLE `consultation_requests`
  MODIFY `consultation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
  MODIFY `departure_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `departure_updates`
--
ALTER TABLE `departure_updates`
  MODIFY `update_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT cho bảng `destinations`
--
ALTER TABLE `destinations`
  MODIFY `destination_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

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
  MODIFY `itinerary_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT cho bảng `itinerary_activities`
--
ALTER TABLE `itinerary_activities`
  MODIFY `activity_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

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
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

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
  MODIFY `service_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

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
  MODIFY `timekeeping_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `tours`
--
ALTER TABLE `tours`
  MODIFY `tour_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT cho bảng `tour_categories`
--
ALTER TABLE `tour_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `tour_category_map`
--
ALTER TABLE `tour_category_map`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
