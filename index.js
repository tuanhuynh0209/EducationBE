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

// DONE

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
// Thêm người dùng mới
// app.post("/education/addInf/:id", async (req, res) => {
//     try {
//         const id = req.params;
//         const {
//             ho_ten, nam_ap_dung, co_so, don_vi, vien_chuc_co_huu, chuc_danh_trinh_do,
//             so_gio_nckh_dinh_muc, truong_hop_giam_dinh_muc, ngay_neu_thuoc_case3, dinh_muc_gio_nckh, ghi_chu
//         } = req.body;
//         const newUser = await pool.query(
//             `INSERT INTO users (
//                ho_ten, nam_ap_dung, co_so, don_vi, vien_chuc_co_huu, 
//                 chuc_danh_trinh_do, so_gio_nckh_dinh_muc, truong_hop_giam_dinh_muc, 
//                 ngay_neu_thuoc_case3, dinh_muc_gio_nckh, ghi_chu
//             ) VALUES (
//                 $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
//             ) RETURNING *`,
//             [
//                 ho_ten, nam_ap_dung, co_so, don_vi, vien_chuc_co_huu,
//                 chuc_danh_trinh_do, so_gio_nckh_dinh_muc, truong_hop_giam_dinh_muc, ngay_neu_thuoc_case3, dinh_muc_gio_nckh, ghi_chu, id
//             ]
//         );
//         // Trả về phản hồi thành công
//         res.json(newUser.rows[0]);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ error: "Có lỗi xảy ra khi thêm người dùng" });
//     }
// });

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
app.get("/education/getAllSciArt", async (req, res) => {
    try {
        const getAllSciArt = await pool.query("SELECT * FROM bai_bao_khoa_hoc");
        res.json(getAllSciArt.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }

});
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
// get all đề tài nghiên cứu
app.get("/education/getAllSciTpt", async (req, res) => {
    try {
        const getAllSciTpt = await pool.query("SELECT * FROM nghien_cuu_de_tai");
        res.json(getAllSciTpt.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
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
        res.status(500).json({ error: "Có lỗi xảy ra khi thêm bài báo" });
    }
});

//thêm hội đồng NCKH
app.post("/education/AddSciResCou", async (req, res) => {
    const { msnv, so_nghi_quyet, ngay, vai_tro, gio_quy_doi, ten_de_tai } = req.body;
    try {
        const AddSciResCou = await pool.query(
            `INSERT INTO hoi_dong (
                msnv, so_nghi_quyet, ngay, vai_tro, gio_quy_doi, ten_de_tai
            ) VALUES (
                $1, $2, $3, $4, $5, $6
            ) RETURNING *`,
            [
                msnv, so_nghi_quyet, ngay, vai_tro, gio_quy_doi, ten_de_tai
            ]
        );
        // Trả về phản hồi thành công
        res.json(AddSciResCou.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi thêm hội đồng NCKH" });
    }
});

//Bài báo khoa học
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

// Chỉnh sửa bài báo khoa học
app.put("/education/editSciArt/:id", async (req, res) => {
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
// xóa sản phẩm khcn
app.delete("/education/deleteProd/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleteProd = await pool.query("DELETE FROM san_pham_khcn WHERE ma_san_pham = $1", [id]);
        res.json("Delete success");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
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




