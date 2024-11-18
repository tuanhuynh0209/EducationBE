const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
// const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const pool = require("./db");

//middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());


app.listen(3001, () => {
    console.log('Server is running at port 3001')
});

// DONE

// Search
// Tìm kiếm API
app.get("/education/search", async (req, res) => {
    const { keyword, type } = req.query; // keyword: mã số hoặc mã bảng, type: loại tìm kiếm (msnv hoặc ma)

    try {
        let result;

        if (type === 'msnv') {
            // Tìm kiếm theo mã số nhân viên
            const userQuery = `SELECT * FROM users WHERE msnv = $1`;
            const articlesQuery = `SELECT * FROM bai_bao_khoa_hoc WHERE msnv = $1`;
            const documentsQuery = `SELECT * FROM tai_lieu WHERE msnv = $1`;
            const topicsQuery = `SELECT * FROM nghien_cuu_de_tai WHERE msnv = $1`;
            const initiativesQuery = `SELECT * FROM sang_kien WHERE msnv = $1`;
            const productsQuery = `SELECT * FROM san_pham_khcn WHERE msnv = $1`;
            const councilsQuery = `SELECT * FROM hoi_dong WHERE msnv = $1`;
            const reportsQuery = `SELECT * FROM bao_cao_khoa_hoc WHERE msnv = $1`;
            const conferencesQuery = `SELECT * FROM hoi_nghi_khoa_hoc WHERE msnv = $1`;

            const userResult = await pool.query(userQuery, [keyword]);
            const articlesResult = await pool.query(articlesQuery, [keyword]);
            const documentsResult = await pool.query(documentsQuery, [keyword]);
            const topicsResult = await pool.query(topicsQuery, [keyword]);
            const initiativesResult = await pool.query(initiativesQuery, [keyword]);
            const productsResult = await pool.query(productsQuery, [keyword]);
            const councilsResult = await pool.query(councilsQuery, [keyword]);
            const reportsResult = await pool.query(reportsQuery, [keyword]);
            const conferencesResult = await pool.query(conferencesQuery, [keyword]);

            result = {
                user: userResult.rows,
                articles: articlesResult.rows,
                documents: documentsResult.rows,
                topic: topicsResult.rows,
                initiatives: initiativesResult.rows,
                products: productsResult.rows,
                councils: councilsResult.rows,
                reports: reportsResult.rows,
                conferences: conferencesResult.rows,
            };
        } else if (type === 'ma') {
            const userQuery = `SELECT * FROM users WHERE msnv = $1`;
            // Tìm kiếm theo mã bảng cụ thể
            const articleQuery = `
                SELECT bbk.*, u.ho_ten, u.don_vi
                FROM bai_bao_khoa_hoc bbk
                JOIN users u ON bbk.msnv = u.msnv
                WHERE ma_bai_bao = $1
            `;
            const documentQuery = `
                SELECT tl.*, u.ho_ten, u.don_vi
                FROM tai_lieu tl
                JOIN users u ON tl.msnv = u.msnv
                WHERE ma_tai_lieu = $1
            `;
            const topicQuery = `
                SELECT dt.*, u.ho_ten, u.don_vi
                FROM nghien_cuu_de_tai dt
                JOIN users u ON dt.msnv = u.msnv
                WHERE ma_de_tai = $1
            `;
            const initiativeQuery = `
                SELECT sk.*, u.ho_ten, u.don_vi
                FROM sang_kien sk
                JOIN users u ON sk.msnv = u.msnv
                WHERE ma_sang_kien = $1
            `;
            const productQuery = `
                SELECT sp.*, u.ho_ten, u.don_vi
                FROM san_pham_khcn sp
                JOIN users u ON sp.msnv = u.msnv
                WHERE ma_san_pham = $1
            `;
            const councilQuery = `
                SELECT hd.*, u.ho_ten, u.don_vi
                FROM hoi_dong hd
                JOIN users u ON hd.msnv = u.msnv
                WHERE ma_hoi_dong = $1
            `;
            const reportQuery = `
                SELECT bckh.*, u.ho_ten, u.don_vi
                FROM bao_cao_khoa_hoc bckh
                JOIN users u ON bckh.msnv = u.msnv
                WHERE ma_bao_cao = $1
            `;
            const conferenceQuery = `
                SELECT hn.*, u.ho_ten, u.don_vi
                FROM hoi_nghi_khoa_hoc hn
                JOIN users u ON hn.msnv = u.msnv
                WHERE ma_hoi_nghi = $1
            `;
            const userResult = await pool.query(userQuery, [keyword]);
            const articleResult = await pool.query(articleQuery, [keyword]);
            const documentResult = await pool.query(documentQuery, [keyword]);
            const topicResult = await pool.query(topicQuery, [keyword]);
            const initiativeResult = await pool.query(initiativeQuery, [keyword]);
            const productResult = await pool.query(productQuery, [keyword]);
            const councilResult = await pool.query(councilQuery, [keyword]);
            const reportResult = await pool.query(reportQuery, [keyword]);
            const conferenceResult = await pool.query(conferenceQuery, [keyword]);

            result = {
                user: userResult.rows,
                articles: articleResult.rows,
                documents: documentResult.rows,
                topic: topicResult.rows,
                initiatives: initiativeResult.rows,
                products: productResult.rows,
                councils: councilResult.rows,
                reports: reportResult.rows,
                conferences: conferenceResult.rows,
            };
        } else {
            return res.status(400).json({ error: 'Invalid search type' });
        }

        return res.json(result);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// account
//register
app.post("/education/register", async (req, res) => {
    const { msnv, ho_ten, mat_khau } = req.body;
    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE msnv = $1', [msnv]);

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Người dùng đã tồn tại' });
        }
        const hashedPassword = await bcrypt.hash(mat_khau, 10);
        const newUser = await pool.query(
            `INSERT INTO users (msnv, ho_ten, mat_khau) 
             VALUES ($1, $2, $3) RETURNING *`,
            [msnv, ho_ten, hashedPassword]
        );
        res.status(201).json(newUser.rows[0]);
        console.log(newUser.rows[0]);
    } catch (error) {
        console.error('Lỗi đăng ký không thành công:', error);
        res.status(500).json({ message: 'Lỗi khi đăng ký người dùng' });
    }
});

// login
app.post('/education/login', async (req, res) => {
    const { msnv, mat_khau } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE msnv = $1', [msnv]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Người dùng không tồn tại' });
        }
        const user = userResult.rows[0];
        //ss pass
        const isPasswordValid = await bcrypt.compare(mat_khau, user.mat_khau);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Mật khẩu không chính xác' });
        }
        const { mat_khau: _, ...userInfo } = user; // Loại bỏ mật khẩu
        res.status(200).json(userInfo);
        console.log(userResult.rows[0]);
    } catch (error) {
        console.error('Lỗi đăng nhập không thành công:', error); // Log lỗi
        res.status(500).json({ message: 'Lỗi khi đăng nhập' });
    }
});

// USER
// Get all User
app.get("/education/users", async (req, res) => {
    try {
        const allUser = await pool.query("SELECT * FROM users");
        res.json(allUser.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
})
// get user
app.get("/education/user/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const user = await pool.query("SELECT * FROM users WHERE msnv = $1", [id]);

        res.json(user.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// Chỉnh sửa thông tin user
app.put("/education/addInf/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            ho_ten, nam_ap_dung, co_so, don_vi, vien_chuc_co_huu, chuc_danh_trinh_do,
            so_gio_nckh_dinh_muc, truong_hop_giam_dinh_muc, ngay_neu_thuoc_case3, dinh_muc_gio_nckh, ghi_chu
        } = req.body;
        // Thêm điều kiện kiểm tra id có tồn tại trong DB không
        const user = await pool.query("SELECT * FROM users WHERE msnv = $1", [id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        // Thực hiện update thông tin user
        const EditUser = await pool.query(
            `UPDATE users 
             SET ho_ten = $1, nam_ap_dung = $2, co_so = $3, don_vi = $4, vien_chuc_co_huu = $5, 
                 chuc_danh_trinh_do = $6, so_gio_nckh_dinh_muc = $7, truong_hop_giam_dinh_muc = $8, 
                 ngay_neu_thuoc_case3 = $9, dinh_muc_gio_nckh = $10, ghi_chu = $11
             WHERE msnv = $12
             RETURNING *`,
            [
                ho_ten, nam_ap_dung, co_so, don_vi, vien_chuc_co_huu,
                chuc_danh_trinh_do, so_gio_nckh_dinh_muc, truong_hop_giam_dinh_muc,
                ngay_neu_thuoc_case3, dinh_muc_gio_nckh, ghi_chu, id
            ]
        );
        // Kiểm tra nếu không có kết quả trả về từ việc update
        if (EditUser.rows.length === 0) {
            return res.status(404).json({ error: "Failed to update user" });
        }

        res.json("Update information success");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});
// Xóa user
app.delete("/education/deleteUsers/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleteUser = await pool.query("DELETE FROM users WHERE msnv = $1", [id]);
        res.json("Delete success");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});
// Get user:id
app.get("/education/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const user = await pool.query("SELECT * FROM users WHERE msnv = $1", [id]);
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
    }
});



//BÀI BÁO KHOA HỌC
// get all bài báo khoa học
app.get("/education/getAllSciArt", async (req, res) => {
    try {
        const getAllSciArt = await pool.query("SELECT * FROM bai_bao_khoa_hoc");
        res.json(getAllSciArt.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});
// get data bài cáo khoa học của user
app.get("/education/getDataArt/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const article = await pool.query(`SELECT * FROM bai_bao_khoa_hoc WHERE ma_bai_bao = $1`, [id]);
        // res.json(doc.rows);
        res.json(article.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})

// get list bài báo khoa học của user
app.get("/education/getArtOfUser/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const article = await pool.query("SELECT * FROM bai_bao_khoa_hoc WHERE msnv = $1", [id]);
        res.json(article.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
//thêm bài báo KH
app.post("/education/AddSciArt", async (req, res) => {
    const { msnv, hoat_dong, ten_bai_bao, doi, ngay, ten_tap_chi, ten_nha_xuat_ban, ngon_ngu, pham_vi_cap_do,
        impact_factor, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien, tong_so_tac_gia, ty_le_dong_gop, gio_quy_doi } = req.body;
    try {
        const addSciArt = await pool.query(
            `INSERT INTO bai_bao_khoa_hoc (
                msnv, hoat_dong, ten_bai_bao, doi, ngay, ten_tap_chi, ten_nha_xuat_ban, ngon_ngu,
           pham_vi_cap_do, impact_factor, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien, tong_so_tac_gia, ty_le_dong_gop, gio_quy_doi
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
            ) RETURNING *`,
            [
                msnv, hoat_dong, ten_bai_bao, doi, ngay, ten_tap_chi, ten_nha_xuat_ban, ngon_ngu,
                pham_vi_cap_do, impact_factor, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien, tong_so_tac_gia, ty_le_dong_gop, gio_quy_doi
            ]
        );
        // Trả về phản hồi thành công
        res.json(addSciArt.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi thêm bài báo" });
    }
});

// chỉnh sửa bài báo khoa học
app.put("/education/editDataArt/:id", async (req, res) => {
    const { id } = req.params;
    const { hoat_dong, ten_bai_bao, doi, ngay, ten_tap_chi, ten_nha_xuat_ban, ngon_ngu,
        pham_vi_cap_do, impact_factor, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien, tong_so_tac_gia, ty_le_dong_gop, gio_quy_doi } = req.body;
    try {
        const editDataTpc = await pool.query(
            `UPDATE bai_bao_khoa_hoc 
             SET hoat_dong = $1, ten_bai_bao = $2, doi = $3, ngay = $4, ten_tap_chi = $5, ten_nha_xuat_ban = $6, 
                 ngon_ngu = $7, pham_vi_cap_do = $8, impact_factor = $9, gio_chuan_hoat_dong = $10, vai_tro = $11, tong_so_thanh_vien = $12, tong_so_tac_gia = $13, ty_le_dong_gop = $14, gio_quy_doi = $15
             WHERE ma_bai_bao = $16
             RETURNING *`,
            [
                hoat_dong, ten_bai_bao, doi, ngay, ten_tap_chi, ten_nha_xuat_ban, ngon_ngu,
                pham_vi_cap_do, impact_factor, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien, tong_so_tac_gia, ty_le_dong_gop, gio_quy_doi, id
            ]
        );
        res.json("Update Bài báo success");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
})
// xóa bài báo khoa học
app.delete("/education/deleteSciArt/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleteSciArt = await pool.query("DELETE FROM bai_bao_khoa_hoc WHERE ma_bai_bao = $1", [id]);
        res.json("Delete success");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});


// ĐỀ TÀI NCKH
// get all đề tài nghiên cứu khoa học
app.get("/education/getAllTopics", async (req, res) => {
    try {
        const getAllTopics = await pool.query("SELECT * FROM nghien_cuu_de_tai");
        res.json(getAllTopics.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// get nghiên cứu đề tài của user
app.get("/education/getDataTpc/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const topic = await pool.query("SELECT * FROM nghien_cuu_de_tai WHERE ma_de_tai = $1", [id]);
        // res.json(doc.rows);
        res.json(topic.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// get list bài nghiên cứu đề tài của user
app.get("/education/getTpcOfUser/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const topic = await pool.query("SELECT * FROM nghien_cuu_de_tai WHERE msnv = $1", [id]);
        res.json(topic.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// chỉnh sửa nghiên cứu đề tài
app.put("/education/editDataTpc/:id", async (req, res) => {
    const { id } = req.params;
    const { hoat_dong, pham_vi_cap_do, ten_de_tai, ma_so_hop_dong, ngay, gio_chuan_hoat_dong, vai_tro,
        so_luong_thanh_vien_vai_tro, ty_le_dong_gop, gio_quy_doi } = req.body;
    try {
        const editDataTpc = await pool.query(
            `UPDATE nghien_cuu_de_tai 
             SET hoat_dong = $1, pham_vi_cap_do = $2, ten_de_tai = $3, ma_so_hop_dong = $4, ngay = $5, gio_chuan_hoat_dong = $6, 
                 vai_tro = $7, so_luong_thanh_vien_vai_tro = $8, ty_le_dong_gop = $9, gio_quy_doi = $10
             WHERE ma_de_tai = $11
             RETURNING *`,
            [
                hoat_dong, pham_vi_cap_do, ten_de_tai, ma_so_hop_dong, ngay, gio_chuan_hoat_dong, vai_tro,
                so_luong_thanh_vien_vai_tro, ty_le_dong_gop, gio_quy_doi, id
            ]
        );
        res.json("Update Topic success");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
})
//thêm nghiên cứu đề tài
app.post("/education/AddSciResTpt", async (req, res) => {
    const { msnv, hoat_dong, pham_vi_cap_do, ten_de_tai, ma_so_hop_dong, ngay, gio_chuan_hoat_dong, vai_tro,
        so_luong_thanh_vien_vai_tro, ty_le_dong_gop, gio_quy_doi } = req.body;
    try {
        const addSciResTpt = await pool.query(
            `INSERT INTO nghien_cuu_de_tai (
                msnv, hoat_dong, pham_vi_cap_do, ten_de_tai, ma_so_hop_dong, ngay, gio_chuan_hoat_dong, vai_tro, 
            so_luong_thanh_vien_vai_tro, ty_le_dong_gop, gio_quy_doi
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) RETURNING *`,
            [
                msnv, hoat_dong, pham_vi_cap_do, ten_de_tai, ma_so_hop_dong, ngay, gio_chuan_hoat_dong, vai_tro,
                so_luong_thanh_vien_vai_tro, ty_le_dong_gop, gio_quy_doi
            ]
        );
        // Trả về phản hồi thành công
        res.json(addSciResTpt.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi thêm đề tài nghiên cứu" });
    }
});
// get all đề tài nghiên cứu
// app.get("/education/getAllSciTpt", async (req, res) => {
//     try {
//         const getAllSciTpt = await pool.query("SELECT * FROM nghien_cuu_de_tai");
//         res.json(getAllSciTpt.rows);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Server error" });
//     }
// });
// xóa đề tài nghiên cứu khoa học
app.delete("/education/deleteSciTpc/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleteSciTpc = await pool.query("DELETE FROM nghien_cuu_de_tai WHERE ma_de_tai = $1", [id]);
        res.json("Delete success");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});



// HỘI ĐỒNG NGHIÊN CỨU KHOA HỌC
// get all hội đồng
app.get("/education/getAllCouncil", async (req, res) => {
    try {
        const getAllCouncil = await pool.query("SELECT * FROM hoi_dong");
        res.json(getAllCouncil.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// get thông tin của hội đồng hiện tại
app.get("/education/getDataCou/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const cou = await pool.query("SELECT * FROM hoi_dong WHERE ma_hoi_dong = $1", [id]);
        // res.json(doc.rows);
        res.json(cou.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// get list hội đồng của user
app.get("/education/getCouOfUser/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const cou = await pool.query("SELECT * FROM hoi_dong WHERE msnv = $1", [id]);
        res.json(cou.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// chỉnh sửa hội đồng
app.put("/education/editDataCou/:id", async (req, res) => {
    const { id } = req.params;
    const { so_quyet_dinh, ngay, vai_tro, gio_quy_doi, ten_de_tai } = req.body;
    try {
        const editDataCou = await pool.query(
            `UPDATE hoi_dong 
             SET so_quyet_dinh = $1, ngay = $2, vai_tro = $3, gio_quy_doi = $4, ten_de_tai = $5
             WHERE ma_hoi_dong = $6
             RETURNING *`,
            [
                so_quyet_dinh, ngay, vai_tro, gio_quy_doi, ten_de_tai, id
            ]
        );
        res.json("Update Council success");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
})
//thêm hội đồng NCKH
app.post("/education/AddSciResCou", async (req, res) => {
    const { msnv, so_quyet_dinh, ngay, vai_tro, gio_quy_doi, ten_de_tai } = req.body;
    try {
        const addSciResCou = await pool.query(
            `INSERT INTO hoi_dong (
                msnv, so_quyet_dinh, ngay, vai_tro, gio_quy_doi, ten_de_tai
            ) VALUES (
                $1, $2, $3, $4, $5, $6
            ) RETURNING *`,
            [
                msnv, so_quyet_dinh, ngay, vai_tro, gio_quy_doi, ten_de_tai
            ]
        );
        // Trả về phản hồi thành công
        res.json(addSciResCou.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi thêm hội đồng NCKH" });
    }
});
// xóa hội đồng
app.delete("/education/deleteCou/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleteCou = await pool.query("DELETE FROM hoi_dong WHERE ma_hoi_dong = $1", [id]);
        res.json("Delete success");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});



// SÁCH, TÀI LIỆU
// get all tài liệu
app.get("/education/getAllDou", async (req, res) => {
    try {
        const getAllDou = await pool.query("SELECT * FROM tai_lieu");
        res.json(getAllDou.rows);
    } catch (err) {
        console.error(err);
        res.json(500).json({ error: "Server error" });
    }
});
// get thông tin bài tài liệu
app.get("/education/getDataDoc/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const doc = await pool.query("SELECT * FROM tai_lieu WHERE ma_tai_lieu = $1", [id]);
        // res.json(doc.rows);
        res.json(doc.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// get list bài tài liệu của user
app.get("/education/getDocOfUser/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const doc = await pool.query("SELECT * FROM tai_lieu WHERE msnv = $1", [id]);
        res.json(doc.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// chỉnh sửa tài liệu 
app.put("/education/editDataDoc/:id", async (req, res) => {
    const { id } = req.params;
    const { hoat_dong, ten_sach, tong_so_trang, ngon_ngu, ngay_xuat_ban, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien,
        tong_so_trang_phu_trach, ty_le_dong_gop, gio_quy_doi, tai_ban } = req.body;
    try {
        const editDataDoc = await pool.query(
            `UPDATE tai_lieu 
             SET hoat_dong = $1, ten_sach = $2, tong_so_trang = $3, ngon_ngu = $4, ngay_xuat_ban = $5, gio_chuan_hoat_dong = $6, 
                 vai_tro = $7, tong_so_thanh_vien = $8, tong_so_trang_phu_trach = $9, ty_le_dong_gop = $10, gio_quy_doi = $11, tai_ban = $12
             WHERE ma_tai_lieu = $13
             RETURNING *`,
            [
                hoat_dong, ten_sach, tong_so_trang, ngon_ngu, ngay_xuat_ban, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien,
                tong_so_trang_phu_trach, ty_le_dong_gop, gio_quy_doi, tai_ban, id
            ]
        );
        res.json("Update Document success");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
})
//thêm tài liệu
app.post("/education/AddDoc", async (req, res) => {
    const { msnv, hoat_dong, ten_sach, tong_so_trang, ngon_ngu, ngay_xuat_ban, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien,
        tong_so_trang_phu_trach, ty_le_dong_gop, gio_quy_doi, tai_ban } = req.body;
    try {
        const addDoc = await pool.query(
            `INSERT INTO tai_lieu (
                msnv, hoat_dong, ten_sach, tong_so_trang, ngon_ngu, ngay_xuat_ban, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien,
                tong_so_trang_phu_trach, ty_le_dong_gop, gio_quy_doi, tai_ban
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            ) RETURNING *`,
            [
                msnv, hoat_dong, ten_sach, tong_so_trang, ngon_ngu, ngay_xuat_ban, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien,
                tong_so_trang_phu_trach, ty_le_dong_gop, gio_quy_doi, tai_ban
            ]
        );
        // Trả về phản hồi thành công
        res.json(addDoc.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi thêm tài liệu" });
    }
});
// xóa tài liệu
app.delete("/education/deleteDoc/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleteDoc = await pool.query("DELETE FROM tai_lieu WHERE ma_tai_lieu = $1", [id]);
        res.json("Delete success");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})



// BÁO CÁO KHOA HỌC
// get all báo cáo khoa học
app.get("/education/getAllSciRep", async (req, res) => {
    try {
        const getAllSciRep = await pool.query("SELECT * FROM bao_cao_khoa_hoc");
        res.json(getAllSciRep.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});
// get thông tin báo cáo khoa học
app.get("/education/getDataRep/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const rep = await pool.query("SELECT * FROM bao_cao_khoa_hoc WHERE ma_bao_cao = $1", [id]);
        // res.json(doc.rows);
        res.json(rep.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// get báo cáo khoa học của user
app.get("/education/getRepOfUser/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const rep = await pool.query("SELECT * FROM bao_cao_khoa_hoc WHERE msnv = $1", [id]);
        res.json(rep.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// chỉnh sửa báo cáo khoa học
app.put("/education/editDataRep/:id", async (req, res) => {
    const { id } = req.params;
    const { hoat_dong, ten_bai_fulltext, ten_de_tai, minh_chung, ten_hoi_nghi, don_vi_to_chuc,
        ngay, pham_vi, giai_thuong, hinh_thuc, gio_quy_doi, tong_so_tac_gia, vai_tro,
        tong_so_tac_gia_vai_tro, ty_le_dong_gop, gio_quy_doi_vai_tro } = req.body;
    try {
        const editDataRep = await pool.query(
            `UPDATE bao_cao_khoa_hoc 
             SET hoat_dong = $1, ten_bai_fulltext = $2, ten_de_tai = $3, minh_chung = $4, 
             ten_hoi_nghi = $5, don_vi_to_chuc = $6, ngay = $7, pham_vi = $8, giai_thuong = $9, hinh_thuc = $10, gio_quy_doi = $11, tong_so_tac_gia = $12, 
             vai_tro = $13, tong_so_tac_gia_vai_tro = $14, ty_le_dong_gop = $15, gio_quy_doi_vai_tro = $16
             WHERE ma_bao_cao = $17
             RETURNING *`,
            [
                hoat_dong, ten_bai_fulltext, ten_de_tai, minh_chung, ten_hoi_nghi, don_vi_to_chuc,
                ngay, pham_vi, giai_thuong, hinh_thuc, gio_quy_doi, tong_so_tac_gia, vai_tro,
                tong_so_tac_gia_vai_tro, ty_le_dong_gop, gio_quy_doi_vai_tro, id
            ]
        );
        res.json("Update report success");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
})
//thêm báo cáo khoa học
app.post("/education/AddSciRpt", async (req, res) => {
    const { msnv, hoat_dong, ten_bai_fulltext, ten_de_tai, minh_chung, ten_hoi_nghi, don_vi_to_chuc,
        ngay, pham_vi, giai_thuong, hinh_thuc, gio_quy_doi, tong_so_tac_gia, vai_tro,
        tong_so_tac_gia_vai_tro, ty_le_dong_gop, gio_quy_doi_vai_tro } = req.body;
    try {
        const addSciRpt = await pool.query(
            `INSERT INTO bao_cao_khoa_hoc (
                msnv, hoat_dong, ten_bai_fulltext, ten_de_tai, minh_chung, ten_hoi_nghi, don_vi_to_chuc,
                ngay, pham_vi, giai_thuong, hinh_thuc, gio_quy_doi, tong_so_tac_gia, vai_tro, 
                tong_so_tac_gia_vai_tro, ty_le_dong_gop, gio_quy_doi_vai_tro
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
            ) RETURNING *`,
            [
                msnv, hoat_dong, ten_bai_fulltext, ten_de_tai, minh_chung, ten_hoi_nghi, don_vi_to_chuc,
                ngay, pham_vi, giai_thuong, hinh_thuc, gio_quy_doi, tong_so_tac_gia, vai_tro,
                tong_so_tac_gia_vai_tro, ty_le_dong_gop, gio_quy_doi_vai_tro
            ]
        );
        // Trả về phản hồi thành công
        res.json(addSciRpt.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi thêm báo cáo khoa học" });
    }
});
// xóa báo cáo khoa học
app.delete("/education/deleteRpt/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleteRpt = await pool.query("DELETE FROM bao_cao_khoa_hoc WHERE ma_bao_cao = $1", [id]);
        res.json("Delete success");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});



// THAM DỰ HỘI NGHỊ KHOA HỌC
//get all hội nghi khoa học
app.get("/education/getAllSciConf", async (req, res) => {
    try {
        const getAllSciConf = await pool.query("SELECT * FROM hoi_nghi_khoa_hoc");
        res.json(getAllSciConf.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// get thông tin bài tài liệu
app.get("/education/getDataCfs/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const cfs = await pool.query("SELECT * FROM hoi_nghi_khoa_hoc WHERE ma_hoi_nghi = $1", [id]);
        // res.json(doc.rows);
        res.json(cfs.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// get tham gia hội nghị của user
app.get("/education/getCfsOfUser/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const cfs = await pool.query("SELECT * FROM hoi_nghi_khoa_hoc WHERE msnv = $1", [id]);
        res.json(cfs.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// chỉnh sửa hội nghị
app.put("/education/editDataCfs/:id", async (req, res) => {
    const { id } = req.params;
    const { hoat_dong, ten_hoi_nghi, don_vi_to_chuc,
        ngay, pham_vi, thoi_luong, gio_chuan_hoat_dong, gio_quy_doi } = req.body;
    try {
        const editDataCfs = await pool.query(
            `UPDATE hoi_nghi_khoa_hoc
             SET hoat_dong = $1, ten_hoi_nghi = $2, don_vi_to_chuc = $3, ngay = $4, 
             pham_vi = $5, thoi_luong = $6, gio_chuan_hoat_dong = $7, gio_quy_doi = $8
             WHERE ma_hoi_nghi = $9
             RETURNING *`,
            [
                hoat_dong, ten_hoi_nghi, don_vi_to_chuc,
                ngay, pham_vi, thoi_luong, gio_chuan_hoat_dong, gio_quy_doi, id
            ]
        );
        res.json("Update conference success");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
})
//thêm tham gia hội nghị
app.post("/education/AddSciCfs", async (req, res) => {
    const { msnv, hoat_dong, ten_hoi_nghi, don_vi_to_chuc,
        ngay, pham_vi, thoi_luong, gio_chuan_hoat_dong, gio_quy_doi } = req.body;
    try {
        const AddSciCfs = await pool.query(
            `INSERT INTO hoi_nghi_khoa_hoc (
                msnv, hoat_dong, ten_hoi_nghi, don_vi_to_chuc, 
                ngay, pham_vi, thoi_luong, gio_chuan_hoat_dong, gio_quy_doi
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9
            ) RETURNING *`,
            [
                msnv, hoat_dong, ten_hoi_nghi, don_vi_to_chuc,
                ngay, pham_vi, thoi_luong, gio_chuan_hoat_dong, gio_quy_doi
            ]
        );
        // Trả về phản hồi thành công
        res.json(AddSciCfs.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi thêm tham gia hội nghị khoa học" });
    }
});
// delete hội nghị khoa học
app.delete("/education/deleteConf/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleteConf = await pool.query("DELETE FROM hoi_nghi_khoa_hoc WHERE ma_hoi_nghi = $1", [id]);
        res.json("Delete success");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});



// SẢN PHẨM
// get all sản phẩm khcn
app.get("/education/getAllSciPro", async (req, res) => {
    try {
        const getAllSciPro = await pool.query("SELECT * FROM san_pham_khcn");
        res.json(getAllSciPro.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// get all sản phẩm của user
app.get("/education/getDataPro/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pro = await pool.query("SELECT * FROM san_pham_khcn WHERE ma_san_pham = $1", [id]);
        // res.json(doc.rows);
        res.json(pro.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// get list sản phẩm khcn của user
app.get("/education/getProOfUser/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pro = await pool.query("SELECT * FROM san_pham_khcn WHERE msnv = $1", [id]);
        res.json(pro.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// chỉnh sửa sản phẩm KHCN
app.put("/education/editDataPro/:id", async (req, res) => {
    const { id } = req.params;
    const { hoat_dong, ten_san_pham, don_vi_cap_chung_nhan, minh_chung, pham_vi,
        ngay, gio_chuan_hoat_dong, ty_le_dong_gop, gio_quy_doi } = req.body;
    try {
        const editDataPro = await pool.query(
            `UPDATE san_pham_khcn 
             SET hoat_dong = $1, ten_san_pham = $2, don_vi_cap_chung_nhan = $3, minh_chung = $4, pham_vi = $5, ngay = $6, 
                 gio_chuan_hoat_dong = $7, ty_le_dong_gop = $8, gio_quy_doi = $9
             WHERE ma_san_pham = $10
             RETURNING *`,
            [
                hoat_dong, ten_san_pham, don_vi_cap_chung_nhan, minh_chung, pham_vi,
                ngay, gio_chuan_hoat_dong, ty_le_dong_gop, gio_quy_doi, id
            ]
        );
        res.json("Update Product success");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
})
//thêm sản phẩm
app.post("/education/AddSciResPro", async (req, res) => {
    const { msnv, hoat_dong, ten_san_pham, don_vi_cap_chung_nhan, minh_chung, pham_vi,
        ngay, gio_chuan_hoat_dong, ty_le_dong_gop, gio_quy_doi } = req.body;
    try {
        const addSciResPro = await pool.query(
            `INSERT INTO san_pham_khcn (
                msnv, hoat_dong, ten_san_pham, don_vi_cap_chung_nhan, minh_chung, pham_vi, 
                ngay, gio_chuan_hoat_dong, ty_le_dong_gop, gio_quy_doi
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            ) RETURNING *`,
            [
                msnv, hoat_dong, ten_san_pham, don_vi_cap_chung_nhan, minh_chung, pham_vi,
                ngay, gio_chuan_hoat_dong, ty_le_dong_gop, gio_quy_doi
            ]
        );
        // Trả về phản hồi thành công
        res.json(addSciResPro.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi thêm sản phẩm" });
    }
});
// xóa sản phẩm khcn
app.delete("/education/deletePro/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletePro = await pool.query("DELETE FROM san_pham_khcn WHERE ma_san_pham = $1", [id]);
        res.json("Delete success");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});




// SÁNG KIẾN, CẢI TIẾN
// get all sáng kiến
app.get("/education/getAllInit", async (req, res) => {
    try {
        const getAllInit = await pool.query("SELECT * FROM sang_kien");
        res.json(getAllInit.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// get all sáng kiến của user
app.get("/education/getInitOfUser/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const init = await pool.query("SELECT * FROM sang_kien WHERE msnv = $1", [id]);
        res.json(init.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
// get thông tin sáng kiến
app.get("/education/getDataInit/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const init = await pool.query("SELECT * FROM sang_kien WHERE ma_sang_kien = $1", [id]);
        // res.json(doc.rows);
        res.json(init.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})
//thêm sáng kiến
app.post("/education/AddInit", async (req, res) => {
    const { msnv, hoat_dong, ten_cong_trinh, ma_so_chung_nhan, ngay, loi_ich,
        so_tien_loi_ich, gio_chuan_hoat_dong, ty_le_dong_gop, gio_quy_doi } = req.body;
    try {
        const addInit = await pool.query(
            `INSERT INTO sang_kien (
                msnv, hoat_dong, ten_cong_trinh, ma_so_chung_nhan, ngay, loi_ich, 
                so_tien_loi_ich, gio_chuan_hoat_dong, ty_le_dong_gop, gio_quy_doi
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            ) RETURNING *`,
            [
                msnv, hoat_dong, ten_cong_trinh, ma_so_chung_nhan, ngay, loi_ich,
                so_tien_loi_ich, gio_chuan_hoat_dong, ty_le_dong_gop, gio_quy_doi
            ]
        );
        // Trả về phản hồi thành công
        res.json(addInit.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi thêm sáng kiến" });
    }
});
// chỉnh sửa sáng kiến
app.put("/education/editDataInit/:id", async (req, res) => {
    const { id } = req.params;
    const { hoat_dong, ten_cong_trinh, ma_so_chung_nhan, ngay, loi_ich,
        so_tien_loi_ich, gio_chuan_hoat_dong, ty_le_dong_gop, gio_quy_doi } = req.body;
    try {
        const editDataInit = await pool.query(
            `UPDATE sang_kien 
             SET hoat_dong = $1, ten_cong_trinh = $2, ma_so_chung_nhan = $3, ngay = $4, loi_ich = $5, so_tien_loi_ich = $6, 
                 gio_chuan_hoat_dong = $7, ty_le_dong_gop = $8, gio_quy_doi = $9
             WHERE ma_sang_kien = $10
             RETURNING *`,
            [
                hoat_dong, ten_cong_trinh, ma_so_chung_nhan, ngay, loi_ich,
                so_tien_loi_ich, gio_chuan_hoat_dong, ty_le_dong_gop, gio_quy_doi, id
            ]
        );
        res.json("Update Initiative success");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
})
// xóa sáng kiến
app.delete("/education/deleteInit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleteInit = await pool.query("DELETE FROM sang_kien WHERE ma_sang_kien = $1", [id]);
        res.json("Delete success");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});




// THỐNG KÊ
// get all record statistics
app.get("/education/getAllStatistics", async (req, res) => {
    try {
        const getAllStatistics = await pool.query("SELECT * FROM thong_ke_cme");
        res.json(getAllStatistics.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})