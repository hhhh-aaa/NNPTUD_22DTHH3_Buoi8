let nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "b8f8d67d3023e9",
        pass: "246e32e6eabf4a"
    }
});

module.exports = {
    sendPassword: async function (email, username, password) {
        await transporter.sendMail({
            from: '"Admin" <admin@nnptud.com>',
            to: email,
            subject: 'Tai khoan cua ban da duoc tao',
            html: `<p>Xin chao <b>${username}</b>,</p>
                   <p>Tai khoan cua ban da duoc tao thanh cong.</p>
                   <p>Mat khau: <b>${password}</b></p>
                   <p>Vui long doi mat khau sau khi dang nhap.</p>`
        });
    }
};
