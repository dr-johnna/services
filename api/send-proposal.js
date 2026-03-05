// api/send-proposal.js
// Vercel serverless function — place this at /api/send-proposal.js in your repo root
// Requires: RESEND_API_KEY set in Vercel environment variables

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, message, savedServices } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const servicesSection = savedServices && savedServices.length > 0
    ? `<h3 style="color:#202020; margin-top:24px;">Services of Interest</h3>
       <ul style="padding-left:20px; color:#333;">
         ${savedServices.map(s => `<li style="margin-bottom:6px;">${s}</li>`).join('')}
       </ul>`
    : '';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #202020;">
      <div style="background: #F0F87C; padding: 24px 32px;">
        <h1 style="margin:0; font-size:1.4rem; letter-spacing:0.05em;">NEW PROPOSAL REQUEST</h1>
        <p style="margin:4px 0 0; font-size:0.85rem; opacity:0.7;">services.drjohnna.co</p>
      </div>
      <div style="padding: 32px; background: #FEFCF9; border: 1px solid #eee;">
        <table style="width:100%; border-collapse:collapse;">
          <tr><td style="padding:8px 0; font-weight:700; width:120px;">Name</td><td style="padding:8px 0;">${name}</td></tr>
          <tr><td style="padding:8px 0; font-weight:700;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#202020;">${email}</a></td></tr>
          ${company ? `<tr><td style="padding:8px 0; font-weight:700;">Company</td><td style="padding:8px 0;">${company}</td></tr>` : ''}
        </table>
        <h3 style="margin-top:24px; margin-bottom:8px; color:#202020;">Message</h3>
        <p style="white-space:pre-wrap; color:#333; line-height:1.6;">${message}</p>
        ${servicesSection}
      </div>
      <div style="padding:16px 32px; background:#202020; color:#FEFCF9; font-size:0.8rem; text-align:center;">
        Dr. Johnna Consulting — services.drjohnna.co
      </div>
    </div>
  `;

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Dr. Johnna Consulting <j@doctorjohnna.com>',
        to: ['j@doctorjohnna.com'],
        reply_to: email,
        subject: `New Proposal Request from ${name}`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      console.error('Resend error:', err);
      throw new Error('Resend failed');
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
