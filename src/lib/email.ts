import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "MYBC <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mybc-app.vercel.app";

export async function sendReportReadyEmail(params: {
  name: string;
  email: string;
  token: string;
}) {
  const { name, email, token } = params;
  const appLink = `${APP_URL}/app/${token}/hub`;
  const firstName = name.split(" ")[0];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Your MYBC report is ready</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 20px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;">

      <!-- Header -->
      <tr>
        <td style="background:#1f2125;padding:36px 40px 28px;text-align:center;">
          <div style="font-size:13px;font-weight:700;letter-spacing:0.25em;color:rgba(255,255,255,0.5);margin-bottom:6px;">MYBC</div>
          <div style="font-size:11px;letter-spacing:0.18em;color:rgba(255,255,255,0.3);">YOUR BIRTH CODE</div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1f2125;line-height:1.3;">
            Your life code is ready, ${firstName}.
          </p>
          <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
            Your complete personalised report has been generated — ${
              17
            } chapters written specifically from your natal chart, covering your body, mind, career, relationships, and the year ahead.
          </p>

          <!-- CTA button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="${appLink}"
                   style="display:inline-block;background:#1f2125;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:14px;font-size:15px;font-weight:700;letter-spacing:0.02em;">
                  Open my report →
                </a>
              </td>
            </tr>
          </table>

          <!-- Bookmark notice -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
            <tr>
              <td style="background:#f7f7f5;border-radius:12px;padding:16px 18px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#999;">YOUR PERSONAL LINK</p>
                <p style="margin:0 0 10px;font-size:12px;color:#333;word-break:break-all;line-height:1.5;">${appLink}</p>
                <p style="margin:0;font-size:12px;color:#999;line-height:1.5;">
                  Bookmark this link — it is your permanent access to your report. Keep this email as a backup.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:0 40px 36px;">
          <p style="margin:0;font-size:11px;color:#bbb;line-height:1.6;text-align:center;">
            This report was generated for ${name} and is private to you.<br />
            © MYBC · <a href="https://mindyourbirthcode.com" style="color:#bbb;">mindyourbirthcode.com</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = `Your life code is ready, ${firstName}.

Your complete MYBC report is ready — 17 chapters written from your natal chart.

Open your report here:
${appLink}

Bookmark this link — it is your permanent access to your report.

MYBC · mindyourbirthcode.com`;

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Your MYBC report is ready, ${firstName}`,
      html,
      text,
    });
  } catch (err) {
    // Email is non-critical — log but don't fail the generation
    console.error("Failed to send report-ready email:", err);
  }
}
