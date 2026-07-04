-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th7 04, 2026 lúc 02:05 PM
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
(1, 7, 1, NULL, 1, '2026-06-21 00:53:17', 7000000.00, 'Confirmed', 'Paid', NULL),
(2, 8, 2, NULL, 1, '2026-06-21 00:53:17', 6900000.00, 'Pending', 'Unpaid', NULL),
(3, 3, 1, NULL, 1, '2026-06-26 09:15:40', 3500000.00, 'Pending', 'Unpaid', NULL),
(4, 7, 1, NULL, 1, '2026-06-26 09:30:20', 3500000.00, 'Pending', 'Unpaid', NULL),
(5, 7, 1, NULL, 1, '2026-06-26 10:00:16', 3500000.00, 'Pending', 'Unpaid', NULL),
(6, 8, NULL, 10, 2, '2026-07-04 11:33:52', 2987500.00, 'Confirmed', 'Unpaid', 'Tour thiết kế riêng: Đà Lạt (2026-07-08 - 2026-07-10)');

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
  `processed_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `booking_change_requests`
--

INSERT INTO `booking_change_requests` (`change_id`, `booking_id`, `request_type`, `reason`, `status`, `processed_by`) VALUES
(1, 2, 'Reschedule', 'Bận việc', 'Pending', 4);

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
  `identity_number` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `booking_passengers`
--

INSERT INTO `booking_passengers` (`passenger_id`, `booking_id`, `full_name`, `gender`, `birth_date`, `identity_number`) VALUES
(1, 1, 'Customer A', 'Male', '2000-01-01', 'ID001'),
(2, 2, 'Customer B', 'Female', '2001-01-01', 'ID002');

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
  `approval_status` enum('Pending','Processing','Pending_Approval','Approved','Rejected','Quote_Sent','Customer_Revision','Customer_Accepted') DEFAULT 'Pending',
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
(9, 8, 4, 3, 2390000.00, 20, 2868000.00, '{\"textVersion\":\"CHƯƠNG TRÌNH DU LỊCH ĐÀ LẠT\\n==========================\\n\\nNGÀY 1 (8/7/2026):\\n - Sáng: Đón khách & Khởi hành về khách sạn\\n - Trưa: Đỉnh Langbiang\\n - Chiều/Tối: Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\\n\\nNGÀY 2 (9/7/2026):\\n - Sáng: Thác Datanla\\n - Trưa: Lẩu bò Ba Toa Quán Gỗ\\n - Chiều/Tối: Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\\n\\nNGÀY 3 (10/7/2026):\\n - Sáng: Vườn thú Zoodoo\\n - Trưa: Lẩu gà lá é Tao Ngộ\\n - Chiều/Tối: Chợ Đêm Âm Phủ ➔ Mua sắm đặc sản địa phương & Tiễn khách\\n\\n\",\"dragDropState\":{\"logistics\":{\"pickup\":{\"time\":\"15:01\",\"location\":\"58 Nguyễn Oanh\",\"flightInfo\":\"\",\"note\":\"\"},\"dropoff\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"}},\"fixedServices\":{\"accommodation\":[{\"id\":\"hotel\",\"type\":\"🏨 Lưu trú\",\"name\":\"Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm\",\"price\":1000000}],\"transport\":[{\"id\":\"transport\",\"type\":\"✈️ Di chuyển\",\"name\":\"Nhà xe Phương Trang (FUTA Bus) - Vé xe giường nằm - Khứ hồi\",\"price\":600000}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"8/7/2026\",\"slots\":{\"morning\":[{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành về khách sạn\",\"price\":0}],\"noon\":[{\"id\":\"place_0\",\"type\":\"🎟️ Tham quan\",\"name\":\"Đỉnh Langbiang\",\"price\":120000}],\"evening\":[{\"id\":\"act_2_day_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0}]}},{\"dayIndex\":2,\"dateString\":\"9/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_1\",\"type\":\"🎟️ Tham quan\",\"name\":\"Thác Datanla\",\"price\":170000}],\"noon\":[{\"id\":\"place_3\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lẩu bò Ba Toa Quán Gỗ\",\"price\":200000}],\"evening\":[{\"id\":\"act_2_day_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0}]}},{\"dayIndex\":3,\"dateString\":\"10/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_2\",\"type\":\"🎟️ Tham quan\",\"name\":\"Vườn thú Zoodoo\",\"price\":100000}],\"noon\":[{\"id\":\"place_4\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lẩu gà lá é Tao Ngộ\",\"price\":150000}],\"evening\":[{\"id\":\"place_5\",\"type\":\"🎟️ Tham quan\",\"name\":\"Chợ Đêm Âm Phủ\",\"price\":50000},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản địa phương & Tiễn khách\",\"price\":0}]}}],\"resources\":[{\"id\":\"place_6\",\"type\":\"🎟️ Tham quan\",\"name\":\"Samten Hills Dalat\",\"price\":250000},{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành về khách sạn\",\"price\":0},{\"id\":\"act_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản địa phương & Tiễn khách\",\"price\":0}]}}', 'Khách đồng ý với mức giá đề xuất', 'sửa lại giá', 'Rejected', '2026-07-04 07:55:33'),
(10, 8, 4, 3, 2390000.00, 25, 2987500.00, '{\"textVersion\":\"CHƯƠNG TRÌNH DU LỊCH ĐÀ LẠT\\n==========================\\n\\nNGÀY 1 (8/7/2026):\\n - Sáng: Đón khách & Khởi hành về khách sạn\\n - Trưa: Thác Datanla\\n - Chiều/Tối: Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\\n\\nNGÀY 2 (9/7/2026):\\n - Sáng: Đỉnh Langbiang ➔ Vườn thú Zoodoo\\n - Trưa: Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\\n - Chiều/Tối: Lẩu gà lá é Tao Ngộ\\n\\nNGÀY 3 (10/7/2026):\\n - Sáng: Lẩu bò Ba Toa Quán Gỗ\\n - Trưa: Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\\n - Chiều/Tối: Chợ Đêm Âm Phủ ➔ Mua sắm đặc sản địa phương & Tiễn khách\\n\\n\",\"dragDropState\":{\"logistics\":{\"pickup\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"},\"dropoff\":{\"time\":\"\",\"location\":\"\",\"flightInfo\":\"\",\"note\":\"\"}},\"fixedServices\":{\"accommodation\":[{\"id\":\"hotel\",\"type\":\"🏨 Lưu trú\",\"name\":\"Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm\",\"price\":1000000}],\"transport\":[{\"id\":\"transport\",\"type\":\"✈️ Di chuyển\",\"name\":\"Nhà xe Phương Trang (FUTA Bus) - Vé xe giường nằm - Khứ hồi\",\"price\":600000}]},\"itineraryDays\":[{\"dayIndex\":1,\"dateString\":\"8/7/2026\",\"slots\":{\"morning\":[{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành về khách sạn\",\"price\":0}],\"noon\":[{\"id\":\"place_1\",\"type\":\"🎟️ Tham quan\",\"name\":\"Thác Datanla\",\"price\":170000}],\"evening\":[{\"id\":\"act_2_day_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0}]}},{\"dayIndex\":2,\"dateString\":\"9/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_0\",\"type\":\"🎟️ Tham quan\",\"name\":\"Đỉnh Langbiang\",\"price\":120000},{\"id\":\"place_2\",\"type\":\"🎟️ Tham quan\",\"name\":\"Vườn thú Zoodoo\",\"price\":100000}],\"noon\":[{\"id\":\"act_2_day_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0}],\"evening\":[{\"id\":\"place_4\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lẩu gà lá é Tao Ngộ\",\"price\":150000}]}},{\"dayIndex\":3,\"dateString\":\"10/7/2026\",\"slots\":{\"morning\":[{\"id\":\"place_3\",\"type\":\"🎟️ Tham quan\",\"name\":\"Lẩu bò Ba Toa Quán Gỗ\",\"price\":200000}],\"noon\":[{\"id\":\"act_2_day_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0}],\"evening\":[{\"id\":\"place_5\",\"type\":\"🎟️ Tham quan\",\"name\":\"Chợ Đêm Âm Phủ\",\"price\":50000},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản địa phương & Tiễn khách\",\"price\":0}]}}],\"resources\":[{\"id\":\"place_6\",\"type\":\"🎟️ Tham quan\",\"name\":\"Samten Hills Dalat\",\"price\":250000},{\"id\":\"act_1\",\"type\":\"🕒 Hoạt động\",\"name\":\"Đón khách & Khởi hành về khách sạn\",\"price\":0},{\"id\":\"act_2\",\"type\":\"🕒 Hoạt động\",\"name\":\"Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn\",\"price\":0},{\"id\":\"act_3\",\"type\":\"🕒 Hoạt động\",\"name\":\"Mua sắm đặc sản địa phương & Tiễn khách\",\"price\":0}]}}', 'Khách đồng ý với mức giá đề xuất\n\n[Khách phản hồi]: chỉnh sửa lại ngày cuối', 'sửa lại giá', 'Customer_Accepted', '2026-07-04 08:12:18');

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
  `status` enum('Pending','Processing','Completed') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `custom_tour_requests`
--

INSERT INTO `custom_tour_requests` (`request_id`, `customer_id`, `destination`, `departure_date`, `return_date`, `people_count`, `budget`, `requirements`, `markup_percent`, `base_cost`, `quoted_price`, `staff_note`, `status`, `created_at`) VALUES
(7, 8, 'Nha Trang', '2026-07-24', '2026-07-26', 1, 6000000.00, '{\"hotel\":\"2\",\"transport\":\"9\",\"activities\":[1,2,3,5,4,7,6],\"note\":\"\",\"participantBreakdown\":{\"adults\":1,\"children\":0},\"hotelName\":\"Khách sạn Mường Thanh Nha Trang - Phòng Cao cấp (Deluxe View) - Đêm\",\"hotelPrice\":1200000,\"transportName\":\"Dịch vụ xe ghép 16 chỗ - Thuê xe Du lịch 16 chỗ - Ngày\",\"transportPrice\":1500000,\"selectedPlaces\":[{\"name\":\"VinWonders Nha Trang\",\"price\":880000},{\"name\":\"Tháp Bà Ponagar\",\"price\":30000},{\"name\":\"Lặn biển Hòn Mun\",\"price\":500000},{\"name\":\"Tắm bùn khoáng I-Resort\",\"price\":350000},{\"name\":\"Nem nướng Đặng Văn Quyên\",\"price\":60000},{\"name\":\"Chợ Đêm Nha Trang\",\"price\":0},{\"name\":\"Hải sản Thanh Sương\",\"price\":250000}]}', 15, 4520000.00, 5198000.00, '', 'Processing', '2026-07-02 19:21:35'),
(8, 8, 'Đà Lạt', '2026-07-08', '2026-07-10', 2, 4000000.00, '{\"hotel\":\"3\",\"transport\":\"8\",\"activities\":[8,9,10,12,11,13,14],\"note\":\"\",\"participantBreakdown\":{\"adults\":2,\"children\":0},\"hotelName\":\"Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm\",\"hotelPrice\":1000000,\"transportName\":\"Nhà xe Phương Trang (FUTA Bus) - Vé xe giường nằm - Khứ hồi\",\"transportPrice\":600000,\"selectedPlaces\":[{\"name\":\"Đỉnh Langbiang\",\"price\":120000},{\"name\":\"Thác Datanla\",\"price\":170000},{\"name\":\"Vườn thú Zoodoo\",\"price\":100000},{\"name\":\"Lẩu bò Ba Toa Quán Gỗ\",\"price\":200000},{\"name\":\"Lẩu gà lá é Tao Ngộ\",\"price\":150000},{\"name\":\"Chợ Đêm Âm Phủ\",\"price\":50000},{\"name\":\"Samten Hills Dalat\",\"price\":250000}]}', 20, 0.00, 0.00, NULL, 'Completed', '2026-07-04 07:54:17');

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
  `status` enum('Open','Closed','Completed') DEFAULT 'Open'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `departures`
--

INSERT INTO `departures` (`departure_id`, `tour_id`, `departure_date`, `return_date`, `max_slots`, `available_slots`, `status`) VALUES
(1, 1, '2026-08-01', '2026-08-03', 30, 25, 'Open'),
(2, 2, '2026-08-10', '2026-08-13', 40, 39, 'Open');

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
(4, 'Lào Cai', NULL, NULL, 'Active');

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
(1, 1, 1, '2026-06-21 00:53:18'),
(2, 2, 2, '2026-06-21 00:53:18');

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `incident_reports`
--

INSERT INTO `incident_reports` (`incident_id`, `guide_id`, `departure_id`, `title`, `description`, `status`, `created_at`) VALUES
(1, 1, 1, 'Sự cố nhỏ', 'Xe đến muộn', 'Resolved', '2026-06-20 17:53:18');

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
(1, 1, 1, 'Khởi hành', 'Đi Đà Lạt'),
(2, 1, 2, 'Tham quan', 'LangBiang'),
(3, 2, 1, 'Bay', 'Đến Phú Quốc');

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
(1, 1, 'Khách sạn Mường Thanh Nha Trang', 'Hotel', 'Ms. Lan', '0901234567', 'muongthanh@nt.com', '60 Trần Phú, Nha Trang', 'Active'),
(2, 2, 'Colline Hotel Dalat', 'Hotel', 'Mr. Bình', '0909888777', 'colline@dl.com', '10 Phan Bội Châu, Đà Lạt', 'Active'),
(3, 3, 'Vinpearl Resort Phú Quốc', 'Hotel', 'Ms. Cúc', '02973888', 'vinpearl@pq.com', 'Bãi Dài, Phú Quốc', 'Active'),
(4, NULL, 'Vietnam Airlines', 'Transport', 'Tổng đài', '19001100', 'vna@vietnamairlines.com', 'Toàn cầu', 'Active'),
(5, NULL, 'Nhà xe Phương Trang (FUTA Bus)', 'Transport', 'Mr. Hùng', '19006067', 'futa@bus.com', 'Hệ thống Toàn quốc', 'Active'),
(6, NULL, 'Nhà xe Điền Linh', 'Transport', 'Ms. Mai', '19001900', 'dienlinh@dl.com', 'Hệ thống Toàn quốc', 'Active'),
(7, NULL, 'Dịch vụ xe ghép 16 chỗ', 'Transport', 'Mr. Tuấn', '0988111222', 'xeghep@toanquoc.com', 'Hệ thống Toàn quốc', 'Active');

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

--
-- Đang đổ dữ liệu cho bảng `partner_services`
--

INSERT INTO `partner_services` (`partner_service_id`, `partner_id`, `service_id`, `unit_price`, `available_quantity`, `status`) VALUES
(1, 1, 1, 800000.00, 49, 'Active'),
(2, 1, 2, 1200000.00, 20, 'Active'),
(3, 2, 1, 1000000.00, 29, 'Active'),
(4, 2, 2, 1800000.00, 15, 'Active'),
(5, 3, 1, 1500000.00, 99, 'Active'),
(6, 3, 2, 2500000.00, 50, 'Active'),
(7, 4, 3, 2800000.00, 100, 'Active'),
(8, 5, 4, 600000.00, 40, 'Active'),
(9, 7, 5, 1500000.00, 10, 'Active');

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
(1, 1, 'VNPAY', 7000000.00, 'TX001', 'Success', '2026-06-21 00:53:17'),
(2, 2, 'MOMO', 6900000.00, 'TX002', 'Pending', NULL),
(3, 6, 'VNPAY', 2987500.00, 'TXN_1783164832409', 'Pending', NULL);

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
  `destination` varchar(255) NOT NULL COMMENT 'Tên điểm đến (VD: Nha Trang, Đà Lạt)',
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

INSERT INTO `places` (`place_id`, `destination_id`, `destination`, `place_name`, `category`, `description`, `estimated_price`, `image_url`, `status`) VALUES
(1, 1, '', 'VinWonders Nha Trang', 'Vui chơi', 'Khu giải trí đẳng cấp quốc tế trên đảo Hòn Tre, bao gồm cáp treo vượt biển và công viên nước.', 880000.00, 'vinwonders-nt.jpg', 'Active'),
(2, 1, '', 'Tháp Bà Ponagar', 'Tham quan', 'Quần thể đền tháp Chăm Pa cổ kính, nơi lưu giữ giá trị văn hóa lịch sử độc đáo.', 30000.00, 'thap-ba-nt.jpg', 'Active'),
(3, 1, '', 'Lặn biển Hòn Mun', 'Vui chơi', 'Khu bảo tồn biển với rạn san hô tuyệt đẹp, thích hợp cho lặn bình dưỡng khí.', 500000.00, 'hon-mun-nt.jpg', 'Active'),
(4, 1, '', 'Tắm bùn khoáng I-Resort', 'Nghỉ dưỡng', 'Khu nghỉ dưỡng suối khoáng nóng, dịch vụ tắm bùn chăm sóc sức khỏe.', 350000.00, 'iresort-nt.jpg', 'Active'),
(5, 1, '', 'Nem nướng Đặng Văn Quyên', 'Ăn uống', 'Đặc sản nem nướng nổi tiếng nhất Nha Trang.', 60000.00, 'nem-nuong-nt.jpg', 'Active'),
(6, 1, '', 'Chợ Đêm Nha Trang', 'Mua sắm', 'Khu phố đi bộ sầm uất về đêm, bán đồ lưu niệm và các món ăn đường phố.', 0.00, 'cho-dem-nt.jpg', 'Active'),
(7, 1, '', 'Hải sản Thanh Sương', 'Ăn uống', 'Quán hải sản tươi sống bình dân, chế biến tại chỗ.', 250000.00, 'haisan-nt.jpg', 'Active'),
(8, 2, '', 'Đỉnh Langbiang', 'Tham quan', 'Nóc nhà của Đà Lạt, trải nghiệm đi xe Jeep lên đỉnh ngắm toàn cảnh thành phố.', 120000.00, 'langbiang-dl.jpg', 'Active'),
(9, 2, '', 'Thác Datanla', 'Vui chơi', 'Hệ thống máng trượt xuyên rừng thông dài nhất Đông Nam Á.', 170000.00, 'datanla-dl.jpg', 'Active'),
(10, 2, '', 'Vườn thú Zoodoo', 'Tham quan', 'Mô hình sở thú thân thiện mang phong cách Úc, thích hợp cho gia đình có trẻ nhỏ.', 100000.00, 'zoodoo-dl.jpg', 'Active'),
(11, 2, '', 'Lẩu bò Ba Toa Quán Gỗ', 'Ăn uống', 'Quán lẩu bò mộc mạc lâu đời, hương vị đậm đà xua tan cái lạnh Đà Lạt.', 200000.00, 'laubo-dl.jpg', 'Active'),
(12, 2, '', 'Lẩu gà lá é Tao Ngộ', 'Ăn uống', 'Đặc sản lẩu gà nấm kết hợp với vị cay nồng của lá é.', 150000.00, 'lauga-dl.jpg', 'Active'),
(13, 2, '', 'Chợ Đêm Âm Phủ', 'Mua sắm', 'Thiên đường đồ len và ẩm thực đường phố (bánh tráng nướng, sữa đậu nành).', 50000.00, 'chodem-dl.jpg', 'Active'),
(14, 2, '', 'Samten Hills Dalat', 'Nghỉ dưỡng', 'Khu du lịch tâm linh với bảo tháp kinh luân lớn nhất thế giới.', 250000.00, 'samten-dl.jpg', 'Active'),
(15, 3, '', 'Sun World Hòn Thơm', 'Vui chơi', 'Cáp treo 3 dây vượt biển dài nhất thế giới và công viên nước Aquatopia.', 600000.00, 'honthom-pq.jpg', 'Active'),
(16, 3, '', 'Vinpearl Safari Phú Quốc', 'Tham quan', 'Công viên chăm sóc và bảo tồn động vật bán hoang dã lớn nhất Việt Nam.', 650000.00, 'safari-pq.jpg', 'Active'),
(17, 3, '', 'Grand World Phú Quốc', 'Tham quan', 'Thành phố không ngủ với kiến trúc Venice thu nhỏ và các show diễn thực cảnh.', 0.00, 'grandworld-pq.jpg', 'Active'),
(18, 3, '', 'Bãi Sao', 'Nghỉ dưỡng', 'Một trong những bãi biển đẹp nhất đảo ngọc với cát trắng mịn như kem.', 0.00, 'baisao-pq.jpg', 'Active'),
(19, 3, '', 'Bún quậy Kiến Xây', 'Ăn uống', 'Món bún đặc trưng, thực khách tự tay pha nước chấm theo khẩu vị.', 70000.00, 'bunquay-pq.jpg', 'Active'),
(20, 3, '', 'Chợ đêm Dinh Cậu', 'Mua sắm', 'Khu chợ sầm uất chuyên các món hải sản nướng, đậu phộng chou chou.', 200000.00, 'dinhcau-pq.jpg', 'Active'),
(21, 4, '', 'Đỉnh Fansipan (Cáp treo)', 'Tham quan', 'Chinh phục nóc nhà Đông Dương bằng hệ thống cáp treo hiện đại nhất thế giới.', 800000.00, 'fansipan-sp.jpg', 'Active'),
(22, 4, '', 'Bản Cát Cát', 'Tham quan', 'Bản làng cổ của người H\'Mông, mang đậm bản sắc văn hóa Tây Bắc.', 90000.00, 'catcat-sp.jpg', 'Active'),
(23, 4, '', 'Đèo Ô Quy Hồ', 'Tham quan', 'Một trong tứ đại đỉnh đèo của Việt Nam, điểm săn mây tuyệt đẹp.', 0.00, 'oquyho-sp.jpg', 'Active'),
(24, 4, '', 'Nhà hàng Lẩu Cá Tầm', 'Ăn uống', 'Thưởng thức món lẩu cá tầm tươi ngon sưởi ấm giữa tiết trời lạnh giá.', 300000.00, 'catam-sp.jpg', 'Active');

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

--
-- Đang đổ dữ liệu cho bảng `reviews`
--

INSERT INTO `reviews` (`review_id`, `customer_id`, `tour_id`, `rating`, `comment`, `created_at`) VALUES
(1, 7, 1, 5, 'Rất tốt', '2026-06-20 17:53:18');

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
  `status` enum('Active','Inactive') DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `services`
--

INSERT INTO `services` (`service_id`, `service_name`, `service_type`, `description`, `image_url`, `status`) VALUES
(1, 'Phòng Tiêu chuẩn (Standard) - Đêm', 'Hotel', 'Phòng tiêu chuẩn dành cho 2 người.', '/uploads/1782499498123-120050428.webp', 'Active'),
(2, 'Phòng Cao cấp (Deluxe View) - Đêm', 'Hotel', 'Phòng cao cấp, có ban công view đẹp.', NULL, 'Active'),
(3, 'Vé máy bay Khứ hồi - Phổ thông', 'Transport', 'Vé máy bay khứ hồi (Bao gồm 20kg hành lý).', '/uploads/1782499498123-120050428.webp', 'Active'),
(4, 'Vé xe giường nằm - Khứ hồi', 'Transport', 'Vé xe khách giường nằm cao cấp.', NULL, 'Active'),
(5, 'Thuê xe Du lịch 16 chỗ - Ngày', 'Transport', 'Xe du lịch 16 chỗ đời mới, bao gồm tài xế.', NULL, 'Active');

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
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `tours`
--

INSERT INTO `tours` (`tour_id`, `tour_name`, `description`, `destination`, `duration_days`, `base_price`, `image_url`, `status`, `created_by`) VALUES
(1, 'Đà Lạt', 'Tour Đà Lạt', 'Đà Lạt', 3, 3500000.00, 'da-lat.png', 'Active', 3),
(2, 'Phú Quốc 4N3Đ', 'Tour Phú Quốc', 'Phú Quốc', 4, 6900000.00, '/uploads/1782499498123-120050428.webp', 'Active', 3),
(3, 'Khám phá Sapa - Đỉnh Fansipan', 'Tour Sapa mùa lúa chín, trải nghiệm văn hóa bản địa', 'Lào Cai', 3, 4500000.00, '/uploads/1782537664484-530457340.jpeg', 'Active', 3);

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
(1, 1, 1),
(2, 2, 1);

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
  `avatar` varchar(255) DEFAULT NULL,
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
(6, 5, 'Guide Two', 'guide2@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0900000006', NULL, 'Female', '1993-06-06', 'Active', '2026-06-20 17:53:17', '2026-06-27 05:49:04'),
(7, 6, 'Nguyễn Văn Hoàng', 'nguyenvanhoang@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0900000007', NULL, 'Male', '2000-01-01', 'Active', '2026-06-20 17:53:17', '2026-06-28 07:09:17'),
(8, 6, 'Trần Kiến Quốc', 'trankienquoc@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0900000008', NULL, 'Female', '2001-01-01', 'Active', '2026-06-20 17:53:17', '2026-06-28 07:10:12'),
(9, 7, 'Nha xe Đức Mai', 'ducmai@gmail.com', '$2b$10$J0IzVGhTsyb3WvtoUBrMz.I61x086a5wbbH4bZLkZ3nZMAvj7weru', '0326753674', NULL, 'Male', NULL, 'Active', '2026-06-27 09:59:12', '2026-06-28 06:58:12');

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
  ADD PRIMARY KEY (`place_id`);

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
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `booking_change_requests`
--
ALTER TABLE `booking_change_requests`
  MODIFY `change_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `booking_passengers`
--
ALTER TABLE `booking_passengers`
  MODIFY `passenger_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `consultation_requests`
--
ALTER TABLE `consultation_requests`
  MODIFY `consultation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `custom_tour_quotes`
--
ALTER TABLE `custom_tour_quotes`
  MODIFY `quote_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT cho bảng `custom_tour_requests`
--
ALTER TABLE `custom_tour_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `departures`
--
ALTER TABLE `departures`
  MODIFY `departure_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `destinations`
--
ALTER TABLE `destinations`
  MODIFY `destination_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `guides`
--
ALTER TABLE `guides`
  MODIFY `guide_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `guide_assignments`
--
ALTER TABLE `guide_assignments`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `incident_reports`
--
ALTER TABLE `incident_reports`
  MODIFY `incident_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `itineraries`
--
ALTER TABLE `itineraries`
  MODIFY `itinerary_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `itinerary_places`
--
ALTER TABLE `itinerary_places`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `partners`
--
ALTER TABLE `partners`
  MODIFY `partner_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `partner_services`
--
ALTER TABLE `partner_services`
  MODIFY `partner_service_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `performance_reviews`
--
ALTER TABLE `performance_reviews`
  MODIFY `performance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `places`
--
ALTER TABLE `places`
  MODIFY `place_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

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
  MODIFY `service_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `service_requests`
--
ALTER TABLE `service_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `tours`
--
ALTER TABLE `tours`
  MODIFY `tour_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

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
-- Các ràng buộc cho bảng `performance_reviews`
--
ALTER TABLE `performance_reviews`
  ADD CONSTRAINT `performance_reviews_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `performance_reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`user_id`);

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
