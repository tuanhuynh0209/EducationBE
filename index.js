const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const cors = require('cors');
const pool = require("./db");

//middleware
app.use(cors());
app.use(express.json());


app.listen(3001, () => {
    console.log('Server is running at port 3001')
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

//Get data
//User
app.get("/education/users", async (req, res) => {
    try {
        const allUser = await pool.query("SELECT * FROM users");
        res.json(allUser.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
})
// get all bài báo khoa học
app.get("/education/getAllSciArt", async(req, res) => {
    try {
        const getAllSciArt = await pool.query("SELECT * FROM bai_bao_khoa_hoc");
        res.json(getAllSciArt.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
    
});
// get all báo cáo khoa học
app.get("/education/getAllSciRep", async(req, res) => {
    try {
        const getAllSciRep = await pool.query("SELECT * FROM bao_cao_khoa_hoc");
        res.json(getAllSciRep.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
});
//get all hội nghi khoa học
app.get("/education/getAllSciConf", async(req, res) => {
    try {
        const getAllSciConf = await pool.query("SELECT * FROM hoi_nghi_khoa_hoc");
        res.json(getAllSciConf.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
});
// get all đề tài nghiên cứu
app.get("/education/getAllSciTpt", async(req, res) => {
    try {
        const getAllSciTpt = await pool.query("SELECT * FROM nghien_cuu_de_tai");
        res.json(getAllSciTpt.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
});
// get all sản phẩm khcn
app.get("/education/getAllSciPro", async(req, res) => {
    try {
        const getAllSciPro = await pool.query("SELECT * FROM san_pham_khcn");
        res.json(getAllSciPro.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
});
// get all sáng kiến
app.get("/education/getAllInit", async(req, res) => {
    try {
        const getAllInit = await pool.query("SELECT * FROM sang_kien");
        res.json(getAllInit.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
});
// get all tài liệu
app.get("/education/getAllDou", async(req, res) => {
    try {
        const getAllDou = await pool.query("SELECT * FROM tai_lieu");
        res.json(getAllDou.rows);
    } catch (err) {
        console.error(err);
        res.json(500).json({error: "Server error"});
    }
});
// get all hội đồng
app.get("/education/getAllCouncil", async(req, res) => {
    try {
        const getAllCouncil = await pool.query("SELECT * FROM hoi_dong");
        res.json(getAllCouncil.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
});
// get all record sta
app.get("/education/getAllStatistics", async(req, res) => {
    try {
        const getAllStatistics = await pool.query("SELECT * FROM thong_ke_cme");
        res.json(getAllStatistics.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
})

// Thêm người dùng mới
app.post("/education/users", async (req, res) => {
    try {
        const {
            msnv, ho_ten, nam_ap_dung, co_so, don_vi, vien_chuc_co_huu, chuc_danh_trinh_do,
            so_gio_nckh_dinh_muc, truong_hop_giam_dinh_muc, ngay_neu_thuoc_case3, ghi_chu, mat_khau
        } = req.body;
        // Kiểm tra nếu thiếu thông tin bắt buộc
        if (!msnv || !ho_ten || !mat_khau) {
            return res.status(400).json({ error: "Mã số nhân viên, họ tên và mật khẩu là bắt buộc" });
        }
        const newUser = await pool.query(
            `INSERT INTO users (
                msnv, ho_ten, nam_ap_dung, co_so, don_vi, vien_chuc_co_huu, 
                chuc_danh_trinh_do, so_gio_nckh_dinh_muc, truong_hop_giam_dinh_muc, 
                ngay_neu_thuoc_case3, ghi_chu, mat_khau
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            ) RETURNING *`,
            [
                msnv, ho_ten, nam_ap_dung, co_so, don_vi, vien_chuc_co_huu,
                chuc_danh_trinh_do, so_gio_nckh_dinh_muc, truong_hop_giam_dinh_muc, ngay_neu_thuoc_case3, ghi_chu, mat_khau
            ]
        );
        // Trả về phản hồi thành công
        res.json(newUser.rows[0]);
        // console.log(res.status(200), "thêm user thành công");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi thêm người dùng" });
    }
});

// Chỉnh sửa thông tin user
app.put("/education/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            msnv, ho_ten, nam_ap_dung, co_so, don_vi, vien_chuc_co_huu, chuc_danh_trinh_do,
            so_gio_nckh_dinh_muc, truong_hop_giam_dinh_muc, ngay_neu_thuoc_case3, ghi_chu, mat_khau
        } = req.body;

        const EditUser = await pool.query(
            `UPDATE users 
             SET msnv = $1, ho_ten = $2, nam_ap_dung = $3, co_so = $4, don_vi = $5, vien_chuc_co_huu = $6, 
                 chuc_danh_trinh_do = $7, so_gio_nckh_dinh_muc = $8, truong_hop_giam_dinh_muc = $9, 
                 ngay_neu_thuoc_case3 = $10, ghi_chu = $11, mat_khau = $12
             WHERE msnv = $13
             RETURNING *`,
            [
                msnv, ho_ten, nam_ap_dung, co_so, don_vi, vien_chuc_co_huu,
                chuc_danh_trinh_do, so_gio_nckh_dinh_muc, truong_hop_giam_dinh_muc,
                ngay_neu_thuoc_case3, ghi_chu, mat_khau, id
            ]
        );

        res.json("Update information success");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// Xóa user
app.delete("/education/users/:id", async (req, res) => {
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
        console, error(err.message);
    }
});

//Bài báo khoa học
//thêm bài báo KH
app.post("/education/AddSciArt", async (req, res) => {
    const { msnv, ho_ten, hoat_dong, ten_bai_bao, doi, ngay, ten_tap_chi, ten_nha_xuat_ban, ngon_ngu, pham_vi_cap_do,
        impact_factor, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien, tong_so_tac_gia, ty_le_dong_gop, gio_quy_doi } = req.body;
    try {
        const addSciArt = await pool.query(
            `INSERT INTO bai_bao_khoa_hoc (
                msnv, ho_ten, hoat_dong, ten_bai_bao, doi, ngay, ten_tap_chi, ten_nha_xuat_ban, ngon_ngu,
           pham_vi_cap_do, impact_factor, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien, tong_so_tac_gia, ty_le_dong_gop, gio_quy_doi
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            ) RETURNING *`,
            [
                msnv, ho_ten, hoat_dong, ten_bai_bao, doi, ngay, ten_tap_chi, ten_nha_xuat_ban, ngon_ngu,
                pham_vi_cap_do, impact_factor, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien, tong_so_tac_gia, ty_le_dong_gop, gio_quy_doi
            ]
        );
        // Trả về phản hồi thành công
        res.json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi thêm người dùng" });
    }
});

// Chỉnh sửa bài báo khoa học
app.put("/education/editSciArt/:id", async(req, res) => {
    const { id } = req.params;
    const { hoat_dong, ten_bai_bao, doi, ngay, ten_tap_chi, ten_nha_xuat_ban, ngon_ngu, pham_vi_cap_do,
        impact_factor, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien, tong_so_tac_gia, ty_le_dong_gop, gio_quy_doi } = req.body;
    try {
        const editSciArt = await pool.query(
            `UPDATE bai_bao_khoa_hoc 
             SET hoat_dong = $1, ten_bai_bao = $2, doi = $3, ngay = $4, ten_tap_chi = $5, ten_nha_xuat_ban = $6, 
                 ngon_ngu = $7, pham_vi = $8, cap_do = $9, impact_factor = $10, gio_chuan_hoat_dong = $11, vai_tro = $12, tong_so_thanh_vien = $13, tong_so_tac_gia = $14, ty_le_dong_gop = $15, gio_quy_doi = $16
             WHERE msnv = $17
             RETURNING *`,
            [
                hoat_dong, ten_bai_bao, doi, ngay, ten_tap_chi, ten_nha_xuat_ban, ngon_ngu, pham_vi_cap_do,
                impact_factor, gio_chuan_hoat_dong, vai_tro, tong_so_thanh_vien, tong_so_tac_gia, ty_le_dong_gop, gio_quy_doi
            ]
        );
        res.json("Update information success");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
})

// xóa bài báo khoa học
app.delete("/education/deleteSciArt/:id", async(req, res) => {
    try {
        const {id} = req.params;
        const deleteSciArt = await pool.query("DELETE FROM bai_bao_khoa_hoc WHERE ma_bai_bao = $1", [id]);
        res.json("Delete success");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
})







