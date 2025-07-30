const nodemailer = require("nodemailer");


const sendMail = async (to,subject,text) => {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'insakaldev@gmail.com',
          pass: 'vubt mrff jyex kuhi'
        }
      });
      
      var mailOptions = {
        from: 'insakaldev@gmail.com',
        to: to,
        subject:subject,
        text: text
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
          return
        }
      });
};


module.exports = {sendMail}
