import User from '../models/User';
import { Resend } from 'resend';
import logger from '../utils/logger';

const SITE_URL = process.env.FRONTEND_URL || 'https://www.petshiwu.com';
const FROM = 'Petshiwu <noreply@petshiwu.com>';

// ─── Email HTML ────────────────────────────────────────────────────
function buildBirthdayHtml(petName: string, parentName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Happy Birthday ${petName}! 🎂</title>
</head>
<body style="margin:0;padding:0;background:#fff8f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#ff6b35,#f7c948);padding:36px 32px;text-align:center;">
            <p style="margin:0 0 12px;font-size:64px;line-height:1;">🎂</p>
            <h1 style="margin:0 0 8px;color:#ffffff;font-size:34px;font-weight:800;text-shadow:0 2px 4px rgba(0,0,0,0.15);">
              Happy Birthday, ${petName}!
            </h1>
            <p style="margin:0;color:#fff3cd;font-size:16px;font-weight:500;">
              Today is their special day 🐾
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 24px;">
            <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.7;">
              Hi ${parentName}! 👋
            </p>
            <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.7;">
              The whole Petshiwu team is wishing <strong>${petName}</strong> the happiest birthday ever!
              🎉 Every great birthday deserves a treat — so here's a little gift from us to your furry friend.
            </p>

            <!-- Promo code box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#fff8f0;border:2px dashed #f7c948;border-radius:12px;padding:24px;text-align:center;">
                  <p style="margin:0 0 6px;font-size:12px;color:#92400e;letter-spacing:2px;text-transform:uppercase;font-weight:600;">
                    🎁 Birthday Gift Code
                  </p>
                  <p style="margin:0 0 4px;font-size:38px;font-weight:900;letter-spacing:6px;color:#ff6b35;">
                    BDAYGIFT
                  </p>
                  <p style="margin:4px 0 0;font-size:14px;color:#92400e;font-weight:500;">
                    $5 OFF your next order — valid today only!
                  </p>
                </td>
              </tr>
            </table>

            <!-- How to redeem -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9fafb;border-radius:10px;padding:20px;margin-bottom:28px;">
              <tr>
                <td style="padding:0 0 8px;">
                  <p style="margin:0;font-size:14px;font-weight:700;color:#374151;">How to use your gift:</p>
                </td>
              </tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">1. Visit <a href="${SITE_URL}" style="color:#ff6b35;text-decoration:none;font-weight:600;">petshiwu.com</a></td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">2. Add ${petName}'s favorite treats or toys to your cart 🛒</td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">3. Enter <strong>BDAYGIFT</strong> at checkout for $5 off</td></tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="${SITE_URL}" style="display:inline-block;background:#ff6b35;color:#ffffff;
                    font-size:17px;font-weight:700;padding:16px 48px;border-radius:8px;
                    text-decoration:none;letter-spacing:0.5px;">
                    🎁 Shop Birthday Treats
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.6;
              border-top:1px solid #f3f4f6;padding-top:20px;text-align:center;">
              Wishing ${petName} a day full of cuddles, belly rubs, and treats! 🐾<br/>
              — The Petshiwu Team
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
              <a href="${SITE_URL}" style="color:#ff6b35;text-decoration:none;">petshiwu.com</a>
              &nbsp;|&nbsp;
              <a href="mailto:support@petshiwu.com" style="color:#ff6b35;text-decoration:none;">support@petshiwu.com</a>
            </p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">
              37-68 74th St, Jackson Heights, NY 11372
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Send birthday email via Resend ───────────────────────────────
async function sendBirthdayWish(
  petName: string,
  parentName: string,
  parentEmail: string
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY not set — birthday email skipped');
    return;
  }
  const resend = new Resend(resendApiKey);
  await resend.emails.send({
    from: FROM,
    to: [parentEmail],
    subject: `🎂 Happy Birthday ${petName}! A $5 gift is waiting for you`,
    html: buildBirthdayHtml(petName, parentName),
  });
  logger.info(`🎂 Birthday email sent for ${petName} → ${parentEmail}`);
}

// ─── Daily birthday check ─────────────────────────────────────────
export async function checkAndSendBirthdayEmails(): Promise<void> {
  try {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayMMDD = `${mm}-${dd}`;
    const currentYear = today.getFullYear();

    logger.info(`🎂 Birthday worker running — checking for ${todayMMDD} birthdays`);

    // Find all users who have a pet with today's birthday and haven't been emailed this year
    const users = await User.find({
      'pets': {
        $elemMatch: {
          birthdayMMDD: todayMMDD,
          $or: [
            { birthdayEmailSentYear: { $exists: false } },
            { birthdayEmailSentYear: { $ne: currentYear } }
          ]
        }
      },
      isActive: true
    });

    logger.info(`Found ${users.length} user(s) with birthdays today`);

    for (const user of users) {
      for (const pet of user.pets) {
        if (
          pet.birthdayMMDD === todayMMDD &&
          pet.birthdayEmailSentYear !== currentYear
        ) {
          try {
            await sendBirthdayWish(
              pet.petName,
              user.firstName,
              user.email
            );
            // Mark as sent this year
            pet.birthdayEmailSentYear = currentYear;
          } catch (emailErr) {
            logger.error(`Failed to send birthday email for ${pet.petName} to ${user.email}:`, emailErr);
          }
        }
      }
      await user.save();
    }

    logger.info('🎂 Birthday worker finished');
  } catch (err) {
    logger.error('Birthday worker error:', err);
  }
}

// ─── Worker starter — runs daily at 9 AM ─────────────────────────
export function startBirthdayWorker(): void {
  logger.info('🎂 Birthday worker scheduled (runs daily at 9 AM)');

  const scheduleNextRun = () => {
    const now = new Date();
    const next9AM = new Date(now);
    next9AM.setHours(9, 0, 0, 0);
    // If 9 AM already passed today, schedule for tomorrow
    if (next9AM <= now) {
      next9AM.setDate(next9AM.getDate() + 1);
    }
    const msUntil9AM = next9AM.getTime() - now.getTime();
    logger.info(`🎂 Next birthday check in ${Math.round(msUntil9AM / 1000 / 60)} minutes`);

    setTimeout(async () => {
      await checkAndSendBirthdayEmails();
      scheduleNextRun(); // Schedule next day
    }, msUntil9AM);
  };

  scheduleNextRun();
}
