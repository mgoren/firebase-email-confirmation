/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// TODO: Set these
const FROM = '"PCDC" <contra@portlandcountrydance.org>';
const SUBJECT = 'Portland Megaband Payment Receipt';
const EMAIL_CONTACT = 'contra@portlandcountrydance.org';
const DETAILS_WEBSITE = 'portlandmegaband.com';
const CONTACT_TRACING_LINK = 'https://pcdc.fun/contact-trace';
const WAIVER_LINK = 'https://pcdc.fun/files/PCDC_Events_Waiver.pdf';
const COVID_POLICY_LINK = 'https://pcdc.fun/covid-policy';

// TODO: Set this to match Firebase database path
const CONFIG_DATA_PATH = '/orders';

const functions = require('firebase-functions');
const hbs = require('nodemailer-express-handlebars');
const nodemailer = require('nodemailer');
const path = require('path');

// Configure the email transport using the default SMTP transport and a GMail account.
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
// const gmailEmail = functions.config().gmail.email;
// const gmailPassword = functions.config().gmail.password;
// const mailTransport = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: gmailEmail,
//     pass: gmailPassword,
//   },
// });

// Configure the email transport using Sendgrid with SMTP
// TODO: Configure the `sendgrid.api_key` Google Cloud environment variable.
const mailTransport = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
      user: "apikey",
      pass: functions.config().sendgrid.api_key
  }
})

const handlebarOptions = {
  viewEngine: {
      partialsDir: path.resolve('./views/'),
      defaultLayout: false,
  },
  viewPath: path.resolve('./views/'),
};

// use a template file with nodemailer
mailTransport.use('compile', hbs(handlebarOptions))

exports.sendEmailConfirmation = functions.database.ref(`${CONFIG_DATA_PATH}/{ITEM}`).onCreate(async (snap) => {
  const order = snap.val();
  const mailtoLink = `mailto:${EMAIL_CONTACT}`;
  const websiteLink = `https://${DETAILS_WEBSITE}`;
  const admissionTotal = order.admissionQuantity * order.admissionCost;
  const donation = order.donation > 0;
  const mailOptions = {
    from: FROM,
    to: order.email,
    subject: SUBJECT,
    template: 'email',
    context: {
      order: order,
      EMAIL_CONTACT: EMAIL_CONTACT,
      DETAILS_WEBSITE: DETAILS_WEBSITE,
      CONTACT_TRACING_LINK: CONTACT_TRACING_LINK,
      WAIVER_LINK: WAIVER_LINK,
      COVID_POLICY_LINK: COVID_POLICY_LINK,
      mailtoLink: mailtoLink,
      websiteLink: websiteLink,
      admissionTotal: admissionTotal,
      donation: donation
    }
  };

  // mailOptions.text = 'Thanks you for subscribing to our newsletter. You will receive our next weekly newsletter.';
  // mailOptions.html = `
  //   <p>Thanks you for subscribing to our newsletter. You will receive our next weekly newsletter.</p>
  // `;

  try {
    await mailTransport.sendMail(mailOptions);
    functions.logger.log(
      `Receipt sent to:`,
      order.email
    );
  } catch(error) {
    functions.logger.error(
      'There was an error while sending the email:',
      error
    );
  }
  return null;
});
