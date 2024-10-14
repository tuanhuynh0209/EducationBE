const express = require('express');
const app = express();
const cors = require('cors');
const pool = require("./db");

//middleware
app.use(cors());
app.use(express.json());


app.listen(3001, () => {
    console.log('Server is running at port 3001')
});

//Get data
//User
app.get("/education/users", async(req, res) =>{
    try {
        const allUser = await pool.query("SELECT * FROM users");
        res.json(allUser.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
})
//


// Thêm người dùng mới
app.post("/education/users", async (req, res) => {
    try {
        const {
            msnv,
            ho_ten,
            nam_ap_dung,
            co_so,
            don_vi,
            vien_chuc_co_huu,
            chuc_danh_trinh_do,
            so_gio_nckh_dinh_muc,
            truong_hop_giam_dinh_muc,
            ngay_neu_thuoc_case3,
            ghi_chu,
            mat_khau
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
                chuc_danh_trinh_do, so_gio_nckh_dinh_muc, truong_hop_giam_dinh_muc,ngay_neu_thuoc_case3, ghi_chu, mat_khau
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
            msnv, // New mã số nhân viên
            ho_ten,
            nam_ap_dung,
            co_so,
            don_vi,
            vien_chuc_co_huu,
            chuc_danh_trinh_do,
            so_gio_nckh_dinh_muc,
            truong_hop_giam_dinh_muc,
            ngay_neu_thuoc_case3,
            ghi_chu,
            mat_khau
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
app.get("/education/users/:id", async(req, res) => {
    try {
        const {id} = req.params;
        const user = await pool.query("SELECT * FROM users WHERE msnv = $1", [id]);
        res.json(user.rows[0]);
    } catch (err) {
        console,error(err.message);
    }
})


