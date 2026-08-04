-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th8 04, 2026 lúc 04:25 PM
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

--
-- Đang đổ dữ liệu cho bảng `bookings`
--

INSERT INTO `bookings` (`booking_id`, `customer_id`, `departure_id`, `quote_id`, `num_people`, `booking_date`, `total_amount`, `booking_status`, `payment_status`, `notes`) VALUES
(6, 8, NULL, 10, 2, '2026-07-04 11:33:52', 2987500.00, 'Pending', 'Unpaid', 'Tour Đà Lạt (2026-07-08 - 2026-07-10)'),
(7, 8, NULL, 10, 2, '2026-07-04 18:08:46', 2987500.00, 'Confirmed', 'Paid', 'Tour Đà Lạt (2026-07-08 - 2026-07-10)');

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `custom_tour_quotes`
--

INSERT INTO `custom_tour_quotes` (`quote_id`, `request_id`, `staff_id`, `manager_id`, `base_cost`, `markup_percent`, `quote_price`, `itinerary`, `staff_note`, `manager_note`, `approval_status`, `created_at`) VALUES
(2, 7, 4, 3, 4520000.00, 15, 5198000.00, '{\"textVersion\":\"CHƯƠNG TRÌNH DU LỊCH NHA TRANG\\n==========================\\n\\nNGÀY 1 (24/7/2026):\\n - Sáng: Đón khách & Khởi hành\\n - Trưa: VinWonders Nha Trang\\n - Chiều/Tối: Tự do tắm biển / Nghỉ ngơi\\n\\nNGÀY 2 (25/7/2026):\\n - Sáng: Lặn biển Hòn Mun ➔ Tháp Bà Ponagar\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Tắm bùn khoáng I-Resort\\n\\nNGÀY 3 (26/7/2026):\\n - Sáng: Nem nướng Đặng Văn Quyên\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Mua sắm đặc sản & Trả khách ➔ Chợ Đêm Nha Trang\\n\\n\",\"dragDropState\":{\"logistics\":{\"pickup\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"},\"dropoff\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"}},\"fixedServices\":{\"accommodation\":[{\"id\":\"hotel\",\"type\":\"🏨 Lưu trú\",\"name\":\"Khách sạn Mường Thanh Nha Trang - Phòng Cao cấp (Deluxe View) - Đêm\",\"price\":1200000}],\"transport\":[{\"id\":\"transport\",\"type\":\"✈️ Di chuyển\",\"name\":\"Dịch vụ xe ghép 16 chỗ - Thuê xe Du lịch 16 chỗ - Ngày\",\"price\":1500000}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"24/7/2026\",\"slots\":{\"morning\":[{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0}],\"noon\":[{\"id\":\"place_0\",\"type\":\"🎟️ Tham quan\",\"name\":\"VinWonders Nha Trang\",\"price\":880000}],\"evening\":[{\"id\":\"act_2_day_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}]}},{\"dayIndex\":2,\"dateString\":\"25/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_2\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lặn biển Hòn Mun\",\"price\":500000},{\"id\":\"place_1\",\"type\":\"🎟️ Tham quan\",\"name\":\"Tháp Bà Ponagar\",\"price\":30000}],\"noon\":[{\"id\":\"act_2_day_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"place_3\",\"type\":\"🎟️ Tham quan\",\"name\":\"Tắm bùn khoáng I-Resort\",\"price\":350000}]}},{\"dayIndex\":3,\"dateString\":\"26/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_4\",\"type\":\"🎟️ Tham quan\",\"name\":\"Nem nướng Đặng Văn Quyên\",\"price\":60000}],\"noon\":[{\"id\":\"act_2_day_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0},{\"id\":\"place_5\",\"type\":\"🎟️ Tham quan\",\"name\":\"Chợ Đêm Nha Trang\",\"price\":0}]}}],\"resources\":[{\"id\":\"place_6\",\"type\":\"🎟️ Tham quan\",\"name\":\"Hải sản Thanh Sương\",\"price\":250000},{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"id\":\"act_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0}]}}', '', 'điều chỉnh lại giá', 'Quote_Sent', '2026-07-02 19:26:46'),
(3, 7, 4, 3, 4520000.00, 20, 5424000.00, '{\"textVersion\":\"CHƯƠNG TRÌNH DU LỊCH NHA TRANG\\n==========================\\n\\nNGÀY 1 (24/7/2026):\\n - Sáng: Đón khách & Khởi hành ➔ VinWonders Nha Trang\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Tháp Bà Ponagar\\n\\nNGÀY 2 (25/7/2026):\\n - Sáng: Lặn biển Hòn Mun\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Tắm bùn khoáng I-Resort\\n\\nNGÀY 3 (26/7/2026):\\n - Sáng: Nem nướng Đặng Văn Quyên\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Mua sắm đặc sản & Trả khách ➔ Chợ Đêm Nha Trang\\n\\n\",\"dragDropState\":{\"logistics\":{\"pickup\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"},\"dropoff\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"}},\"fixedServices\":{\"accommodation\":[{\"id\":\"hotel\",\"type\":\"🏨 Lưu trú\",\"name\":\"Khách sạn Mường Thanh Nha Trang - Phòng Cao cấp (Deluxe View) - Đêm\",\"price\":1200000}],\"transport\":[{\"id\":\"transport\",\"type\":\"✈️ Di chuyển\",\"name\":\"Dịch vụ xe ghép 16 chỗ - Thuê xe Du lịch 16 chỗ - Ngày\",\"price\":1500000}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"24/7/2026\",\"slots\":{\"morning\":[{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"id\":\"place_0\",\"type\":\"🎟️ Tham quan\",\"name\":\"VinWonders Nha Trang\",\"price\":880000}],\"noon\":[{\"id\":\"act_2_day_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"place_1\",\"type\":\"🎟️ Tham quan\",\"name\":\"Tháp Bà Ponagar\",\"price\":30000}]}},{\"dayIndex\":2,\"dateString\":\"25/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_2\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lặn biển Hòn Mun\",\"price\":500000}],\"noon\":[{\"id\":\"act_2_day_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"place_3\",\"type\":\"🎟️ Tham quan\",\"name\":\"Tắm bùn khoáng I-Resort\",\"price\":350000}]}},{\"dayIndex\":3,\"dateString\":\"26/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_4\",\"type\":\"🎟️ Tham quan\",\"name\":\"Nem nướng Đặng Văn Quyên\",\"price\":60000}],\"noon\":[{\"id\":\"act_2_day_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0},{\"id\":\"place_5\",\"type\":\"🎟️ Tham quan\",\"name\":\"Chợ Đêm Nha Trang\",\"price\":0}]}}],\"resources\":[{\"id\":\"place_6\",\"type\":\"🎟️ Tham quan\",\"name\":\"Hải sản Thanh Sương\",\"price\":250000},{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"id\":\"act_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0}]}}', 'Đã sửa lại theo lời dặn\n\n[Khách phản hồi]: đổi lịch ngày 3', NULL, 'Quote_Sent', '2026-07-02 19:43:16'),
(4, 7, 4, 3, 4520000.00, 20, 5424000.00, '{\"textVersion\":\"CHƯƠNG TRÌNH DU LỊCH NHA TRANG\\n==========================\\n\\nNGÀY 1 (24/7/2026):\\n - Sáng: Đón khách & Khởi hành ➔ VinWonders Nha Trang\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Tháp Bà Ponagar\\n\\nNGÀY 2 (25/7/2026):\\n - Sáng: Lặn biển Hòn Mun\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Tắm bùn khoáng I-Resort\\n\\nNGÀY 3 (26/7/2026):\\n - Sáng: Nem nướng Đặng Văn Quyên ➔ Mua sắm đặc sản & Trả khách\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Chợ Đêm Nha Trang\\n\\n\",\"dragDropState\":{\"logistics\":{\"pickup\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"},\"dropoff\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"}},\"fixedServices\":{\"accommodation\":[{\"id\":\"hotel\",\"type\":\"🏨 Lưu trú\",\"name\":\"Khách sạn Mường Thanh Nha Trang - Phòng Cao cấp (Deluxe View) - Đêm\",\"price\":1200000}],\"transport\":[{\"id\":\"transport\",\"type\":\"✈️ Di chuyển\",\"name\":\"Dịch vụ xe ghép 16 chỗ - Thuê xe Du lịch 16 chỗ - Ngày\",\"price\":1500000}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"24/7/2026\",\"slots\":{\"morning\":[{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"id\":\"place_0\",\"type\":\"🎟️ Tham quan\",\"name\":\"VinWonders Nha Trang\",\"price\":880000}],\"noon\":[{\"id\":\"act_2_day_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"place_1\",\"type\":\"🎟️ Tham quan\",\"name\":\"Tháp Bà Ponagar\",\"price\":30000}]}},{\"dayIndex\":2,\"dateString\":\"25/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_2\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lặn biển Hòn Mun\",\"price\":500000}],\"noon\":[{\"id\":\"act_2_day_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"place_3\",\"type\":\"🎟️ Tham quan\",\"name\":\"Tắm bùn khoáng I-Resort\",\"price\":350000}]}},{\"dayIndex\":3,\"dateString\":\"26/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_4\",\"type\":\"🎟️ Tham quan\",\"name\":\"Nem nướng Đặng Văn Quyên\",\"price\":60000},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0}],\"noon\":[{\"id\":\"act_2_day_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"place_5\",\"type\":\"🎟️ Tham quan\",\"name\":\"Chợ Đêm Nha Trang\",\"price\":0}]}}],\"resources\":[{\"id\":\"place_6\",\"type\":\"🎟️ Tham quan\",\"name\":\"Hải sản Thanh Sương\",\"price\":250000},{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"id\":\"act_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0}]}}', 'Đã sửa lại theo lời dặn\n\n[Khách phản hồi]: đổi lịch ngày 3', NULL, 'Quote_Sent', '2026-07-02 19:55:43'),
(5, 7, 4, 3, 4520000.00, 20, 5424000.00, '{\"textVersion\":\"CHƯƠNG TRÌNH DU LỊCH NHA TRANG\\n==========================\\n\\nNGÀY 1 (24/7/2026):\\n - Sáng: Đón khách & Khởi hành ➔ VinWonders Nha Trang\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Tháp Bà Ponagar\\n\\nNGÀY 2 (25/7/2026):\\n - Sáng: Tự do tắm biển / Nghỉ ngơi\\n - Trưa: Lặn biển Hòn Mun\\n - Chiều/Tối: Tắm bùn khoáng I-Resort\\n\\nNGÀY 3 (26/7/2026):\\n - Sáng: Nem nướng Đặng Văn Quyên\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Mua sắm đặc sản & Trả khách ➔ Chợ Đêm Nha Trang\\n\\n\",\"dragDropState\":{\"logistics\":{\"pickup\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"},\"dropoff\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"}},\"fixedServices\":{\"accommodation\":[{\"id\":\"hotel\",\"type\":\"🏨 Lưu trú\",\"name\":\"Khách sạn Mường Thanh Nha Trang - Phòng Cao cấp (Deluxe View) - Đêm\",\"price\":1200000}],\"transport\":[{\"id\":\"transport\",\"type\":\"✈️ Di chuyển\",\"name\":\"Dịch vụ xe ghép 16 chỗ - Thuê xe Du lịch 16 chỗ - Ngày\",\"price\":1500000}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"24/7/2026\",\"slots\":{\"morning\":[{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"id\":\"place_0\",\"type\":\"🎟️ Tham quan\",\"name\":\"VinWonders Nha Trang\",\"price\":880000}],\"noon\":[{\"id\":\"act_2_day_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"place_1\",\"type\":\"🎟️ Tham quan\",\"name\":\"Tháp Bà Ponagar\",\"price\":30000}]}},{\"dayIndex\":2,\"dateString\":\"25/7/2026\",\"slots\":{\"morning\":[{\"id\":\"act_2_day_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"noon\":[{\"id\":\"place_2\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lặn biển Hòn Mun\",\"price\":500000}],\"evening\":[{\"id\":\"place_3\",\"type\":\"🎟️ Tham quan\",\"name\":\"Tắm bùn khoáng I-Resort\",\"price\":350000}]}},{\"dayIndex\":3,\"dateString\":\"26/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_4\",\"type\":\"🎟️ Tham quan\",\"name\":\"Nem nướng Đặng Văn Quyên\",\"price\":60000}],\"noon\":[{\"id\":\"act_2_day_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0},{\"id\":\"place_5\",\"type\":\"🎟️ Tham quan\",\"name\":\"Chợ Đêm Nha Trang\",\"price\":0}]}}],\"resources\":[{\"id\":\"place_6\",\"type\":\"🎟️ Tham quan\",\"name\":\"Hải sản Thanh Sương\",\"price\":250000},{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"id\":\"act_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0}]}}', 'Đã sửa lại theo lời dặn\n\n[Khách phản hồi]: đổi lịch ngày 3', NULL, 'Quote_Sent', '2026-07-02 21:04:41'),
(6, 7, 4, 3, 4520000.00, 15, 5198000.00, '{\"textVersion\":\"CHƯƠNG TRÌNH DU LỊCH NHA TRANG\\n==========================\\n\\nNGÀY 1 (24/7/2026):\\n - Sáng: Đón khách & Khởi hành ➔ VinWonders Nha Trang\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Tháp Bà Ponagar\\n\\nNGÀY 2 (25/7/2026):\\n - Sáng: Lặn biển Hòn Mun\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Tắm bùn khoáng I-Resort\\n\\nNGÀY 3 (26/7/2026):\\n - Sáng: Nem nướng Đặng Văn Quyên\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Mua sắm đặc sản & Trả khách ➔ Chợ Đêm Nha Trang\\n\\n\",\"dragDropState\":{\"logistics\":{\"pickup\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"},\"dropoff\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"}},\"fixedServices\":{\"accommodation\":[{\"id\":\"hotel\",\"type\":\"🏨 Lưu trú\",\"name\":\"Khách sạn Mường Thanh Nha Trang - Phòng Cao cấp (Deluxe View) - Đêm\",\"price\":1200000}],\"transport\":[{\"id\":\"transport\",\"type\":\"✈️ Di chuyển\",\"name\":\"Dịch vụ xe ghép 16 chỗ - Thuê xe Du lịch 16 chỗ - Ngày\",\"price\":1500000}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"24/7/2026\",\"slots\":{\"morning\":[{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"id\":\"place_0\",\"type\":\"🎟️ Tham quan\",\"name\":\"VinWonders Nha Trang\",\"price\":880000}],\"noon\":[{\"id\":\"act_2_day_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"place_1\",\"type\":\"🎟️ Tham quan\",\"name\":\"Tháp Bà Ponagar\",\"price\":30000}]}},{\"dayIndex\":2,\"dateString\":\"25/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_2\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lặn biển Hòn Mun\",\"price\":500000}],\"noon\":[{\"id\":\"act_2_day_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"place_3\",\"type\":\"🎟️ Tham quan\",\"name\":\"Tắm bùn khoáng I-Resort\",\"price\":350000}]}},{\"dayIndex\":3,\"dateString\":\"26/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_4\",\"type\":\"🎟️ Tham quan\",\"name\":\"Nem nướng Đặng Văn Quyên\",\"price\":60000}],\"noon\":[{\"id\":\"act_2_day_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0},{\"id\":\"place_5\",\"type\":\"🎟️ Tham quan\",\"name\":\"Chợ Đêm Nha Trang\",\"price\":0}]}}],\"resources\":[{\"id\":\"place_6\",\"type\":\"🎟️ Tham quan\",\"name\":\"Hải sản Thanh Sương\",\"price\":250000},{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"id\":\"act_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0}]}}', 'Đã sửa lại theo lời dặn\n\n[Khách phản hồi]: đổi lịch ngày 3', 'Điều chỉnh lại giá', 'Rejected', '2026-07-03 08:14:35'),
(7, 7, 4, 3, 4520000.00, 20, 5424000.00, '{\"textVersion\":\"CHƯƠNG TRÌNH DU LỊCH NHA TRANG\\n==========================\\n\\nNGÀY 1 (24/7/2026):\\n - Sáng: Đón khách & Khởi hành ➔ VinWonders Nha Trang\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Tháp Bà Ponagar\\n\\nNGÀY 2 (25/7/2026):\\n - Sáng: Lặn biển Hòn Mun\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Tắm bùn khoáng I-Resort\\n\\nNGÀY 3 (26/7/2026):\\n - Sáng: Nem nướng Đặng Văn Quyên\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Mua sắm đặc sản & Trả khách ➔ Chợ Đêm Nha Trang\\n\\n\",\"dragDropState\":{\"logistics\":{\"pickup\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"},\"dropoff\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"}},\"fixedServices\":{\"accommodation\":[{\"id\":\"hotel\",\"type\":\"🏨 Lưu trú\",\"name\":\"Khách sạn Mường Thanh Nha Trang - Phòng Cao cấp (Deluxe View) - Đêm\",\"price\":1200000}],\"transport\":[{\"id\":\"transport\",\"type\":\"✈️ Di chuyển\",\"name\":\"Dịch vụ xe ghép 16 chỗ - Thuê xe Du lịch 16 chỗ - Ngày\",\"price\":1500000}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"24/7/2026\",\"slots\":{\"morning\":[{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"id\":\"place_0\",\"type\":\"🎟️ Tham quan\",\"name\":\"VinWonders Nha Trang\",\"price\":880000}],\"noon\":[{\"id\":\"act_2_day_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"place_1\",\"type\":\"🎟️ Tham quan\",\"name\":\"Tháp Bà Ponagar\",\"price\":30000}]}},{\"dayIndex\":2,\"dateString\":\"25/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_2\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lặn biển Hòn Mun\",\"price\":500000}],\"noon\":[{\"id\":\"act_2_day_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"place_3\",\"type\":\"🎟️ Tham quan\",\"name\":\"Tắm bùn khoáng I-Resort\",\"price\":350000}]}},{\"dayIndex\":3,\"dateString\":\"26/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_4\",\"type\":\"🎟️ Tham quan\",\"name\":\"Nem nướng Đặng Văn Quyên\",\"price\":60000}],\"noon\":[{\"id\":\"act_2_day_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0},{\"id\":\"place_5\",\"type\":\"🎟️ Tham quan\",\"name\":\"Chợ Đêm Nha Trang\",\"price\":0}]}}],\"resources\":[{\"id\":\"place_6\",\"type\":\"🎟️ Tham quan\",\"name\":\"Hải sản Thanh Sương\",\"price\":250000},{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"id\":\"act_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0}]}}', 'Đã sửa lại theo lời dặn\n\n[Khách phản hồi]: đổi lịch ngày 3\n\n[Khách phản hồi]: đổi lịch ngày 3', NULL, 'Customer_Revision', '2026-07-03 08:16:15'),
(8, 7, 4, 3, 4520000.00, 20, 5424000.00, '{\"textVersion\":\"CHƯƠNG TRÌNH DU LỊCH NHA TRANG\\n==========================\\n\\nNGÀY 1 (24/7/2026):\\n - Sáng: Đón khách & Khởi hành ➔ VinWonders Nha Trang\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Tháp Bà Ponagar\\n\\nNGÀY 2 (25/7/2026):\\n - Sáng: Lặn biển Hòn Mun\\n - Trưa: Tự do tắm biển / Nghỉ ngơi\\n - Chiều/Tối: Tắm bùn khoáng I-Resort\\n\\nNGÀY 3 (26/7/2026):\\n - Sáng: Nem nướng Đặng Văn Quyên\\n - Trưa: Mua sắm đặc sản & Trả khách\\n - Chiều/Tối: Chợ Đêm Nha Trang ➔ Tự do tắm biển / Nghỉ ngơi\\n\\n\",\"dragDropState\":{\"logistics\":{\"pickup\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"},\"dropoff\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"}},\"fixedServices\":{\"accommodation\":[{\"id\":\"hotel\",\"type\":\"🏨 Lưu trú\",\"name\":\"Khách sạn Mường Thanh Nha Trang - Phòng Cao cấp (Deluxe View) - Đêm\",\"price\":1200000}],\"transport\":[{\"id\":\"transport\",\"type\":\"✈️ Di chuyển\",\"name\":\"Dịch vụ xe ghép 16 chỗ - Thuê xe Du lịch 16 chỗ - Ngày\",\"price\":1500000}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"24/7/2026\",\"slots\":{\"morning\":[{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"id\":\"place_0\",\"type\":\"🎟️ Tham quan\",\"name\":\"VinWonders Nha Trang\",\"price\":880000}],\"noon\":[{\"id\":\"act_2_day_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"place_1\",\"type\":\"🎟️ Tham quan\",\"name\":\"Tháp Bà Ponagar\",\"price\":30000}]}},{\"dayIndex\":2,\"dateString\":\"25/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_2\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lặn biển Hòn Mun\",\"price\":500000}],\"noon\":[{\"id\":\"act_2_day_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}],\"evening\":[{\"id\":\"place_3\",\"type\":\"🎟️ Tham quan\",\"name\":\"Tắm bùn khoáng I-Resort\",\"price\":350000}]}},{\"dayIndex\":3,\"dateString\":\"26/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_4\",\"type\":\"🎟️ Tham quan\",\"name\":\"Nem nướng Đặng Văn Quyên\",\"price\":60000}],\"noon\":[{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0}],\"evening\":[{\"id\":\"place_5\",\"type\":\"🎟️ Tham quan\",\"name\":\"Chợ Đêm Nha Trang\",\"price\":0},{\"id\":\"act_2_day_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0}]}}],\"resources\":[{\"id\":\"place_6\",\"type\":\"🎟️ Tham quan\",\"name\":\"Hải sản Thanh Sương\",\"price\":250000},{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0},{\"id\":\"act_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ ngơi\",\"price\":0},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0}]}}', 'Đã sửa lại theo lời dặn\n\n[Khách phản hồi]: đổi lịch ngày 3\n\n[Khách phản hồi]: đổi lịch ngày 3', NULL, 'Customer_Accepted', '2026-07-03 11:03:42'),
(9, 8, 4, 3, 2390000.00, 25, 2987500.00, '{\"textVersion\":\"CHƯƠNG TRÌNH DU LỊCH ĐÀ LẠT\\n==========================\\n\\nNGÀY 1 (8/7/2026):\\n - Sáng: Đón khách & Khởi hành về khách sạn\\n - Trưa: Thác Datanla\\n - Chiều/Tối: Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\\n\\nNGÀY 2 (9/7/2026):\\n - Sáng: Đỉnh Langbiang ➔ Vườn thú Zoodoo\\n - Trưa: Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\\n - Chiều/Tối: Lẩu gà lá é Tao Ngộ\\n\\nNGÀY 3 (10/7/2026):\\n - Sáng: Lẩu bò Ba Toa Quán Gỗ\\n - Trưa: Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\\n - Chiều/Tối: Chợ Đêm Âm Phủ ➔ Mua sắm đặc sản địa phương & Tiễn khách\\n\\n\",\"dragDropState\":{\"logistics\":{\"pickup\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"},\"dropoff\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"}},\"fixedServices\":{\"accommodation\":[{\"id\":\"hotel\",\"type\":\"🏨 Lưu trú\",\"name\":\"Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm\",\"price\":1000000}],\"transport\":[{\"id\":\"transport\",\"type\":\"✈️ Di chuyển\",\"name\":\"Nhà xe Phương Trang (FUTA Bus) - Vé xe giường nằm - Khứ hồi\",\"price\":600000}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"8/7/2026\",\"slots\":{\"morning\":[{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành về khách sạn\",\"price\":0}],\"noon\":[{\"id\":\"place_1\",\"type\":\"🎟️ Tham quan\",\"name\":\"Thác Datanla\",\"price\":170000}],\"evening\":[{\"id\":\"act_2_day_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0}]}},{\"dayIndex\":2,\"dateString\":\"9/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_0\",\"type\":\"🎟️ Tham quan\",\"name\":\"Đỉnh Langbiang\",\"price\":120000},{\"id\":\"place_2\",\"type\":\"🎟️ Tham quan\",\"name\":\"Vườn thú Zoodoo\",\"price\":100000}],\"noon\":[{\"id\":\"act_2_day_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0}],\"evening\":[{\"id\":\"place_4\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lẩu gà lá é Tao Ngộ\",\"price\":150000}]}},{\"dayIndex\":3,\"dateString\":\"10/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_3\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lẩu bò Ba Toa Quán Gỗ\",\"price\":200000}],\"noon\":[{\"id\":\"act_2_day_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0}],\"evening\":[{\"id\":\"place_5\",\"type\":\"🎟️ Tham quan\",\"name\":\"Chợ Đêm Âm Phủ\",\"price\":50000},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản địa phương & Tiễn khách\",\"price\":0}]}}],\"resources\":[{\"id\":\"place_6\",\"type\":\"🎟️ Tham quan\",\"name\":\"Samten Hills Dalat\",\"price\":250000},{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành về khách sạn\",\"price\":0},{\"id\":\"act_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản địa phương & Tiễn khách\",\"price\":0}]}}', 'Khách đồng ý với mức giá đề xuất\n\n[Khách phản hồi]: chỉnh sửa lại ngày cuối', 'sửa lại giá', 'Pending_Approval', '2026-07-04 07:55:33'),
(10, 8, 4, 3, 2390000.00, 25, 2987500.00, '{\"textVersion\":\"CHƯƠNG TRÌNH DU LỊCH ĐÀ LẠT\\n==========================\\n\\nNGÀY 1 (8/7/2026):\\n - Sáng: Đón khách & Khởi hành về khách sạn\\n - Trưa: Thác Datanla\\n - Chiều/Tối: Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\\n\\nNGÀY 2 (9/7/2026):\\n - Sáng: Đỉnh Langbiang ➔ Vườn thú Zoodoo\\n - Trưa: Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\\n - Chiều/Tối: Lẩu gà lá é Tao Ngộ\\n\\nNGÀY 3 (10/7/2026):\\n - Sáng: Lẩu bò Ba Toa Quán Gỗ\\n - Trưa: Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\\n - Chiều/Tối: Chợ Đêm Âm Phủ ➔ Mua sắm đặc sản địa phương & Tiễn khách\\n\\n\",\"dragDropState\":{\"logistics\":{\"pickup\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"},\"dropoff\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"}},\"fixedServices\":{\"accommodation\":[{\"id\":\"hotel\",\"type\":\"🏨 Lưu trú\",\"name\":\"Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm\",\"price\":1000000}],\"transport\":[{\"id\":\"transport\",\"type\":\"✈️ Di chuyển\",\"name\":\"Nhà xe Phương Trang (FUTA Bus) - Vé xe giường nằm - Khứ hồi\",\"price\":600000}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"8/7/2026\",\"slots\":{\"morning\":[{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành về khách sạn\",\"price\":0}],\"noon\":[{\"id\":\"place_1\",\"type\":\"🎟️ Tham quan\",\"name\":\"Thác Datanla\",\"price\":170000}],\"evening\":[{\"id\":\"act_2_day_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0}]}},{\"dayIndex\":2,\"dateString\":\"9/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_0\",\"type\":\"🎟️ Tham quan\",\"name\":\"Đỉnh Langbiang\",\"price\":120000},{\"id\":\"place_2\",\"type\":\"🎟️ Tham quan\",\"name\":\"Vườn thú Zoodoo\",\"price\":100000}],\"noon\":[{\"id\":\"act_2_day_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0}],\"evening\":[{\"id\":\"place_4\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lẩu gà lá é Tao Ngộ\",\"price\":150000}]}},{\"dayIndex\":3,\"dateString\":\"10/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_3\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lẩu bò Ba Toa Quán Gỗ\",\"price\":200000}],\"noon\":[{\"id\":\"act_2_day_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0}],\"evening\":[{\"id\":\"place_5\",\"type\":\"🎟️ Tham quan\",\"name\":\"Chợ Đêm Âm Phủ\",\"price\":50000},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản địa phương & Tiễn khách\",\"price\":0}]}}],\"resources\":[{\"id\":\"place_6\",\"type\":\"🎟️ Tham quan\",\"name\":\"Samten Hills Dalat\",\"price\":250000},{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành về khách sạn\",\"price\":0},{\"id\":\"act_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản địa phương & Tiễn khách\",\"price\":0}]}}', 'Khách đồng ý với mức giá đề xuất\n\n[Khách phản hồi]: chỉnh sửa lại ngày cuối', 'sửa lại giá', 'Quote_Sent', '2026-07-04 08:12:18'),
(11, 9, 4, NULL, 0.00, 20, 2928000.00, 'Đang chờ thiết kế...', '', NULL, 'Pending', '2026-07-09 08:40:48'),
(13, 7, 2, NULL, 0.00, 20, 1500000.00, NULL, 'Test', NULL, 'Initial_Quoted', '2026-07-24 08:52:38'),
(14, 10, 4, NULL, 0.00, 20, 2861010.00, NULL, 'Em gửi báo giá ạ', NULL, 'Initial_Quoted', '2026-07-24 09:09:19'),
(15, 10, 4, NULL, 0.00, 20, 2988000.00, NULL, 'Em gửi báo giá ạ', NULL, 'Initial_Quoted', '2026-07-24 10:29:43');

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
(7, 8, 'Nha Trang', '2026-07-24', '2026-07-26', 1, 6000000.00, '{\"hotel\":\"2\",\"transport\":\"9\",\"activities\":[1,2,3,5,4,7,6],\"note\":\"\",\"participantBreakdown\":{\"adults\":1,\"children\":0},\"hotelName\":\"Khách sạn Mường Thanh Nha Trang - Phòng Cao cấp (Deluxe View) - Đêm\",\"hotelPrice\":1200000,\"transportName\":\"Dịch vụ xe ghép 16 chỗ - Thuê xe Du lịch 16 chỗ - Ngày\",\"transportPrice\":1500000,\"selectedPlaces\":[{\"name\":\"VinWonders Nha Trang\",\"price\":880000},{\"name\":\"Tháp Bà Ponagar\",\"price\":30000},{\"name\":\"Lặn biển Hòn Mun\",\"price\":500000},{\"name\":\"Tắm bùn khoáng I-Resort\",\"price\":350000},{\"name\":\"Nem nướng Đặng Văn Quyên\",\"price\":60000},{\"name\":\"Chợ Đêm Nha Trang\",\"price\":0},{\"name\":\"Hải sản Thanh Sương\",\"price\":250000}]}', 15, 4520000.00, 1500000.00, '', 'Initial_Quoted', '2026-07-02 19:21:35'),
(8, 8, 'Đà Lạt', '2026-07-08', '2026-07-10', 2, 4000000.00, '{\"hotel\":\"3\",\"transport\":\"8\",\"activities\":[8,9,10,12,11,13,14],\"note\":\"\",\"participantBreakdown\":{\"adults\":2,\"children\":0},\"hotelName\":\"Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm\",\"hotelPrice\":1000000,\"transportName\":\"Nhà xe Phương Trang (FUTA Bus) - Vé xe giường nằm - Khứ hồi\",\"transportPrice\":600000,\"selectedPlaces\":[{\"name\":\"Đỉnh Langbiang\",\"price\":120000},{\"name\":\"Thác Datanla\",\"price\":170000},{\"name\":\"Vườn thú Zoodoo\",\"price\":100000},{\"name\":\"Lẩu bò Ba Toa Quán Gỗ\",\"price\":200000},{\"name\":\"Lẩu gà lá é Tao Ngộ\",\"price\":150000},{\"name\":\"Chợ Đêm Âm Phủ\",\"price\":50000},{\"name\":\"Samten Hills Dalat\",\"price\":250000}]}', 20, 0.00, 0.00, NULL, 'Pending_Manager_Approval', '2026-07-04 07:54:17'),
(9, 8, 'Đà Lạt', '2026-07-21', '2026-07-23', 2, 5000000.00, '{\"hotel\":\"3\",\"transport\":\"8\",\"activities\":[8,9,10,12,14,13],\"note\":\"\",\"participantBreakdown\":{\"adults\":2,\"children\":0},\"hotelName\":\"Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm\",\"hotelPrice\":1000000,\"transportName\":\"Nhà xe Phương Trang (FUTA Bus) - Vé xe giường nằm - Khứ hồi\",\"transportPrice\":600000,\"selectedPlaces\":[{\"name\":\"Đỉnh Langbiang\",\"price\":120000},{\"name\":\"Thác Datanla\",\"price\":170000},{\"name\":\"Vườn thú Zoodoo\",\"price\":100000},{\"name\":\"Lẩu gà lá é Tao Ngộ\",\"price\":150000},{\"name\":\"Chợ Đêm Âm Phủ\",\"price\":50000},{\"name\":\"Samten Hills Dalat\",\"price\":250000}]}', 20, 0.00, 0.00, NULL, 'Pending_Manager_Approval', '2026-07-09 06:11:25'),
(10, 8, 'Đà Lạt', '2026-07-31', '2026-08-02', 2, 3000000.00, '{\"hotel\":\"8\",\"transport\":\"3\",\"activities\":[8,9,10,13,12,11],\"note\":\"\",\"pickup_location\":\"58 Nguyễn Oanh, Hạnh Thông, Hồ Chí Minh\",\"participantBreakdown\":{\"adults\":2,\"children\":0},\"hotelName\":\"Hôtel Colline Đà Lạt - Phòng Superior\",\"hotelPrice\":1300000,\"transportName\":\"Nhà xe Phương Trang (FUTA) - Vé xe giường nằm đi Tỉnh\",\"transportPrice\":400000,\"selectedPlaces\":[{\"name\":\"Đỉnh Langbiang\",\"price\":120000},{\"name\":\"Thác Datanla\",\"price\":170000},{\"name\":\"Vườn thú Zoodoo\",\"price\":100000},{\"name\":\"Lẩu bò Ba Toa Quán Gỗ\",\"price\":200000},{\"name\":\"Lẩu gà lá é Tao Ngộ\",\"price\":150000},{\"name\":\"Chợ Đêm Âm Phủ\",\"price\":50000}]}', 20, 0.00, 2988000.00, NULL, 'Initial_Quoted', '2026-07-24 07:42:33');

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
(3, 10, '2026-08-07', '2026-08-09', 30, 30, 'Open', 5);

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
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `destinations`
--

CREATE TABLE `destinations` (
  `destination_id` int(11) NOT NULL,
  `destination_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `destinations`
--

INSERT INTO `destinations` (`destination_id`, `destination_name`, `description`, `image_url`, `status`) VALUES
(1, 'Nha Trang', NULL, NULL, 'Active'),
(2, 'Đà Lạt', NULL, NULL, 'Active'),
(3, 'Phú Quốc', NULL, NULL, 'Active'),
(4, 'Lào Cai', NULL, NULL, 'Active'),
(5, 'Đà Nẵng', 'Thành phố biển đáng sống nhất Việt Nam', 'danang.jpg', 'Active'),
(6, 'Hội An', 'Phố cổ Hội An - Di sản Văn hóa Thế giới', 'hoian.jpg', 'Active'),
(7, 'Huế', 'Cố đô Huế với nhiều di tích lịch sử', 'hue.jpg', 'Active'),
(8, 'Hà Nội', 'Thủ đô nghìn năm văn hiến', 'hanoi.jpg', 'Active'),
(9, 'Hạ Long', 'Vịnh Hạ Long - Kỳ quan thiên nhiên thế giới', 'halong.jpg', 'Active'),
(10, 'Quy Nhơn', 'Thành phố biển Bình Định', 'quynhon.jpg', 'Active'),
(11, 'Mũi Né', 'Thiên đường nghỉ dưỡng của Bình Thuận', 'muine.jpg', 'Active'),
(12, 'Cần Thơ', 'Thủ phủ miền Tây sông nước', 'cantho.jpg', 'Active'),
(13, 'Côn Đảo', 'Quần đảo nổi tiếng về lịch sử và biển đẹp', 'condao.jpg', 'Active'),
(14, 'Vũng Tàu', 'Thành phố biển gần TP.HCM', 'vungtau.jpg', 'Active'),
(15, 'Ninh Bình', 'Di sản Tràng An và Tam Cốc', 'ninhbinh.jpg', 'Active'),
(16, 'Quảng Bình', 'Vương quốc hang động Việt Nam', 'quangbinh.jpg', 'Active');

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
(5, 3, 1, '2026-07-28 13:24:01');

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
(5, 1, 'Khách sạn Mường Thanh Luxury', 'Hotel', NULL, NULL, NULL, '60 Trần Phú, Nha Trang', 'Active'),
(6, 2, 'Hôtel Colline Đà Lạt', 'Hotel', NULL, NULL, NULL, '10 Phan Bội Châu, Đà Lạt', 'Active'),
(7, 2, 'Ana Mandara Villas Dalat', 'Hotel', NULL, NULL, NULL, 'Lê Lai, Phường 5, Đà Lạt', 'Active'),
(8, 3, 'JW Marriott Phu Quoc', 'Hotel', NULL, NULL, NULL, 'Bãi Khem, Phú Quốc', 'Active');

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
  `status` varchar(20) DEFAULT 'Active' COMMENT 'Trạng thái: Active hoặc Inactive'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

--
-- Đang đổ dữ liệu cho bảng `payments`
--

INSERT INTO `payments` (`payment_id`, `booking_id`, `payment_method`, `amount`, `transaction_code`, `payment_status`, `paid_at`) VALUES
(3, 6, 'VNPAY', 2987500.00, 'TXN_1783164832409', 'Pending', NULL),
(4, 7, 'Cash', 2987500.00, 'TXN_1783188526882', 'Success', '2026-07-04 18:45:59');

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
(1, 4, 2, 90, 'Hoàn thành tốt', '2026-06-01');

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
  `status` enum('Active','Inactive') DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `places`
--

INSERT INTO `places` (`place_id`, `destination_id`, `partner_id`, `place_name`, `category`, `description`, `estimated_price`, `image_url`, `status`) VALUES
(1, 1, NULL, 'VinWonders Nha Trang', 'Vui chơi', 'Khu giải trí đẳng cấp quốc tế trên đảo Hòn Tre, bao gồm cáp treo vượt biển và công viên nước.', 880000.00, 'vinwonders-nt.jpg', 'Active'),
(2, 1, NULL, 'Tháp Bà Ponagar', 'Tham quan', 'Quần thể đền tháp Chăm Pa cổ kính, nơi lưu giữ giá trị văn hóa lịch sử độc đáo.', 30000.00, 'thap-ba-nt.jpg', 'Active'),
(3, 1, NULL, 'Lặn biển Hòn Mun', 'Vui chơi', 'Khu bảo tồn biển với rạn san hô tuyệt đẹp, thích hợp cho lặn bình dưỡng khí.', 500000.00, 'hon-mun-nt.jpg', 'Active'),
(4, 1, NULL, 'Tắm bùn khoáng I-Resort', 'Nghỉ dưỡng', 'Khu nghỉ dưỡng suối khoáng nóng, dịch vụ tắm bùn chăm sóc sức khỏe.', 350000.00, 'iresort-nt.jpg', 'Active'),
(5, 1, NULL, 'Nem nướng Đặng Văn Quyên', 'Ăn uống', 'Đặc sản nem nướng nổi tiếng nhất Nha Trang.', 60000.00, 'nem-nuong-nt.jpg', 'Active'),
(6, 1, NULL, 'Chợ Đêm Nha Trang', 'Mua sắm', 'Khu phố đi bộ sầm uất về đêm, bán đồ lưu niệm và các món ăn đường phố.', 0.00, 'cho-dem-nt.jpg', 'Active'),
(7, 1, NULL, 'Hải sản Thanh Sương', 'Ăn uống', 'Quán hải sản tươi sống bình dân, chế biến tại chỗ.', 250000.00, 'haisan-nt.jpg', 'Active'),
(8, 2, NULL, 'Đỉnh Langbiang', 'Tham quan', 'Nóc nhà của Đà Lạt, trải nghiệm đi xe Jeep lên đỉnh ngắm toàn cảnh thành phố.', 120000.00, 'langbiang-dl.jpg', 'Active'),
(9, 2, NULL, 'Thác Datanla', 'Vui chơi', 'Hệ thống máng trượt xuyên rừng thông dài nhất Đông Nam Á.', 170000.00, 'datanla-dl.jpg', 'Active'),
(10, 2, NULL, 'Vườn thú Zoodoo', 'Tham quan', 'Mô hình sở thú thân thiện mang phong cách Úc, thích hợp cho gia đình có trẻ nhỏ.', 100000.00, 'zoodoo-dl.jpg', 'Active'),
(11, 2, NULL, 'Lẩu bò Ba Toa Quán Gỗ', 'Ăn uống', 'Quán lẩu bò mộc mạc lâu đời, hương vị đậm đà xua tan cái lạnh Đà Lạt.', 200000.00, 'laubo-dl.jpg', 'Active'),
(12, 2, NULL, 'Lẩu gà lá é Tao Ngộ', 'Ăn uống', 'Đặc sản lẩu gà nấm kết hợp với vị cay nồng của lá é.', 150000.00, 'lauga-dl.jpg', 'Active'),
(13, 2, NULL, 'Chợ Đêm Âm Phủ', 'Mua sắm', 'Thiên đường đồ len và ẩm thực đường phố (bánh tráng nướng, sữa đậu nành).', 50000.00, 'chodem-dl.jpg', 'Active'),
(14, 2, NULL, 'Samten Hills Dalat', 'Nghỉ dưỡng', 'Khu du lịch tâm linh với bảo tháp kinh luân lớn nhất thế giới.', 250000.00, 'samten-dl.jpg', 'Active'),
(15, 3, NULL, 'Sun World Hòn Thơm', 'Vui chơi', 'Cáp treo 3 dây vượt biển dài nhất thế giới và công viên nước Aquatopia.', 600000.00, 'honthom-pq.jpg', 'Active'),
(16, 3, NULL, 'Vinpearl Safari Phú Quốc', 'Tham quan', 'Công viên chăm sóc và bảo tồn động vật bán hoang dã lớn nhất Việt Nam.', 650000.00, 'safari-pq.jpg', 'Active'),
(17, 3, NULL, 'Grand World Phú Quốc', 'Tham quan', 'Thành phố không ngủ với kiến trúc Venice thu nhỏ và các show diễn thực cảnh.', 0.00, 'grandworld-pq.jpg', 'Active'),
(18, 3, NULL, 'Bãi Sao', 'Nghỉ dưỡng', 'Một trong những bãi biển đẹp nhất đảo ngọc với cát trắng mịn như kem.', 0.00, 'baisao-pq.jpg', 'Active'),
(19, 3, NULL, 'Bún quậy Kiến Xây', 'Ăn uống', 'Món bún đặc trưng, thực khách tự tay pha nước chấm theo khẩu vị.', 70000.00, 'bunquay-pq.jpg', 'Active'),
(20, 3, NULL, 'Chợ đêm Dinh Cậu', 'Mua sắm', 'Khu chợ sầm uất chuyên các món hải sản nướng, đậu phộng chou chou.', 200000.00, 'dinhcau-pq.jpg', 'Active'),
(21, 4, NULL, 'Đỉnh Fansipan (Cáp treo)', 'Tham quan', 'Chinh phục nóc nhà Đông Dương bằng hệ thống cáp treo hiện đại nhất thế giới.', 800000.00, 'fansipan-sp.jpg', 'Active'),
(22, 4, NULL, 'Bản Cát Cát', 'Tham quan', 'Bản làng cổ của người H\'Mông, mang đậm bản sắc văn hóa Tây Bắc.', 90000.00, 'catcat-sp.jpg', 'Active'),
(23, 4, NULL, 'Đèo Ô Quy Hồ', 'Tham quan', 'Một trong tứ đại đỉnh đèo của Việt Nam, điểm săn mây tuyệt đẹp.', 0.00, 'oquyho-sp.jpg', 'Active'),
(24, 4, NULL, 'Nhà hàng Lẩu Cá Tầm', 'Ăn uống', 'Thưởng thức món lẩu cá tầm tươi ngon sưởi ấm giữa tiết trời lạnh giá.', 300000.00, 'catam-sp.jpg', 'Active'),
(25, 5, NULL, 'Bà Nà Hills', 'Tham quan', 'Khu du lịch nổi tiếng của Đà Nẵng', 900000.00, 'banahills.jpg', 'Active'),
(26, 5, NULL, 'Cầu Vàng', 'Tham quan', 'Biểu tượng du lịch Đà Nẵng', 0.00, 'cauvang.jpg', 'Active'),
(27, 5, NULL, 'Cầu Rồng', 'Tham quan', 'Cầu phun lửa cuối tuần', 0.00, 'caurong.jpg', 'Active'),
(28, 5, NULL, 'Biển Mỹ Khê', 'Tham quan', 'Một trong những bãi biển đẹp nhất thế giới', 0.00, 'mykhe.jpg', 'Active'),
(29, 5, NULL, 'Ngũ Hành Sơn', 'Tham quan', 'Quần thể núi đá vôi nổi tiếng', 40000.00, 'nguhanhson.jpg', 'Active'),
(30, 5, NULL, 'Asia Park', 'Vui chơi', 'Công viên giải trí', 200000.00, 'asiapark.jpg', 'Active'),
(31, 5, NULL, 'Bảo tàng Chăm', 'Tham quan', 'Bảo tàng nghệ thuật Chăm lớn nhất', 60000.00, 'cham.jpg', 'Active'),
(32, 5, NULL, 'Sơn Trà', 'Tham quan', 'Bán đảo Sơn Trà', 0.00, 'sontra.jpg', 'Active'),
(33, 5, NULL, 'Chùa Linh Ứng', '', 'Ngôi chùa nổi tiếng', 0.00, 'linhung.jpg', 'Active'),
(34, 5, NULL, 'Chợ Hàn', 'Mua sắm', 'Đặc sản Đà Nẵng', 0.00, 'chohan.jpg', 'Active'),
(35, 6, NULL, 'Phố cổ Hội An', 'Tham quan', 'Di sản UNESCO', 120000.00, 'phohoian.jpg', 'Active'),
(36, 6, NULL, 'Chùa Cầu', 'Tham quan', 'Biểu tượng Hội An', 0.00, 'chuacau.jpg', 'Active'),
(37, 6, NULL, 'Rừng dừa Bảy Mẫu', '', 'Đi thuyền thúng', 180000.00, 'baymau.jpg', 'Active'),
(38, 6, NULL, 'Biển An Bàng', 'Tham quan', 'Biển đẹp của Hội An', 0.00, 'anbang.jpg', 'Active'),
(39, 6, NULL, 'Làng gốm Thanh Hà', '', 'Làm gốm', 80000.00, 'thanhha.jpg', 'Active'),
(40, 6, NULL, 'Làng rau Trà Quế', '', 'Làm nông dân', 100000.00, 'traque.jpg', 'Active'),
(41, 7, NULL, 'Đại Nội Huế', 'Tham quan', 'Hoàng thành Huế', 200000.00, 'dainoi.jpg', 'Active'),
(42, 7, NULL, 'Chùa Thiên Mụ', '', 'Ngôi chùa nổi tiếng', 0.00, 'thienmu.jpg', 'Active'),
(43, 7, NULL, 'Lăng Khải Định', 'Tham quan', 'Lăng vua Khải Định', 150000.00, 'khaidinh.jpg', 'Active'),
(44, 7, NULL, 'Lăng Minh Mạng', 'Tham quan', 'Lăng vua Minh Mạng', 150000.00, 'minhmang.jpg', 'Active'),
(45, 7, NULL, 'Sông Hương', '', 'Nghe ca Huế', 150000.00, 'songhuong.jpg', 'Active'),
(46, 7, NULL, 'Chợ Đông Ba', 'Mua sắm', 'Chợ nổi tiếng Huế', 0.00, 'dongba.jpg', 'Active'),
(47, 8, NULL, 'Hồ Hoàn Kiếm', 'Tham quan', 'Biểu tượng Hà Nội', 0.00, 'hohoankiem.jpg', 'Active'),
(48, 8, NULL, 'Lăng Bác', 'Tham quan', 'Lăng Chủ tịch Hồ Chí Minh', 0.00, 'langbac.jpg', 'Active'),
(49, 8, NULL, 'Văn Miếu', 'Tham quan', 'Trường đại học đầu tiên', 70000.00, 'vanmieu.jpg', 'Active'),
(50, 8, NULL, 'Phố cổ Hà Nội', 'Tham quan', '36 phố phường', 0.00, 'phoco.jpg', 'Active'),
(51, 8, NULL, 'Nhà hát Lớn', 'Tham quan', 'Kiến trúc Pháp', 0.00, 'nhahatlon.jpg', 'Active'),
(52, 8, NULL, 'Hồ Tây', 'Tham quan', 'Hồ lớn nhất Hà Nội', 0.00, 'hotay.jpg', 'Active'),
(53, 9, NULL, 'Vịnh Hạ Long', '', 'Kỳ quan thiên nhiên', 950000.00, 'halongbay.jpg', 'Active'),
(54, 9, NULL, 'Hang Sửng Sốt', 'Tham quan', 'Hang động nổi tiếng', 150000.00, 'sungsot.jpg', 'Active'),
(55, 9, NULL, 'Đảo Ti Tốp', 'Tham quan', 'Đảo đẹp của Hạ Long', 100000.00, '/uploads/1784714136526-dao-titop-quang-ninh-02_1625285135.webp', 'Active'),
(56, 9, NULL, 'Sun World Hạ Long', 'Vui chơi', 'Công viên giải trí', 350000.00, '/uploads/1784714091209-sunworldHL.jpg', 'Active'),
(57, 9, NULL, 'Bảo tàng Quảng Ninh', 'Tham quan', 'Kiến trúc độc đáo', 40000.00, '/uploads/1784713934970-images.jpg', 'Active');

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
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `partner_id` int(11) DEFAULT NULL,
  `destination_id` int(11) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `base_cost` decimal(15,2) DEFAULT NULL,
  `selling_price` decimal(15,2) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `attributes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attributes`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `services`
--

INSERT INTO `services` (`service_id`, `service_name`, `service_type`, `description`, `image_url`, `status`, `partner_id`, `destination_id`, `unit`, `base_cost`, `selling_price`, `capacity`, `attributes`) VALUES
(1, 'Vé máy bay Khứ hồi - Phổ thông', 'Vé máy bay', NULL, NULL, 'Active', 1, NULL, 'Vé', 2200000.00, 2500000.00, 1, '{\"vehicle_type\": \"Máy bay\", \"brand\": \"Airbus A321\", \"has_baggage\": \"20kg Ký gửi\"}'),
(2, 'Vé máy bay Khứ hồi - Thương gia', 'Vé máy bay', NULL, NULL, 'Active', 1, NULL, 'Vé', 5500000.00, 6000000.00, 1, '{\"vehicle_type\": \"Máy bay\", \"brand\": \"Boeing 787\", \"has_baggage\": \"30kg Ký gửi + Phòng chờ VIP\"}'),
(3, 'Vé xe giường nằm đi Tỉnh', 'Xe vận chuyển', NULL, NULL, 'Active', 2, NULL, 'Vé', 400000.00, 500000.00, 1, '{\"vehicle_type\": \"Giường nằm 34 chỗ\", \"brand\": \"Thaco Mobihome\"}'),
(4, 'Thuê xe Du lịch 16 chỗ / Ngày', 'Xe vận chuyển', NULL, NULL, 'Active', 3, NULL, 'Xe/Ngày', 1200000.00, 1500000.00, 15, '{\"vehicle_type\": \"Ford Transit\", \"brand\": \"Ford\", \"include_driver\": true}'),
(5, 'Thuê xe Limousine 9 chỗ / Ngày', 'Xe vận chuyển', NULL, NULL, 'Active', 3, NULL, 'Xe/Ngày', 2000000.00, 2500000.00, 9, '{\"vehicle_type\": \"Limousine VIP\", \"brand\": \"Dcar\", \"include_driver\": true, \"massage_seats\": true}'),
(6, 'Phòng Deluxe Ocean View', 'Khách sạn', NULL, NULL, 'Active', 4, 1, 'Phòng/Đêm', 2500000.00, 3000000.00, 2, '{\"star_rating\": 5, \"room_type\": \"Deluxe\", \"bed_type\": \"1 King Bed\", \"has_breakfast\": true}'),
(7, 'Phòng Standard Hướng Phố', 'Khách sạn', NULL, NULL, 'Active', 5, 1, 'Phòng/Đêm', 900000.00, 1200000.00, 2, '{\"star_rating\": 4, \"room_type\": \"Standard\", \"bed_type\": \"2 Twin Beds\", \"has_breakfast\": true}'),
(8, 'Phòng Superior', 'Khách sạn', NULL, NULL, 'Active', 6, 2, 'Phòng/Đêm', 1300000.00, 1600000.00, 2, '{\"star_rating\": 4, \"room_type\": \"Superior\", \"bed_type\": \"1 Queen Bed\", \"has_breakfast\": true}'),
(9, 'Villa 1 Phòng Ngủ (Cổ điển)', 'Khách sạn', NULL, NULL, 'Active', 7, 2, 'Căn/Đêm', 3200000.00, 3800000.00, 2, '{\"star_rating\": 5, \"room_type\": \"Villa\", \"architecture\": \"French Colonial\", \"has_breakfast\": true}'),
(10, 'Emerald Bay View', 'Khách sạn', NULL, NULL, 'Active', 8, 3, 'Phòng/Đêm', 5000000.00, 6000000.00, 2, '{\"star_rating\": 5, \"room_type\": \"Premium\", \"bed_type\": \"1 King Bed\", \"has_breakfast\": true, \"welcome_drink\": true}');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `service_requests`
--

CREATE TABLE `service_requests` (
  `request_id` int(11) NOT NULL,
  `departure_id` int(11) DEFAULT NULL,
  `partner_id` int(11) DEFAULT NULL,
  `requested_by` int(11) DEFAULT NULL,
  `request_content` text DEFAULT NULL,
  `status` enum('Pending','Accepted','Rejected') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `agreed_price` int(11) DEFAULT 0 COMMENT 'Giá thỏa thuận chốt cứng tại thời điểm đặt'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(3, 6, '2026-08-04', 'Late', '21:07:28', NULL, 10.83485025, 106.63647016, 'Hẻm 74 Bùi Quang Là, Khu phố 15, Phường An Hội Tây, Thuận An, Thành phố Hồ Chí Minh, 71427, Việt Nam', 'Browser AI Camera • Mozilla/5.0 (Windows NT 10.0; Win64; x64', '/uploads/face_6_1785852448081.jpg', 1, 98.50, 'Đã xác thực AI khuôn mặt (98.5%) + GPS ±115m');

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
(7, 'Khám phá Đà Lạt', 'Khám phá thành phố ngàn hoa', 'Đà Lạt', 3, 3036000.00, '/uploads/74691fd358e36379d4a32e8986a561e9', 'Active', 4, 2640000.00, 15, '{\"fixedServices\":{\"accommodation\":[{\"id\":\"ext_hotel_3_1783564192169\",\"name\":\"Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm\",\"type\":\"🏨 Lưu trú\",\"price\":\"1000000.00\",\"original_id\":\"hotel_3\"}],\"transport\":[{\"id\":\"ext_transport_8_1783564187414\",\"name\":\"Nhà xe Phương Trang (FUTA Bus) - Vé xe giường nằm - Khứ hồi\",\"type\":\"✈️ Di chuyển\",\"price\":\"600000.00\",\"original_id\":\"transport_8\"}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"Ngày 1\",\"slots\":{\"morning\":[{\"id\":\"ext_act_1_1783564180045\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0,\"original_id\":\"act_1\"}],\"noon\":[{\"id\":\"ext_place_8_1783564199672\",\"name\":\"Đỉnh Langbiang\",\"type\":\"🎟️ Tham quan\",\"price\":\"120000.00\",\"original_id\":\"place_8\"}],\"evening\":[{\"id\":\"ext_place_13_1783564269657\",\"name\":\"Chợ Đêm Âm Phủ\",\"type\":\"🎟️ Tham quan\",\"price\":\"50000.00\",\"original_id\":\"place_13\"},{\"id\":\"ext_act_2_1_1783564180045\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0,\"original_id\":\"act_2\"}]}},{\"dayIndex\":2,\"dateString\":\"Ngày 2\",\"slots\":{\"morning\":[{\"id\":\"ext_place_9_1783564233754\",\"name\":\"Thác Datanla\",\"type\":\"🎟️ Tham quan\",\"price\":\"170000.00\",\"original_id\":\"place_9\"}],\"noon\":[{\"id\":\"ext_place_10_1783564236199\",\"name\":\"Vườn thú Zoodoo\",\"type\":\"🎟️ Tham quan\",\"price\":\"100000.00\",\"original_id\":\"place_10\"}],\"evening\":[{\"id\":\"ext_place_12_1783564242972\",\"name\":\"Lẩu gà lá é Tao Ngộ\",\"type\":\"🎟️ Tham quan\",\"price\":\"150000.00\",\"original_id\":\"place_12\"},{\"id\":\"ext_act_2_2_1783564180045\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0,\"original_id\":\"act_2\"}]}},{\"dayIndex\":3,\"dateString\":\"Ngày 3\",\"slots\":{\"morning\":[{\"id\":\"ext_act_2_3_1783564180045\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0,\"original_id\":\"act_2\"}],\"noon\":[{\"id\":\"ext_place_14_1783564275740\",\"name\":\"Samten Hills Dalat\",\"type\":\"🎟️ Tham quan\",\"price\":\"250000.00\",\"original_id\":\"place_14\"}],\"evening\":[{\"id\":\"ext_place_11_1783564253510\",\"name\":\"Lẩu bò Ba Toa Quán Gỗ\",\"type\":\"🎟️ Tham quan\",\"price\":\"200000.00\",\"original_id\":\"place_11\"},{\"id\":\"ext_act_3_1783564180045\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0,\"original_id\":\"act_3\"}]}}]}', NULL, 0),
(8, 'Khám phá Phú Quốc', '', 'Phú Quốc', 3, 4271600.00, '/uploads/2caf891f3b5404c5d53fb225dbc185b7', 'Pending', 4, 3620000.00, 18, '{\"fixedServices\":{\"accommodation\":[{\"id\":\"ext_hotel_5_1783576300007\",\"name\":\"Vinpearl Resort Phú Quốc - Phòng Tiêu chuẩn (Standard) - Đêm\",\"type\":\"🏨 Lưu trú\",\"price\":\"1500000.00\",\"original_id\":\"hotel_5\"}],\"transport\":[{\"id\":\"ext_transport_8_1783576298231\",\"name\":\"Nhà xe Phương Trang (FUTA Bus) - Vé xe giường nằm - Khứ hồi\",\"type\":\"✈️ Di chuyển\",\"price\":\"600000.00\",\"original_id\":\"transport_8\"}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"Ngày 1\",\"slots\":{\"morning\":[{\"id\":\"ext_act_1_1783576275292\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0,\"original_id\":\"act_1\"}],\"noon\":[{\"id\":\"ext_place_15_1783576302557\",\"name\":\"Sun World Hòn Thơm\",\"type\":\"🎟️ Tham quan\",\"price\":\"600000.00\",\"original_id\":\"place_15\"}],\"evening\":[{\"id\":\"ext_act_2_1_1783576275292\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"}]}},{\"dayIndex\":2,\"dateString\":\"Ngày 2\",\"slots\":{\"morning\":[{\"id\":\"ext_place_16_1783576310983\",\"name\":\"Vinpearl Safari Phú Quốc\",\"type\":\"🎟️ Tham quan\",\"price\":\"650000.00\",\"original_id\":\"place_16\"}],\"noon\":[{\"id\":\"ext_place_18_1783576315400\",\"name\":\"Bãi Sao\",\"type\":\"🎟️ Tham quan\",\"price\":\"0.00\",\"original_id\":\"place_18\"},{\"id\":\"ext_place_17_1783576321114\",\"name\":\"Grand World Phú Quốc\",\"type\":\"🎟️ Tham quan\",\"price\":\"0.00\",\"original_id\":\"place_17\"}],\"evening\":[{\"id\":\"ext_act_2_2_1783576275292\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"}]}},{\"dayIndex\":3,\"dateString\":\"Ngày 3\",\"slots\":{\"morning\":[{\"id\":\"ext_place_19_1783576319482\",\"name\":\"Bún quậy Kiến Xây\",\"type\":\"🎟️ Tham quan\",\"price\":\"70000.00\",\"original_id\":\"place_19\"}],\"noon\":[{\"id\":\"ext_act_2_3_1783576275292\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"}],\"evening\":[{\"id\":\"ext_act_3_1783576275292\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0,\"original_id\":\"act_3\"},{\"id\":\"ext_place_20_1783576323360\",\"name\":\"Chợ đêm Dinh Cậu\",\"type\":\"🎟️ Tham quan\",\"price\":\"200000.00\",\"original_id\":\"place_20\"}]}}]}', NULL, 0),
(9, 'Tour Đà Lạt ', '', 'Đà Lạt', 3, 4248000.00, '/uploads/985ba96391367fa25195b9f957ffa672', 'Pending', 4, 3540000.00, 20, '{\"fixedServices\":{\"accommodation\":[{\"id\":\"ext_hotel_3_1784017671912\",\"name\":\"Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm\",\"type\":\"🏨 Lưu trú\",\"price\":\"1000000.00\",\"original_id\":\"hotel_3\"}],\"transport\":[{\"id\":\"ext_transport_9_1784017675463\",\"name\":\"Dịch vụ xe ghép 16 chỗ - Thuê xe Du lịch 16 chỗ - Ngày\",\"type\":\"✈️ Di chuyển\",\"price\":\"1500000.00\",\"original_id\":\"transport_9\"}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"Ngày 1\",\"slots\":{\"morning\":[{\"id\":\"ext_act_1_1784017646207\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0,\"original_id\":\"act_1\"}],\"noon\":[{\"id\":\"ext_place_10_1784017691251\",\"name\":\"Vườn thú Zoodoo\",\"type\":\"🎟️ Tham quan\",\"price\":\"100000.00\",\"original_id\":\"place_10\"}],\"evening\":[{\"id\":\"ext_place_11_1784017695703\",\"name\":\"Lẩu bò Ba Toa Quán Gỗ\",\"type\":\"🎟️ Tham quan\",\"price\":\"200000.00\",\"original_id\":\"place_11\"},{\"id\":\"ext_act_2_1_1784017646207\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0,\"original_id\":\"act_2\"}]}},{\"dayIndex\":2,\"dateString\":\"Ngày 2\",\"slots\":{\"morning\":[{\"id\":\"ext_place_8_1784017701098\",\"name\":\"Đỉnh Langbiang\",\"type\":\"🎟️ Tham quan\",\"price\":\"120000.00\",\"original_id\":\"place_8\"}],\"noon\":[{\"id\":\"ext_place_12_1784017706121\",\"name\":\"Lẩu gà lá é Tao Ngộ\",\"type\":\"🎟️ Tham quan\",\"price\":\"150000.00\",\"original_id\":\"place_12\"}],\"evening\":[{\"id\":\"ext_place_13_1784017711271\",\"name\":\"Chợ Đêm Âm Phủ\",\"type\":\"🎟️ Tham quan\",\"price\":\"50000.00\",\"original_id\":\"place_13\"},{\"id\":\"ext_act_2_2_1784017646207\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0,\"original_id\":\"act_2\"}]}},{\"dayIndex\":3,\"dateString\":\"Ngày 3\",\"slots\":{\"morning\":[{\"id\":\"ext_place_9_1784017714803\",\"name\":\"Thác Datanla\",\"type\":\"🎟️ Tham quan\",\"price\":\"170000.00\",\"original_id\":\"place_9\"}],\"noon\":[{\"id\":\"ext_place_14_1784017719234\",\"name\":\"Samten Hills Dalat\",\"type\":\"🎟️ Tham quan\",\"price\":\"250000.00\",\"original_id\":\"place_14\"}],\"evening\":[{\"id\":\"ext_act_3_1784017646207\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0,\"original_id\":\"act_3\"},{\"id\":\"ext_act_2_3_1784017646207\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh\",\"price\":0,\"original_id\":\"act_2\"}]}}]}', NULL, 0),
(10, 'Khám phá Phú Quốc ', '', 'Phú Quốc', 3, 6984000.00, '/uploads/1784651147243-499615130.jpg', 'Active', 4, 5820000.00, 20, '{\"fixedServices\":{\"accommodation\":[{\"id\":\"ext_hotel_5_1784626478505\",\"name\":\"Vinpearl Resort Phú Quốc - Phòng Tiêu chuẩn (Standard) - Đêm\",\"type\":\"🏨 Lưu trú\",\"price\":\"1500000.00\",\"original_id\":\"hotel_5\"}],\"transport\":[{\"id\":\"ext_transport_7_1784626467429\",\"name\":\"Vietnam Airlines - Vé máy bay Khứ hồi - Phổ thông\",\"type\":\"✈️ Di chuyển\",\"price\":\"2800000.00\",\"original_id\":\"transport_7\"}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"Ngày 1\",\"slots\":{\"morning\":[{\"id\":\"ext_act_1_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành\",\"price\":0,\"original_id\":\"act_1\"}],\"noon\":[{\"id\":\"ext_act_2_1_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"},{\"id\":\"ext_place_15_1784626488681\",\"name\":\"Sun World Hòn Thơm\",\"type\":\"🎟️ Tham quan\",\"price\":\"600000.00\",\"original_id\":\"place_15\"}],\"evening\":[{\"id\":\"ext_place_19_1784626492543\",\"name\":\"Bún quậy Kiến Xây\",\"type\":\"🎟️ Tham quan\",\"price\":\"70000.00\",\"original_id\":\"place_19\"}]}},{\"dayIndex\":2,\"dateString\":\"Ngày 2\",\"slots\":{\"morning\":[{\"id\":\"ext_place_16_1784626503112\",\"name\":\"Vinpearl Safari Phú Quốc\",\"type\":\"🎟️ Tham quan\",\"price\":\"650000.00\",\"original_id\":\"place_16\"}],\"noon\":[{\"id\":\"ext_act_2_2_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"}],\"evening\":[{\"id\":\"ext_place_20_1784626507944\",\"name\":\"Chợ đêm Dinh Cậu\",\"type\":\"🎟️ Tham quan\",\"price\":\"200000.00\",\"original_id\":\"place_20\"}]}},{\"dayIndex\":3,\"dateString\":\"Ngày 3\",\"slots\":{\"morning\":[{\"id\":\"ext_place_18_1784626515233\",\"name\":\"Bãi Sao\",\"type\":\"🎟️ Tham quan\",\"price\":\"0.00\",\"original_id\":\"place_18\"}],\"noon\":[{\"id\":\"ext_act_2_3_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do tắm biển / Nghỉ dưỡng\",\"price\":0,\"original_id\":\"act_2\"},{\"id\":\"ext_place_17_1784626511158\",\"name\":\"Grand World Phú Quốc\",\"type\":\"🎟️ Tham quan\",\"price\":\"0.00\",\"original_id\":\"place_17\"}],\"evening\":[{\"id\":\"ext_act_3_1784626454547\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản & Trả khách\",\"price\":0,\"original_id\":\"act_3\"}]}}]}', NULL, 0);

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
(10, 4, 'tdoan', 'doanthitramyt2004@gmail.com', '$2b$10$Gpa90D0cbSaicPW3deTo/uxfKC2ehntZ02hC2qeWs8rM02MjXBJLi', '0347853897', NULL, 'Female', '2001-02-06', 'Active', '2026-08-03 13:03:03', '2026-08-03 13:03:03');

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
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

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
  MODIFY `quote_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT cho bảng `custom_tour_requests`
--
ALTER TABLE `custom_tour_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT cho bảng `departures`
--
ALTER TABLE `departures`
  MODIFY `departure_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `departure_updates`
--
ALTER TABLE `departure_updates`
  MODIFY `update_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `destinations`
--
ALTER TABLE `destinations`
  MODIFY `destination_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT cho bảng `guides`
--
ALTER TABLE `guides`
  MODIFY `guide_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `guide_assignments`
--
ALTER TABLE `guide_assignments`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `partners`
--
ALTER TABLE `partners`
  MODIFY `partner_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `partner_services`
--
ALTER TABLE `partner_services`
  MODIFY `partner_service_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `payroll`
--
ALTER TABLE `payroll`
  MODIFY `payroll_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `performance_reviews`
--
ALTER TABLE `performance_reviews`
  MODIFY `performance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `places`
--
ALTER TABLE `places`
  MODIFY `place_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

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
  MODIFY `service_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `service_requests`
--
ALTER TABLE `service_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `timekeeping`
--
ALTER TABLE `timekeeping`
  MODIFY `timekeeping_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `tours`
--
ALTER TABLE `tours`
  MODIFY `tour_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

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
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

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
