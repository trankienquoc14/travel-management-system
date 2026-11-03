const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');

// Lấy danh sách đánh giá của 1 tour (Công khai)
exports.getTourReviews = async (req, res) => {
  try {
    const tourId = req.params.id;

    const [reviews] = await sequelize.query(`
      SELECT 
        r.review_id,
        r.customer_id,
        r.booking_id,
        r.tour_id,
        r.rating,
        r.rating_guide,
        r.rating_vehicle,
        r.rating_service,
        r.comment,
        r.images,
        r.created_at,
        r.updated_at,
        COALESCE(u.full_name, 'Khách hàng') AS customer_name,
        u.avatar AS customer_avatar
      FROM reviews r
      LEFT JOIN users u ON r.customer_id = u.user_id
      WHERE r.tour_id = ?
      ORDER BY r.created_at DESC
    `, {
      replacements: [tourId]
    });

    // Tính toán thống kê điểm số & phân bổ sao
    const total = reviews.length;
    let sumRating = 0;
    let sumGuide = 0;
    let sumVehicle = 0;
    let sumService = 0;
    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    const parsedReviews = reviews.map(rev => {
      const r = Number(rev.rating) || 5;
      sumRating += r;
      sumGuide += Number(rev.rating_guide) || 5;
      sumVehicle += Number(rev.rating_vehicle) || 5;
      sumService += Number(rev.rating_service) || 5;

      if (starCounts[r] !== undefined) {
        starCounts[r]++;
      }

      let imgList = [];
      if (rev.images) {
        try {
          imgList = typeof rev.images === 'string' ? JSON.parse(rev.images) : rev.images;
        } catch (e) {
          imgList = rev.images.split(',').map(s => s.trim()).filter(Boolean);
        }
      }

      return {
        ...rev,
        images: imgList
      };
    });

    const averageRating = total > 0 ? Number((sumRating / total).toFixed(1)) : 5.0;
    const avgGuide = total > 0 ? Number((sumGuide / total).toFixed(1)) : 5.0;
    const avgVehicle = total > 0 ? Number((sumVehicle / total).toFixed(1)) : 5.0;
    const avgService = total > 0 ? Number((sumService / total).toFixed(1)) : 5.0;

    res.status(200).json({
      success: true,
      data: {
        tour_id: Number(tourId),
        average_rating: averageRating,
        review_count: total,
        criteria: {
          guide: avgGuide,
          vehicle: avgVehicle,
          service: avgService
        },
        star_counts: starCounts,
        reviews: parsedReviews
      }
    });

  } catch (error) {
    console.error('Lỗi getTourReviews:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy đánh giá: ' + error.message });
  }
};

// Kiểm tra xem khách hàng hiện tại đã đánh giá tour này chưa (Luồng 4.2)
exports.getMyReviewForTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const customerId = req.user?.user_id || req.user?.id;
    const bookingId = req.query.booking_id;

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập!' });
    }

    let query = `
      SELECT * FROM reviews 
      WHERE customer_id = ? AND (tour_id = ? ${bookingId ? 'OR booking_id = ?' : ''})
      ORDER BY review_id DESC LIMIT 1
    `;
    const replacements = bookingId ? [customerId, tourId, bookingId] : [customerId, tourId];

    const [rows] = await sequelize.query(query, { replacements });

    if (rows && rows.length > 0) {
      const review = rows[0];
      let imgList = [];
      if (review.images) {
        try {
          imgList = typeof review.images === 'string' ? JSON.parse(review.images) : review.images;
        } catch (e) {
          imgList = review.images.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      return res.status(200).json({
        success: true,
        hasReviewed: true,
        review: {
          ...review,
          images: imgList
        }
      });
    }

    res.status(200).json({
      success: true,
      hasReviewed: false,
      review: null
    });

  } catch (error) {
    console.error('Lỗi getMyReviewForTour:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Gửi hoặc Cập nhật Đánh giá Tour
exports.submitTourReview = async (req, res) => {
  try {
    const tourId = Number(req.params.id);
    const customerId = req.user?.user_id || req.user?.id;

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để gửi đánh giá!' });
    }

    const {
      rating,
      rating_guide,
      rating_vehicle,
      rating_service,
      comment,
      booking_id,
      existing_images
    } = req.body;

    // 1. Luồng 4.1: Kiểm tra số sao đánh giá
    const starRating = Number(rating);
    if (!starRating || isNaN(starRating) || starRating < 1 || starRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn số sao đánh giá từ 1 đến 5 sao trước khi gửi.'
      });
    }

    // 2. Tiền điều kiện (Pre-condition): Khách hàng đã hoàn thành chuyến đi
    // Kiểm tra trong CSDL đơn hàng của khách hàng với tour này
    const [eligibleBookings] = await sequelize.query(`
      SELECT b.booking_id, b.booking_status, d.return_date
      FROM bookings b
      LEFT JOIN departures d ON b.departure_id = d.departure_id
      WHERE b.customer_id = ? 
        AND (d.tour_id = ? OR b.departure_id IN (SELECT departure_id FROM departures WHERE tour_id = ?))
        AND (
          b.booking_status = 'Completed' 
          OR (b.booking_status = 'Confirmed' AND d.return_date <= CURDATE())
          ${booking_id ? 'OR b.booking_id = ?' : ''}
        )
      LIMIT 1
    `, {
      replacements: booking_id ? [customerId, tourId, tourId, booking_id] : [customerId, tourId, tourId]
    });

    if (!eligibleBookings || eligibleBookings.length === 0) {
      // Nếu có booking_id được gửi lên, kiểm tra trực tiếp booking đó
      if (booking_id) {
        const [directBkg] = await sequelize.query(`
          SELECT booking_id, booking_status FROM bookings WHERE booking_id = ? AND customer_id = ?
        `, { replacements: [booking_id, customerId] });

        if (!directBkg || directBkg.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'Bạn chưa hoàn thành chuyến đi này hoặc không sở hữu đơn hàng tương ứng.'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'Chỉ khách hàng đã hoàn thành chuyến đi tour mới có thể gửi đánh giá.'
        });
      }
    }

    const targetBookingId = booking_id || (eligibleBookings[0] ? eligibleBookings[0].booking_id : null);

    // 3. Xử lý hình ảnh (Ảnh mới upload + Ảnh cũ giữ lại)
    let imagesList = [];
    if (existing_images) {
      try {
        const parsed = typeof existing_images === 'string' ? JSON.parse(existing_images) : existing_images;
        if (Array.isArray(parsed)) imagesList.push(...parsed);
      } catch (e) {
        if (typeof existing_images === 'string') imagesList.push(existing_images);
      }
    }

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        imagesList.push(`/uploads/${file.filename}`);
      });
    }

    // Các tiêu chí chi tiết (mặc định 5 sao nếu không chọn)
    const guideStar = Math.min(5, Math.max(1, Number(rating_guide) || starRating));
    const vehicleStar = Math.min(5, Math.max(1, Number(rating_vehicle) || starRating));
    const serviceStar = Math.min(5, Math.max(1, Number(rating_service) || starRating));
    const commentText = (comment || '').trim();
    const imagesJson = JSON.stringify(imagesList);

    // 4. Luồng 4.2: Kiểm tra xem khách hàng đã đánh giá tour này trước đó chưa
    let existingCheckQuery = `
      SELECT review_id FROM reviews 
      WHERE customer_id = ? AND (tour_id = ? ${targetBookingId ? 'OR booking_id = ?' : ''})
      LIMIT 1
    `;
    const checkReplacements = targetBookingId ? [customerId, tourId, targetBookingId] : [customerId, tourId];
    const [existingRows] = await sequelize.query(existingCheckQuery, { replacements: checkReplacements });

    let reviewId = null;
    let isUpdate = false;

    if (existingRows && existingRows.length > 0) {
      // Cập nhật đánh giá cũ (Luồng 4.2)
      isUpdate = true;
      reviewId = existingRows[0].review_id;
      await sequelize.query(`
        UPDATE reviews
        SET 
          rating = ?,
          rating_guide = ?,
          rating_vehicle = ?,
          rating_service = ?,
          comment = ?,
          images = ?,
          booking_id = COALESCE(?, booking_id),
          updated_at = NOW()
        WHERE review_id = ?
      `, {
        replacements: [
          starRating,
          guideStar,
          vehicleStar,
          serviceStar,
          commentText,
          imagesJson,
          targetBookingId,
          reviewId
        ]
      });
    } else {
      // Tạo bản ghi đánh giá mới (Luồng chính 5)
      const [insertResult] = await sequelize.query(`
        INSERT INTO reviews (
          customer_id,
          booking_id,
          tour_id,
          rating,
          rating_guide,
          rating_vehicle,
          rating_service,
          comment,
          images,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          customerId,
          targetBookingId,
          tourId,
          starRating,
          guideStar,
          vehicleStar,
          serviceStar,
          commentText,
          imagesJson
        ]
      });
      reviewId = insertResult;
    }

    // 5. Luồng chính 6: Tự động tính toán lại điểm số sao trung bình của tour và cập nhật vào CSDL
    const [calcRows] = await sequelize.query(`
      SELECT 
        COUNT(*) AS total_count,
        AVG(rating) AS avg_rating
      FROM reviews
      WHERE tour_id = ?
    `, {
      replacements: [tourId]
    });

    const newReviewCount = calcRows[0]?.total_count || 1;
    const newAvgRating = calcRows[0]?.avg_rating ? Number(Number(calcRows[0].avg_rating).toFixed(2)) : starRating;

    await sequelize.query(`
      UPDATE tours 
      SET 
        average_rating = ?,
        review_count = ?
      WHERE tour_id = ?
    `, {
      replacements: [newAvgRating, newReviewCount, tourId]
    });

    // 6. Trả về thông báo chuẩn theo đúng đặc tả:
    // "Cảm ơn bạn đã gửi đánh giá! Ý kiến của bạn giúp chúng tôi cải thiện chất lượng dịch vụ"
    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: 'Cảm ơn bạn đã gửi đánh giá! Ý kiến của bạn giúp chúng tôi cải thiện chất lượng dịch vụ.',
      isUpdate,
      data: {
        review_id: reviewId,
        tour_id: tourId,
        rating: starRating,
        rating_guide: guideStar,
        rating_vehicle: vehicleStar,
        rating_service: serviceStar,
        comment: commentText,
        images: imagesList,
        average_rating: newAvgRating,
        review_count: newReviewCount
      }
    });

  } catch (error) {
    console.error('Lỗi submitTourReview:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi gửi đánh giá: ' + error.message });
  }
};
